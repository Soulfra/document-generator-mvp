"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwaggerMiddleware = createSwaggerMiddleware;
exports.documentRoute = documentRoute;
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openapi_generator_service_1 = require("../services/docs/openapi-generator.service");
const logger_1 = require("../utils/logger");
const defaultOptions = {
    basePath: '/api/docs',
    title: 'FinishThisIdea API',
    version: '1.0.0',
    description: 'Complete API documentation for FinishThisIdea platform',
    contact: {
        name: 'FinishThisIdea Team',
        email: 'api@finishthisidea.com'
    },
    license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
    },
    servers: [
        {
            url: process.env.API_URL || 'http://localhost:3000',
            description: 'Current environment'
        }
    ],
    authentication: true
};
function createSwaggerMiddleware(app, options = {}) {
    const config = { ...defaultOptions, ...options };
    const router = (0, express_1.Router)();
    const generator = new openapi_generator_service_1.OpenAPIGenerator();
    async function generateSpec() {
        try {
            const routes = extractExpressRoutes(app);
            const spec = await generator.generateFromRoutes(routes);
            spec.info = {
                title: config.title,
                version: config.version,
                description: config.description,
                termsOfService: config.termsOfService,
                contact: config.contact,
                license: config.license
            };
            spec.servers = config.servers;
            if (config.authentication) {
                spec.components = spec.components || {};
                spec.components.securitySchemes = {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'JWT token authentication'
                    },
                    apiKey: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'X-API-Key',
                        description: 'API key authentication'
                    }
                };
                spec.security = [
                    { bearerAuth: [] },
                    { apiKey: [] }
                ];
            }
            spec.components.schemas = {
                ...spec.components.schemas,
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' },
                        message: { type: 'string' },
                        code: { type: 'string' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                            type: 'object',
                            properties: {
                                items: { type: 'array', items: {} },
                                total: { type: 'integer' },
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                hasMore: { type: 'boolean' }
                            }
                        }
                    }
                }
            };
            return spec;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate OpenAPI spec', error);
            throw error;
        }
    }
    const swaggerUiOptions = {
        customCss: config.customCss || `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 20px }
      .swagger-ui .scheme-container { display: none }
    `,
        customSiteTitle: config.title,
        customfavIcon: config.customFavIcon || '/favicon.ico',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            displayOperationId: false,
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: 'list',
            syntaxHighlight: {
                activate: true,
                theme: 'monokai'
            }
        }
    };
    router.get('/openapi.json', async (req, res) => {
        try {
            const spec = await generateSpec();
            res.json(spec);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to generate OpenAPI specification'
            });
        }
    });
    router.get('/openapi.yaml', async (req, res) => {
        try {
            const spec = await generateSpec();
            const yaml = require('js-yaml').dump(spec);
            res.type('yaml').send(yaml);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to generate OpenAPI specification'
            });
        }
    });
    router.use('/', async (req, res, next) => {
        try {
            const spec = process.env.NODE_ENV === 'development'
                ? await generateSpec()
                : await getCachedSpec();
            swagger_ui_express_1.default.setup(spec, swaggerUiOptions)(req, res, next);
        }
        catch (error) {
            next(error);
        }
    }, swagger_ui_express_1.default.serve);
    let cachedSpec = null;
    async function getCachedSpec() {
        if (!cachedSpec) {
            cachedSpec = await generateSpec();
        }
        return cachedSpec;
    }
    router.get('/explorer', (req, res) => {
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${config.title} - API Explorer</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css">
        <style>
          body { margin: 0; padding: 0; font-family: sans-serif; }
          #header { background: #2c3e50; color: white; padding: 20px; }
          #header h1 { margin: 0; }
          #swagger-ui { margin: 20px; }
          .info { display: none; }
        </style>
      </head>
      <body>
        <div id="header">
          <h1>${config.title}</h1>
          <p>${config.description}</p>
        </div>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js"></script>
        <script>
          window.onload = function() {
            SwaggerUIBundle({
              url: "${config.basePath}/openapi.json",
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
              layout: "BaseLayout",
              deepLinking: true,
              persistAuthorization: true,
              displayRequestDuration: true,
              filter: true,
              tryItOutEnabled: true
            });
          }
        </script>
      </body>
      </html>
    `);
    });
    logger_1.logger.info('Swagger UI initialized', {
        basePath: config.basePath,
        title: config.title
    });
    return router;
}
function extractExpressRoutes(app) {
    const routes = [];
    const stack = app._router?.stack || [];
    function extractFromStack(stack, basePath = '') {
        stack.forEach((layer) => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods);
                methods.forEach(method => {
                    routes.push({
                        method: method.toUpperCase(),
                        path: basePath + layer.route.path,
                        handler: layer.route.stack[0]?.handle?.name || 'anonymous'
                    });
                });
            }
            else if (layer.name === 'router' && layer.regexp) {
                const match = layer.regexp.source.match(/\\\/(\w+)/);
                if (match) {
                    const routerPath = `/${match[1]}`;
                    if (layer.handle?.stack) {
                        extractFromStack(layer.handle.stack, basePath + routerPath);
                    }
                }
            }
        });
    }
    extractFromStack(stack);
    return routes;
}
function generateExampleResponse(route) {
    if (route.includes('/auth/login')) {
        return {
            success: true,
            data: {
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                    id: '123',
                    email: 'user@example.com',
                    displayName: 'John Doe'
                }
            }
        };
    }
    if (route.includes('/jobs')) {
        return {
            success: true,
            data: {
                id: 'job-123',
                type: 'cleanup',
                status: 'processing',
                progress: 45,
                createdAt: new Date().toISOString()
            }
        };
    }
    return {
        success: true,
        data: {}
    };
}
function documentRoute(options) {
    return (req, res, next) => {
        req.routeDoc = options;
        next();
    };
}
//# sourceMappingURL=swagger.middleware.js.map
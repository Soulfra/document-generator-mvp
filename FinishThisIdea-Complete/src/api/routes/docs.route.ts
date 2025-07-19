/**
 * API Documentation Routes
 * OpenAPI/Swagger integration with dynamic generation
 */

import { Router } from 'express';
import { openApiGenerator } from '../../services/docs/openapi-generator.service';
import { logger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = Router();

/**
 * Initialize API documentation with existing endpoints
 */
async function initializeDocumentation(): Promise<void> {
  try {
    // Import existing API key documentation
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

    // Register additional core endpoints
    const coreEndpoints = [
      // Health endpoint
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
      // Jobs endpoints
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
      // Upload endpoints
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
      // QR Code endpoints
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
      // Monitoring endpoints
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

    // Import all endpoints
    openApiGenerator.importExistingDocs(apiKeysDocs);
    openApiGenerator.importExistingDocs({ endpoints: coreEndpoints });

    logger.info('API documentation initialized', {
      stats: openApiGenerator.getStats()
    });

  } catch (error) {
    logger.error('Failed to initialize API documentation', error);
  }
}

/**
 * Generate Swagger UI HTML
 */
function generateSwaggerUI(specUrl: string): string {
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

/**
 * GET /api/docs
 * Swagger UI interface
 */
router.get('/', (req, res) => {
  const specUrl = `${req.protocol}://${req.get('host')}/api/docs/openapi.json`;
  const html = generateSwaggerUI(specUrl);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

/**
 * GET /api/docs/openapi.json
 * OpenAPI specification in JSON format
 */
router.get('/openapi.json', (req, res) => {
  try {
    const spec = openApiGenerator.generateSpec();
    res.json(spec);
  } catch (error) {
    logger.error('Failed to generate OpenAPI spec', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SPEC_GENERATION_FAILED',
        message: 'Failed to generate OpenAPI specification'
      }
    });
  }
});

/**
 * GET /api/docs/openapi.yaml
 * OpenAPI specification in YAML format
 */
router.get('/openapi.yaml', (req, res) => {
  try {
    const yaml = openApiGenerator.generateYAML();
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml);
  } catch (error) {
    logger.error('Failed to generate OpenAPI YAML', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'YAML_GENERATION_FAILED',
        message: 'Failed to generate OpenAPI YAML'
      }
    });
  }
});

/**
 * GET /api/docs/redoc
 * ReDoc documentation interface
 */
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

/**
 * GET /api/docs/postman
 * Generate Postman collection
 */
router.get('/postman', (req, res) => {
  try {
    const spec = openApiGenerator.generateSpec();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Convert OpenAPI to Postman collection format
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

    // Convert paths to Postman requests
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods as any).forEach(([method, operation]: [string, any]) => {
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

          // Add request body if present
          if (operation.requestBody?.content?.['application/json']?.example) {
            (item.request as any).body = {
              mode: "raw",
              raw: JSON.stringify(operation.requestBody.content['application/json'].example, null, 2)
            };
          }

          collection.item.push(item);
        }
      });
    });

    res.json(collection);
  } catch (error) {
    logger.error('Failed to generate Postman collection', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'POSTMAN_GENERATION_FAILED',
        message: 'Failed to generate Postman collection'
      }
    });
  }
});

/**
 * GET /api/docs/stats
 * API documentation statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = openApiGenerator.getStats();
    res.json({
      success: true,
      data: {
        ...stats,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    logger.error('Failed to get documentation stats', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: 'Failed to get documentation statistics'
      }
    });
  }
});

/**
 * POST /api/docs/generate
 * Regenerate documentation (admin only)
 */
router.post('/generate', async (req, res) => {
  try {
    await initializeDocumentation();
    
    // Save to files
    const docsDir = path.join(process.cwd(), 'docs');
    await openApiGenerator.saveToFile(path.join(docsDir, 'openapi.json'), 'json');
    await openApiGenerator.saveToFile(path.join(docsDir, 'openapi.yaml'), 'yaml');
    
    const stats = openApiGenerator.getStats();
    
    res.json({
      success: true,
      message: 'API documentation regenerated successfully',
      data: stats
    });
  } catch (error) {
    logger.error('Failed to regenerate documentation', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGENERATION_FAILED',
        message: 'Failed to regenerate API documentation'
      }
    });
  }
});

// Initialize documentation on module load
initializeDocumentation();

export { router as docsRouter };
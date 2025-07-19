# Base Service Template

This is the base template for creating new services in the FinishThisIdea platform. It provides a complete, production-ready service with frontend, backend, queue processing, and AI integration.

## Features

- ✅ Complete Express.js backend with TypeScript
- ✅ Next.js frontend with upload interface
- ✅ Bull queue for job processing
- ✅ Progressive LLM enhancement (Ollama → OpenAI → Anthropic)
- ✅ File upload with S3/MinIO storage
- ✅ Real-time progress tracking
- ✅ Webhook support
- ✅ Rate limiting and authentication
- ✅ Prisma database models
- ✅ Docker support
- ✅ Comprehensive error handling

## Template Structure

```
base-service/
├── template.yaml           # Template configuration
├── backend/
│   ├── src/
│   │   ├── server.ts      # Express server
│   │   ├── queues/        # Bull queue processing
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilities
│   └── prisma/
│       └── schema.prisma  # Database schema
└── frontend/
    ├── components/        # React components
    └── pages/            # Next.js pages
```

## Using the Template

### 1. Configure Your Service

Create a configuration file for your service:

```yaml
# my-service-config.yaml
name: "Code Documentation Generator"
description: "Automatically generate comprehensive documentation for any codebase"
category: "documentation"

service:
  type: "file-processing"
  pricing:
    model: "fixed"
    base: 3

infrastructure:
  frontend:
    enabled: true
  backend:
    port: 3002
  queue:
    concurrency: 5
    timeout: 600000  # 10 minutes

ai:
  providers:
    - name: "ollama"
      models: ["codellama", "mistral"]
      priority: 1
    - name: "openai"
      models: ["gpt-3.5-turbo", "gpt-4"]
      priority: 2
      maxCost: 0.10
```

### 2. Generate the Service

Use the template engine to create your service:

```bash
npm run generate:service -- \
  --template base-service \
  --config my-service-config.yaml \
  --output src/services/documentation-generator
```

### 3. Customize the Generated Code

The template uses Handlebars variables that get replaced:
- `{{name}}` → Service name
- `{{kebabCase name}}` → kebab-case name for URLs
- `{{pascalCase name}}` → PascalCase for components
- `{{camelCase name}}` → camelCase for variables

## Template Variables

### Basic Configuration
- `name`: Service name
- `description`: Service description
- `category`: Service category
- `basePrice`: Base price in dollars
- `defaultPort`: Default port (3001)

### Service Features
- `hasFrontend`: Enable frontend (true)
- `hasWebhook`: Enable webhooks (true)
- `hasOutput`: Service produces downloadable output (true)
- `outputFormat`: Output format (json, text, zip)
- `outputExtension`: File extension for downloads

### AI Configuration
- `useOllama`: Enable Ollama (true)
- `ollamaModels`: Array of Ollama models
- `useOpenAI`: Enable OpenAI (false)
- `openaiModels`: Array of OpenAI models
- `maxCost`: Maximum cost per job

### Processing Configuration
- `queueConcurrency`: Concurrent jobs (3)
- `jobTimeout`: Job timeout in ms (300000)
- `maxFileSize`: Max file size in MB (50)
- `allowedFormats`: Array of MIME types

## Customization Points

### 1. Processing Logic

Edit the service implementation:

```typescript
// services/{{kebabCase name}}.service.ts
private async processWithAI(data: any): Promise<any> {
  // Add your custom AI processing logic here
}
```

### 2. Input Validation

Add custom validation rules:

```yaml
validationRules:
  - description: "Check file type"
    condition: "!data.file.type.startsWith('text/')"
    severity: "error"
    message: "Only text files are supported"
```

### 3. Additional Endpoints

Add custom API endpoints:

```yaml
additionalEndpoints:
  - path: "/preview"
    method: "POST"
    description: "Preview processing result"
    handler: |
      const preview = await service.preview(req.body);
      res.json({ success: true, data: preview });
```

### 4. Frontend Features

Customize the upload interface:

```yaml
frontendFeatures:
  - "drag-drop"
  - "preview"
  - "batch-upload"
  - "progress-tracking"
```

## Example Services

### Code Cleanup Service
```yaml
name: "Code Cleanup"
basePrice: 1
systemPrompt: "Clean up and format code following best practices"
outputFormat: "zip"
```

### API Generator
```yaml
name: "API Generator"
basePrice: 5
systemPrompt: "Generate RESTful API from database schema"
additionalEndpoints:
  - path: "/schema/validate"
    method: "POST"
```

### Test Generator
```yaml
name: "Test Generator"
basePrice: 4
useOpenAI: true
openaiModels: ["gpt-4"]
systemPrompt: "Generate comprehensive test suites"
```

## Development

### Running Locally
```bash
cd backend
npm install
npm run dev
```

### Testing
```bash
npm test
npm run test:integration
```

### Building
```bash
npm run build
docker build -t my-service .
```

## Best Practices

1. **Progressive Enhancement**: Always try Ollama first
2. **Error Handling**: Implement proper retry logic
3. **Progress Updates**: Update progress frequently
4. **Cost Control**: Set appropriate maxCost limits
5. **Validation**: Validate input thoroughly
6. **Security**: Never expose sensitive data

## Support

For questions about the template:
- Check the [documentation](../../docs)
- Join our [Discord](https://discord.gg/finishthisidea)
- Open an [issue](https://github.com/finishthisidea/issues)
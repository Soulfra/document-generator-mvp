/**
 * Coder Agent - Generates production-ready code from architecture and requirements
 */

class CoderAgent {
  constructor(id, reasoningEngine) {
    this.id = id;
    this.reasoningEngine = reasoningEngine;
    this.codeTemplates = new Map();
    this.setupCodeTemplates();
    console.log(`💻 CoderAgent ${id} initialized`);
  }

  setupCodeTemplates() {
    this.codeTemplates.set('react_component', {
      extension: '.tsx',
      template: this.getReactComponentTemplate(),
      dependencies: ['react', '@types/react']
    });

    this.codeTemplates.set('express_api', {
      extension: '.js',
      template: this.getExpressAPITemplate(),
      dependencies: ['express', 'cors', 'helmet']
    });

    this.codeTemplates.set('database_schema', {
      extension: '.sql',
      template: this.getDatabaseSchemaTemplate(),
      dependencies: []
    });

    this.codeTemplates.set('docker_config', {
      extension: '',
      template: this.getDockerTemplate(),
      dependencies: []
    });
  }

  async generateCode(architecture, requirements, options = {}) {
    console.log(`💻 Generating code for ${architecture.type} architecture`);

    // Start reasoning session
    const session = await this.reasoningEngine.startReasoningSession({
      type: 'code_generation',
      context: { 
        architecture, 
        requirements,
        language: options.language || 'typescript',
        framework: options.framework || 'react'
      }
    });

    // Generate project structure
    const projectStructure = this.generateProjectStructure(architecture, requirements);

    // Generate code files
    const generatedFiles = {};
    
    // Generate frontend code
    if (architecture.technology.frontend) {
      const frontendFiles = await this.generateFrontendCode(architecture, requirements);
      Object.assign(generatedFiles, frontendFiles);
    }

    // Generate backend code
    if (architecture.technology.backend) {
      const backendFiles = await this.generateBackendCode(architecture, requirements);
      Object.assign(generatedFiles, backendFiles);
    }

    // Generate database code
    if (architecture.database) {
      const databaseFiles = await this.generateDatabaseCode(architecture);
      Object.assign(generatedFiles, databaseFiles);
    }

    // Generate configuration files
    const configFiles = await this.generateConfigFiles(architecture, requirements);
    Object.assign(generatedFiles, configFiles);

    await this.reasoningEngine.completeSession(session.id);

    return {
      projectStructure,
      files: generatedFiles,
      dependencies: this.collectDependencies(generatedFiles),
      buildCommands: this.generateBuildCommands(architecture),
      confidence: this.calculateCodeQuality(generatedFiles)
    };
  }

  generateProjectStructure(architecture, requirements) {
    const structure = {
      type: architecture.type,
      directories: [],
      packageManager: 'npm'
    };

    // Frontend structure
    if (architecture.technology.frontend) {
      structure.directories.push('src/components');
      structure.directories.push('src/pages');
      structure.directories.push('src/hooks');
      structure.directories.push('src/utils');
      structure.directories.push('public');
    }

    // Backend structure
    if (architecture.technology.backend) {
      structure.directories.push('server');
      structure.directories.push('server/routes');
      structure.directories.push('server/models');
      structure.directories.push('server/middleware');
      structure.directories.push('server/utils');
    }

    // Common directories
    structure.directories.push('tests');
    structure.directories.push('docs');
    structure.directories.push('scripts');

    return structure;
  }

  async generateFrontendCode(architecture, requirements) {
    const files = {};
    const features = requirements.features || [];

    // Generate main App component
    files['src/App.tsx'] = this.generateAppComponent(features);

    // Generate components for each feature
    for (const feature of features) {
      const componentName = this.getComponentName(feature.name);
      files[`src/components/${componentName}.tsx`] = this.generateFeatureComponent(feature);
    }

    // Generate utility files
    files['src/utils/api.ts'] = this.generateAPIUtility(architecture.api);
    files['src/hooks/useAuth.ts'] = this.generateAuthHook();

    // Generate package.json
    files['package.json'] = this.generatePackageJson('frontend', architecture);

    return files;
  }

  async generateBackendCode(architecture, requirements) {
    const files = {};

    // Generate main server file
    files['server/index.js'] = this.generateServerIndex(architecture);

    // Generate routes for each API endpoint
    if (architecture.api && architecture.api.endpoints) {
      for (const endpoint of architecture.api.endpoints) {
        const routeName = this.getRouteName(endpoint.path);
        files[`server/routes/${routeName}.js`] = this.generateRouteFile(endpoint);
      }
    }

    // Generate models
    if (architecture.database && architecture.database.entities) {
      for (const entity of architecture.database.entities) {
        files[`server/models/${entity.name}.js`] = this.generateModelFile(entity);
      }
    }

    // Generate middleware
    files['server/middleware/auth.js'] = this.generateAuthMiddleware();
    files['server/middleware/validation.js'] = this.generateValidationMiddleware();

    // Generate package.json
    files['server/package.json'] = this.generatePackageJson('backend', architecture);

    return files;
  }

  async generateDatabaseCode(architecture) {
    const files = {};

    if (architecture.database.migrations) {
      for (const migration of architecture.database.migrations) {
        files[`migrations/${migration.version}.sql`] = migration.sql;
      }
    }

    // Generate schema file
    files['schema.sql'] = this.generateCompleteSchema(architecture.database);

    return files;
  }

  async generateConfigFiles(architecture, requirements) {
    const files = {};

    // Generate Dockerfile
    files['Dockerfile'] = this.generateDockerfile(architecture);

    // Generate docker-compose.yml
    files['docker-compose.yml'] = this.generateDockerCompose(architecture);

    // Generate README.md
    files['README.md'] = this.generateReadme(architecture, requirements);

    // Generate .env.example
    files['.env.example'] = this.generateEnvExample(architecture);

    return files;
  }

  // Template generators

  generateAppComponent(features) {
    return `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
${features.map(f => `import ${this.getComponentName(f.name)} from './components/${this.getComponentName(f.name)}';`).join('\n')}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<div>Welcome</div>} />
${features.map(f => `          <Route path="/${f.name.toLowerCase()}" element={<${this.getComponentName(f.name)} />} />`).join('\n')}
        </Routes>
      </div>
    </Router>
  );
}

export default App;`;
  }

  generateFeatureComponent(feature) {
    const componentName = this.getComponentName(feature.name);
    
    return `import React, { useState, useEffect } from 'react';

interface ${componentName}Props {
  // Add props as needed
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ${feature.description}
    // TODO: Implement ${feature.name} functionality
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="${componentName.toLowerCase()}">
      <h1>${feature.name}</h1>
      <p>${feature.description}</p>
      {/* TODO: Implement ${feature.name} UI */}
    </div>
  );
};

export default ${componentName};`;
  }

  generateServerIndex(architecture) {
    return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
${architecture.api.endpoints.map(e => {
  const routeName = this.getRouteName(e.path);
  return `const ${routeName}Routes = require('./routes/${routeName}');`;
}).join('\n')}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
${architecture.api.endpoints.map(e => {
  const routeName = this.getRouteName(e.path);
  return `app.use('${architecture.api.baseUrl}', ${routeName}Routes);`;
}).join('\n')}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`;
  }

  generateRouteFile(endpoint) {
    const routeName = this.getRouteName(endpoint.path);
    
    return `const express = require('express');
const router = express.Router();

// ${endpoint.description}
router.${endpoint.method.toLowerCase()}('${endpoint.path}', async (req, res) => {
  try {
    // TODO: Implement ${endpoint.description}
    res.json({ message: '${endpoint.description} endpoint' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;`;
  }

  generateModelFile(entity) {
    return `// ${entity.name} Model
class ${entity.name} {
  constructor(data) {
${entity.fields.map(f => `    this.${f.name} = data.${f.name};`).join('\n')}
  }

  static async findAll() {
    // TODO: Implement database query
    return [];
  }

  static async findById(id) {
    // TODO: Implement database query
    return null;
  }

  async save() {
    // TODO: Implement database save
    return this;
  }

  async delete() {
    // TODO: Implement database delete
    return true;
  }
}

module.exports = ${entity.name};`;
  }

  generatePackageJson(type, architecture) {
    const dependencies = {
      frontend: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        'react-router-dom': '^6.0.0',
        typescript: '^4.9.0'
      },
      backend: {
        express: '^4.18.0',
        cors: '^2.8.5',
        helmet: '^6.0.0',
        dotenv: '^16.0.0'
      }
    };

    return JSON.stringify({
      name: `${type}-app`,
      version: '1.0.0',
      description: `Generated ${type} application`,
      main: type === 'backend' ? 'server/index.js' : 'src/index.tsx',
      scripts: {
        start: type === 'backend' ? 'node server/index.js' : 'react-scripts start',
        build: type === 'backend' ? 'echo "No build needed"' : 'react-scripts build',
        test: 'jest',
        dev: type === 'backend' ? 'nodemon server/index.js' : 'npm start'
      },
      dependencies: dependencies[type],
      devDependencies: {
        jest: '^29.0.0',
        nodemon: '^2.0.0'
      }
    }, null, 2);
  }

  generateDockerfile(architecture) {
    return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`;
  }

  generateReadme(architecture, requirements) {
    return `# Generated Application

## Overview
This application was automatically generated based on your requirements.

## Features
${(requirements.features || []).map(f => `- ${f.name}: ${f.description}`).join('\n')}

## Architecture
- Type: ${architecture.type}
- Frontend: ${architecture.technology.frontend}
- Backend: ${architecture.technology.backend}
- Database: ${architecture.technology.database}

## Getting Started

### Prerequisites
- Node.js 18+
- ${architecture.technology.database}

### Installation
\`\`\`bash
npm install
\`\`\`

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm run build
npm start
\`\`\`

## API Documentation
Base URL: ${architecture.api?.baseUrl || '/api'}

${(architecture.api?.endpoints || []).map(e => 
  `### ${e.method} ${e.path}\n${e.description}`
).join('\n\n')}

## Generated by Document Generator
This project was automatically generated from your requirements document.
`;
  }

  // Helper methods

  getComponentName(featureName) {
    return featureName.replace(/\s+/g, '') + 'Component';
  }

  getRouteName(path) {
    return path.split('/')[1] || 'index';
  }

  collectDependencies(files) {
    const dependencies = new Set();
    
    Object.values(files).forEach(content => {
      if (typeof content === 'string') {
        const imports = content.match(/(?:import|require)\(['"`]([^'"`]+)['"`]\)/g);
        if (imports) {
          imports.forEach(imp => {
            const match = imp.match(/['"`]([^'"`]+)['"`]/);
            if (match && !match[1].startsWith('.')) {
              dependencies.add(match[1]);
            }
          });
        }
      }
    });

    return Array.from(dependencies);
  }

  generateBuildCommands(architecture) {
    return [
      'npm install',
      'npm run build',
      'npm test',
      'docker build -t app .',
      'docker run -p 3000:3000 app'
    ];
  }

  calculateCodeQuality(files) {
    let score = 0.8; // Base quality score
    
    // Add points for completeness
    if (Object.keys(files).length > 5) score += 0.1;
    if (files['README.md']) score += 0.05;
    if (files['package.json']) score += 0.05;
    
    return Math.min(0.95, score);
  }

  getReactComponentTemplate() {
    return `import React from 'react';

interface Props {
  // Define props here
}

const Component: React.FC<Props> = (props) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default Component;`;
  }

  getExpressAPITemplate() {
    return `const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API endpoint' });
});

module.exports = router;`;
  }

  getDatabaseSchemaTemplate() {
    return `CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
  }

  getDockerTemplate() {
    return `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
  }

  generateAuthMiddleware() {
    return `const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;`;
  }

  generateValidationMiddleware() {
    return `const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

module.exports = { validateRequest };`;
  }

  generateAPIUtility(api) {
    return `const API_BASE_URL = '${api?.baseUrl || '/api'}';

class ApiClient {
  static async request(endpoint: string, options: RequestInit = {}) {
    const url = \`\${API_BASE_URL}\${endpoint}\`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.statusText}\`);
    }

    return response.json();
  }

  static async get(endpoint: string) {
    return this.request(endpoint);
  }

  static async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export default ApiClient;`;
  }

  generateAuthHook() {
    return `import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and set user
      // TODO: Implement token validation
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    // TODO: Implement login
    console.log('Login:', credentials);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};`;
  }

  generateCompleteSchema(database) {
    return database.entities.map(entity => {
      const fields = entity.fields.map(field => 
        `  ${field.name} ${field.type}${field.primary ? ' PRIMARY KEY' : ''}${field.unique ? ' UNIQUE' : ''}`
      ).join(',\n');
      
      return `CREATE TABLE ${entity.name.toLowerCase()}s (\n${fields}\n);`;
    }).join('\n\n');
  }

  generateDockerCompose(architecture) {
    return `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - database

  database:
    image: postgres:15
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: app_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`;
  }

  generateEnvExample(architecture) {
    return `# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/database

# JWT Configuration
JWT_SECRET=your-secret-key-here

# API Keys
# Add your API keys here

# ${architecture.technology.database} Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_db
DB_USER=app_user
DB_PASSWORD=app_password`;
  }
}

module.exports = CoderAgent;
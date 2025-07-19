#!/usr/bin/env node

/**
 * MVP GENERATOR - Generate working MVPs from documents
 * Bypasses shell issues by using direct Node.js execution
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

console.log('🚀 MVP GENERATOR - DOCUMENT TO WORKING MVP');
console.log('==========================================');

class MVPGenerator extends EventEmitter {
  constructor() {
    super();
    this.templates = new Map();
    this.analytics = {
      generated: 0,
      successful: 0,
      failed: 0,
      templates_used: {}
    };
    this.initializeTemplates();
  }

  initializeTemplates() {
    console.log('📋 Initializing templates...');
    
    // Template categories from CLAUDE.template-processor.md
    const templates = {
      'startup-pitch-deck': {
        name: 'Startup Pitch Deck',
        category: 'business-ideas',
        sections: ['problem', 'solution', 'market', 'business-model', 'team', 'traction', 'financials', 'ask'],
        code: this.generateStartupApp.bind(this)
      },
      'technical-spec': {
        name: 'Technical Specification',
        category: 'technical-architecture',
        sections: ['overview', 'architecture', 'api', 'database', 'deployment'],
        code: this.generateTechnicalApp.bind(this)
      },
      'api-backend': {
        name: 'API Backend',
        category: 'development',
        sections: ['endpoints', 'middleware', 'database', 'auth', 'documentation'],
        code: this.generateAPIApp.bind(this)
      },
      'frontend-app': {
        name: 'Frontend Application',
        category: 'development',
        sections: ['components', 'routing', 'state', 'styling', 'deployment'],
        code: this.generateFrontendApp.bind(this)
      }
    };

    Object.entries(templates).forEach(([id, template]) => {
      this.templates.set(id, template);
    });

    console.log(`✅ Loaded ${this.templates.size} templates`);
  }

  async generateMVP(documentPath) {
    console.log(`📄 Processing document: ${documentPath}`);
    
    try {
      // 1. Read and analyze document
      const document = await this.readDocument(documentPath);
      const analysis = await this.analyzeDocument(document);
      
      // 2. Select appropriate template
      const template = this.selectTemplate(analysis);
      
      // 3. Generate MVP code
      const mvp = await this.generateCode(template, analysis);
      
      // 4. Package and export
      const packagedMVP = await this.packageMVP(mvp);
      
      // 5. Update analytics
      this.updateAnalytics(template.name, true);
      
      console.log('🎉 MVP GENERATED SUCCESSFULLY!');
      console.log(`📦 Package: ${packagedMVP.path}`);
      console.log(`🌐 Demo: ${packagedMVP.demoUrl}`);
      
      return packagedMVP;
      
    } catch (error) {
      console.error('❌ MVP Generation failed:', error.message);
      this.updateAnalytics('unknown', false);
      return null;
    }
  }

  async readDocument(documentPath) {
    if (!fs.existsSync(documentPath)) {
      throw new Error(`Document not found: ${documentPath}`);
    }
    
    const content = fs.readFileSync(documentPath, 'utf8');
    const ext = path.extname(documentPath).toLowerCase();
    
    return {
      content,
      format: ext,
      path: documentPath,
      name: path.basename(documentPath, ext)
    };
  }

  async analyzeDocument(document) {
    console.log('🔍 Analyzing document...');
    
    // Simple analysis based on content patterns
    const content = document.content.toLowerCase();
    
    const analysis = {
      intent: 'unknown',
      complexity: 'moderate',
      features: [],
      requirements: [],
      technology: 'web'
    };

    // Detect intent
    if (content.includes('startup') || content.includes('business') || content.includes('pitch')) {
      analysis.intent = 'startup-pitch-deck';
    } else if (content.includes('api') || content.includes('endpoint') || content.includes('backend')) {
      analysis.intent = 'api-backend';
    } else if (content.includes('frontend') || content.includes('react') || content.includes('vue')) {
      analysis.intent = 'frontend-app';
    } else if (content.includes('technical') || content.includes('architecture') || content.includes('system')) {
      analysis.intent = 'technical-spec';
    }

    // Extract features (simple pattern matching)
    const featurePatterns = [
      /(?:need|want|require|should have|feature).*?([a-z\s]+)/gi,
      /(?:user can|users can|able to).*?([a-z\s]+)/gi
    ];

    featurePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        analysis.features.push(...matches.slice(0, 5)); // Limit to 5 features
      }
    });

    console.log(`📊 Analysis: ${analysis.intent} (${analysis.features.length} features)`);
    return analysis;
  }

  selectTemplate(analysis) {
    const template = this.templates.get(analysis.intent);
    if (template) {
      console.log(`🎯 Selected template: ${template.name}`);
      return template;
    }
    
    // Fallback to startup template
    const fallback = this.templates.get('startup-pitch-deck');
    console.log(`🎯 Using fallback template: ${fallback.name}`);
    return fallback;
  }

  async generateCode(template, analysis) {
    console.log(`⚙️ Generating code with ${template.name}...`);
    
    return await template.code(analysis);
  }

  async generateStartupApp(analysis) {
    const app = {
      name: 'StartupMVP',
      type: 'web-app',
      files: {}
    };

    app.files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Startup MVP</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    .section { margin: 20px 0; }
    .problem { background: #ffe6e6; padding: 15px; border-radius: 5px; }
    .solution { background: #e6ffe6; padding: 15px; border-radius: 5px; }
    .features { background: #e6f3ff; padding: 15px; border-radius: 5px; }
    .cta { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Startup MVP</h1>
    
    <div class="section problem">
      <h2>🎯 Problem</h2>
      <p>We solve the problem of turning ideas into working products quickly.</p>
    </div>
    
    <div class="section solution">
      <h2>💡 Solution</h2>
      <p>AI-powered MVP generation that creates working prototypes from documents.</p>
    </div>
    
    <div class="section features">
      <h2>✨ Features</h2>
      <ul>
        ${analysis.features.map(feature => `<li>${feature}</li>`).join('')}
      </ul>
    </div>
    
    <div class="section">
      <button class="cta" onclick="alert('MVP Demo - Contact us!')">Get Started</button>
    </div>
  </div>
</body>
</html>`;

    app.files['app.js'] = `// Startup MVP Backend
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    mvp: 'startup',
    features: ${JSON.stringify(analysis.features)},
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 Startup MVP running on http://localhost:\${PORT}\`);
});`;

    app.files['package.json'] = JSON.stringify({
      name: 'startup-mvp',
      version: '1.0.0',
      description: 'Generated Startup MVP',
      main: 'app.js',
      scripts: {
        start: 'node app.js',
        dev: 'nodemon app.js'
      },
      dependencies: {
        express: '^4.18.2'
      }
    }, null, 2);

    return app;
  }

  async generateTechnicalApp(analysis) {
    const app = {
      name: 'TechnicalMVP',
      type: 'technical-demo',
      files: {}
    };

    app.files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Technical MVP</title>
  <style>
    body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: #1e1e1e; color: #00ff00; }
    .container { max-width: 1000px; margin: 0 auto; }
    .section { margin: 20px 0; border: 1px solid #00ff00; padding: 15px; }
    .code-block { background: #000; padding: 10px; border-radius: 5px; overflow-x: auto; }
    .api-endpoint { background: #001100; padding: 10px; margin: 10px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚙️ Technical MVP</h1>
    
    <div class="section">
      <h2>🏗️ Architecture</h2>
      <div class="code-block">
        <pre>
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway   │────▶│   Backend       │
│   (React/Vue)   │     │   (Express)     │     │   (Node.js)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Database      │
                        │   (MongoDB)     │
                        └─────────────────┘
        </pre>
      </div>
    </div>
    
    <div class="section">
      <h2>🔗 API Endpoints</h2>
      <div class="api-endpoint">
        <strong>GET /api/status</strong> - System status
      </div>
      <div class="api-endpoint">
        <strong>POST /api/data</strong> - Create data
      </div>
      <div class="api-endpoint">
        <strong>GET /api/data</strong> - Retrieve data
      </div>
    </div>
    
    <div class="section">
      <h2>📊 System Status</h2>
      <div id="status">Loading...</div>
    </div>
  </div>
  
  <script>
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        document.getElementById('status').innerHTML = 
          '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
      });
  </script>
</body>
</html>`;

    app.files['server.js'] = `// Technical MVP Server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));
app.use(express.json());

// System status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    mvp: 'technical',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: ${JSON.stringify(analysis.features)},
    timestamp: new Date().toISOString()
  });
});

// Data endpoints
app.post('/api/data', (req, res) => {
  res.json({
    message: 'Data created',
    data: req.body,
    id: Date.now()
  });
});

app.get('/api/data', (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'Sample Data 1' },
      { id: 2, name: 'Sample Data 2' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(\`⚙️ Technical MVP running on http://localhost:\${PORT}\`);
});`;

    app.files['package.json'] = JSON.stringify({
      name: 'technical-mvp',
      version: '1.0.0',
      description: 'Generated Technical MVP',
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js'
      },
      dependencies: {
        express: '^4.18.2'
      }
    }, null, 2);

    return app;
  }

  async generateAPIApp(analysis) {
    const app = {
      name: 'APIMVPs',
      type: 'api-server',
      files: {}
    };

    app.files['api.js'] = `// API MVP Server
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Documentation
app.get('/', (req, res) => {
  res.json({
    name: 'API MVP',
    version: '1.0.0',
    endpoints: [
      'GET / - This documentation',
      'GET /api/health - Health check',
      'GET /api/data - Get all data',
      'POST /api/data - Create new data',
      'GET /api/data/:id - Get specific data',
      'PUT /api/data/:id - Update data',
      'DELETE /api/data/:id - Delete data'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// In-memory data store
let data = [
  { id: 1, name: 'Sample Item 1', created: new Date() },
  { id: 2, name: 'Sample Item 2', created: new Date() }
];

// CRUD operations
app.get('/api/data', (req, res) => {
  res.json(data);
});

app.post('/api/data', (req, res) => {
  const newItem = {
    id: Date.now(),
    ...req.body,
    created: new Date()
  };
  data.push(newItem);
  res.status(201).json(newItem);
});

app.get('/api/data/:id', (req, res) => {
  const item = data.find(d => d.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.put('/api/data/:id', (req, res) => {
  const itemIndex = data.findIndex(d => d.id === parseInt(req.params.id));
  if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });
  
  data[itemIndex] = { ...data[itemIndex], ...req.body, updated: new Date() };
  res.json(data[itemIndex]);
});

app.delete('/api/data/:id', (req, res) => {
  const itemIndex = data.findIndex(d => d.id === parseInt(req.params.id));
  if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });
  
  data.splice(itemIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(\`🔗 API MVP running on http://localhost:\${PORT}\`);
  console.log(\`📚 Documentation: http://localhost:\${PORT}\`);
});`;

    app.files['package.json'] = JSON.stringify({
      name: 'api-mvp',
      version: '1.0.0',
      description: 'Generated API MVP',
      main: 'api.js',
      scripts: {
        start: 'node api.js',
        dev: 'nodemon api.js'
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5'
      }
    }, null, 2);

    return app;
  }

  async generateFrontendApp(analysis) {
    const app = {
      name: 'FrontendMVP',
      type: 'frontend-app',
      files: {}
    };

    app.files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frontend MVP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; }
    .app { min-height: 100vh; display: flex; flex-direction: column; }
    .header { background: #4267B2; color: white; padding: 1rem; }
    .main { flex: 1; padding: 2rem; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .btn { background: #4267B2; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .btn:hover { background: #365899; }
    .feature-list { list-style: none; }
    .feature-list li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    .feature-list li:last-child { border-bottom: none; }
    .status { padding: 1rem; background: #e8f5e8; border-radius: 4px; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="app">
    <header class="header">
      <h1>🎨 Frontend MVP</h1>
      <p>AI-Generated Frontend Application</p>
    </header>
    
    <main class="main">
      <div class="card">
        <h2>Welcome to Your MVP</h2>
        <p>This frontend was generated automatically from your document analysis.</p>
        <div class="status">
          <strong>Status:</strong> <span id="status">Loading...</span>
        </div>
      </div>
      
      <div class="card">
        <h3>Features</h3>
        <ul class="feature-list">
          ${analysis.features.map(feature => `<li>✨ ${feature}</li>`).join('')}
        </ul>
      </div>
      
      <div class="card">
        <h3>Interactive Demo</h3>
        <button class="btn" onclick="addFeature()">Add Feature</button>
        <button class="btn" onclick="showAnalytics()">View Analytics</button>
        <div id="demo-output"></div>
      </div>
    </main>
  </div>
  
  <script>
    // Update status
    document.getElementById('status').textContent = 'Ready';
    
    function addFeature() {
      const output = document.getElementById('demo-output');
      output.innerHTML = '<p>✅ New feature added successfully!</p>';
      setTimeout(() => output.innerHTML = '', 3000);
    }
    
    function showAnalytics() {
      const output = document.getElementById('demo-output');
      output.innerHTML = \`
        <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
          <h4>📊 Analytics</h4>
          <p>Features: ${analysis.features.length}</p>
          <p>Type: ${analysis.intent}</p>
          <p>Generated: \${new Date().toLocaleString()}</p>
        </div>
      \`;
    }
  </script>
</body>
</html>`;

    app.files['app.js'] = `// Frontend MVP Server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

app.get('/api/analytics', (req, res) => {
  res.json({
    features: ${JSON.stringify(analysis.features)},
    intent: '${analysis.intent}',
    generated: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(\`🎨 Frontend MVP running on http://localhost:\${PORT}\`);
});`;

    app.files['package.json'] = JSON.stringify({
      name: 'frontend-mvp',
      version: '1.0.0',
      description: 'Generated Frontend MVP',
      main: 'app.js',
      scripts: {
        start: 'node app.js',
        dev: 'nodemon app.js'
      },
      dependencies: {
        express: '^4.18.2'
      }
    }, null, 2);

    return app;
  }

  async packageMVP(mvp) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const mvpDir = `./generated-mvp/${mvp.name}-${timestamp}`;
    
    // Create directory
    if (!fs.existsSync('./generated-mvp')) {
      fs.mkdirSync('./generated-mvp', { recursive: true });
    }
    fs.mkdirSync(mvpDir, { recursive: true });
    
    // Write all files
    Object.entries(mvp.files).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(mvpDir, filename), content);
    });
    
    // Create README
    const readme = `# ${mvp.name}

Generated MVP - ${new Date().toLocaleString()}

## Quick Start

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Start the application:
   \`\`\`
   npm start
   \`\`\`

3. Open your browser to http://localhost:3000

## Files Generated

${Object.keys(mvp.files).map(file => `- ${file}`).join('\n')}

## Analytics

- Generated: ${new Date().toISOString()}
- Type: ${mvp.type}
- Files: ${Object.keys(mvp.files).length}

---

*Generated by Document Generator MVP System*
`;
    
    fs.writeFileSync(path.join(mvpDir, 'README.md'), readme);
    
    // Create tarball
    const tarPath = `${mvpDir}.tar.gz`;
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      exec(`cd ./generated-mvp && tar -czf ${mvp.name}-${timestamp}.tar.gz ${mvp.name}-${timestamp}`, (error) => {
        if (error) {
          console.log('⚠️ Tarball creation failed, but MVP is ready');
        } else {
          console.log('📦 Tarball created successfully');
        }
        
        resolve({
          path: mvpDir,
          tarball: tarPath,
          demoUrl: `http://localhost:3000`,
          files: Object.keys(mvp.files),
          readme: path.join(mvpDir, 'README.md')
        });
      });
    });
  }

  updateAnalytics(template, success) {
    this.analytics.generated++;
    if (success) {
      this.analytics.successful++;
    } else {
      this.analytics.failed++;
    }
    
    this.analytics.templates_used[template] = (this.analytics.templates_used[template] || 0) + 1;
    
    // Save analytics
    fs.writeFileSync('./mvp-analytics.json', JSON.stringify(this.analytics, null, 2));
  }

  getAnalytics() {
    return {
      ...this.analytics,
      success_rate: this.analytics.generated > 0 ? 
        ((this.analytics.successful / this.analytics.generated) * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// CLI interface
async function main() {
  const generator = new MVPGenerator();
  
  // Check for document argument
  const documentPath = process.argv[2];
  
  if (!documentPath) {
    console.log('Usage: node mvp-generator.js <document-path>');
    console.log('Example: node mvp-generator.js ./business-plan.md');
    return;
  }
  
  try {
    const mvp = await generator.generateMVP(documentPath);
    
    if (mvp) {
      console.log('\n🎉 SUCCESS! MVP Generated:');
      console.log(`📁 Path: ${mvp.path}`);
      console.log(`📦 Tarball: ${mvp.tarball}`);
      console.log(`🌐 Demo: ${mvp.demoUrl}`);
      console.log(`📋 Files: ${mvp.files.join(', ')}`);
      
      console.log('\n📊 Analytics:');
      console.log(JSON.stringify(generator.getAnalytics(), null, 2));
      
      console.log('\n🚀 Next Steps:');
      console.log(`1. cd ${mvp.path}`);
      console.log('2. npm install');
      console.log('3. npm start');
      console.log('4. Open http://localhost:3000');
    }
    
  } catch (error) {
    console.error('💥 MVP Generation failed:', error.message);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = MVPGenerator;
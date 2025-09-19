#!/usr/bin/env node

/**
 * 📄 SIMPLE DOCUMENT PROCESSOR
 * Processes documents through the pipeline without complex dependencies
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'document-processor',
        timestamp: new Date().toISOString()
    });
});

// Process document endpoint
app.post('/api/process', async (req, res) => {
    const { content, type } = req.body;
    
    console.log(`📄 Processing document of type: ${type}`);
    
    // Simulate AI processing
    const analysis = {
        documentType: type || 'general',
        keyPoints: extractKeyPoints(content),
        suggestedMVP: suggestMVP(content),
        technologies: suggestTechnologies(content),
        estimatedTime: '15-30 minutes',
        complexity: assessComplexity(content)
    };
    
    // Simulate code generation
    const generatedCode = generateBasicCode(analysis);
    
    res.json({
        success: true,
        analysis,
        generatedCode,
        nextSteps: [
            'Review generated structure',
            'Customize business logic',
            'Deploy to cloud platform',
            'Connect to databases'
        ]
    });
});

// CryptoZombies-style lesson endpoint
app.get('/api/lesson/:level', (req, res) => {
    const { level } = req.params;
    const lessons = getCryptoZombiesLessons();
    
    res.json(lessons[level] || { error: 'Lesson not found' });
});

// Submit lesson solution
app.post('/api/lesson/:level/submit', (req, res) => {
    const { level } = req.params;
    const { code } = req.body;
    
    const result = checkSolution(level, code);
    
    res.json(result);
});

function extractKeyPoints(content) {
    // Simple keyword extraction
    const keywords = ['api', 'database', 'user', 'auth', 'payment', 'dashboard'];
    const found = keywords.filter(k => content.toLowerCase().includes(k));
    
    return found.length > 0 ? found : ['web application', 'user interface'];
}

function suggestMVP(content) {
    const text = content.toLowerCase();
    
    if (text.includes('ecommerce') || text.includes('shop')) {
        return {
            type: 'E-commerce Platform',
            features: ['Product catalog', 'Shopping cart', 'Payment processing', 'User accounts'],
            estimatedValue: '$5,000-15,000'
        };
    }
    
    if (text.includes('social') || text.includes('community')) {
        return {
            type: 'Social Platform',
            features: ['User profiles', 'Posts/feeds', 'Messaging', 'Groups'],
            estimatedValue: '$8,000-25,000'
        };
    }
    
    return {
        type: 'Web Application',
        features: ['User interface', 'Data management', 'Basic functionality'],
        estimatedValue: '$2,000-8,000'
    };
}

function suggestTechnologies(content) {
    const technologies = {
        frontend: ['React', 'Vue.js', 'HTML/CSS/JS'],
        backend: ['Node.js', 'Express', 'PostgreSQL'],
        deployment: ['Docker', 'Vercel', 'Railway'],
        extras: []
    };
    
    const text = content.toLowerCase();
    
    if (text.includes('payment')) {
        technologies.extras.push('Stripe API');
    }
    
    if (text.includes('auth') || text.includes('login')) {
        technologies.extras.push('Auth0', 'JWT');
    }
    
    if (text.includes('chat') || text.includes('message')) {
        technologies.extras.push('WebSocket', 'Socket.io');
    }
    
    return technologies;
}

function assessComplexity(content) {
    const length = content.length;
    const features = extractKeyPoints(content).length;
    
    if (length > 1000 && features > 3) return 'High';
    if (length > 500 && features > 2) return 'Medium';
    return 'Low';
}

function generateBasicCode(analysis) {
    const mvpType = analysis.suggestedMVP.type;
    
    // Generate basic structure based on MVP type
    const structure = {
        'package.json': generatePackageJson(analysis),
        'server.js': generateServerCode(analysis),
        'public/index.html': generateIndexHTML(analysis),
        'README.md': generateReadme(analysis)
    };
    
    return structure;
}

function generatePackageJson(analysis) {
    return JSON.stringify({
        name: analysis.suggestedMVP.type.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: `Generated MVP: ${analysis.suggestedMVP.type}`,
        main: 'server.js',
        scripts: {
            start: 'node server.js',
            dev: 'nodemon server.js'
        },
        dependencies: {
            express: '^4.18.0',
            cors: '^2.8.5',
            'body-parser': '^1.20.0'
        }
    }, null, 2);
}

function generateServerCode(analysis) {
    return `const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'running',
        mvp: '${analysis.suggestedMVP.type}',
        features: ${JSON.stringify(analysis.suggestedMVP.features)}
    });
});

${analysis.suggestedMVP.features.map(feature => 
    `// ${feature} endpoint
app.get('/api/${feature.toLowerCase().replace(/\\s+/g, '-')}', (req, res) => {
    res.json({ message: '${feature} endpoint working!' });
});`).join('\n\n')}

app.listen(port, () => {
    console.log(\`🚀 ${analysis.suggestedMVP.type} running on port \${port}\`);
});`;
}

function generateIndexHTML(analysis) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${analysis.suggestedMVP.type}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .feature { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🚀 ${analysis.suggestedMVP.type}</h1>
    <p>Generated MVP based on your document analysis</p>
    
    <h2>Features:</h2>
    ${analysis.suggestedMVP.features.map(f => `<div class="feature">${f}</div>`).join('')}
    
    <h2>API Endpoints:</h2>
    <ul>
        <li><a href="/api/status">/api/status</a> - System status</li>
        ${analysis.suggestedMVP.features.map(f => 
            `<li><a href="/api/${f.toLowerCase().replace(/\\s+/g, '-')}">/api/${f.toLowerCase().replace(/\\s+/g, '-')}</a> - ${f}</li>`
        ).join('')}
    </ul>
    
    <script>
        // Basic functionality
        fetch('/api/status')
            .then(r => r.json())
            .then(data => console.log('MVP Status:', data));
    </script>
</body>
</html>`;
}

function generateReadme(analysis) {
    return `# ${analysis.suggestedMVP.type}

Generated MVP based on document analysis.

## Features
${analysis.suggestedMVP.features.map(f => `- ${f}`).join('\n')}

## Technologies
- Frontend: ${analysis.technologies.frontend.join(', ')}
- Backend: ${analysis.technologies.backend.join(', ')}
- Deployment: ${analysis.technologies.deployment.join(', ')}

## Estimated Value
${analysis.suggestedMVP.estimatedValue}

## Getting Started
\`\`\`bash
npm install
npm start
\`\`\`

## API Endpoints
- GET /api/status - System status
${analysis.suggestedMVP.features.map(f => `- GET /api/${f.toLowerCase().replace(/\\s+/g, '-')} - ${f}`).join('\n')}

Generated by Document Generator AI System
`;
}

function getCryptoZombiesLessons() {
    return {
        '1': {
            title: 'Chapter 1: Making Your First Document Processor',
            description: 'Learn to create a function that processes documents and extracts key information',
            characterGuide: '📊 Cal will guide you through systematic document analysis',
            initialCode: `function analyzeDocument(content) {
    // Your code here
    // Extract key points from the document
    // Return an analysis object
}`,
            expectedOutput: 'An analysis object with keyPoints, documentType, and complexity',
            test: 'analyzeDocument("Create a blog platform") should identify blog-related keywords',
            hint: 'Look for keywords like "blog", "post", "user", "comment"',
            solution: `function analyzeDocument(content) {
    const keywords = ['blog', 'post', 'user', 'comment', 'article'];
    const found = keywords.filter(k => content.toLowerCase().includes(k));
    
    return {
        keyPoints: found,
        documentType: found.length > 0 ? 'blog-platform' : 'general',
        complexity: content.length > 100 ? 'medium' : 'low'
    };
}`
        },
        '2': {
            title: 'Chapter 2: Building MVP Structures',
            description: 'Generate the basic structure for different types of applications',
            characterGuide: '🏗️ Ralph will show you how to architect systems',
            initialCode: `function generateMVPStructure(analysisResult) {
    // Your code here
    // Generate file structure based on analysis
    // Return a structure object
}`,
            expectedOutput: 'A structure with package.json, server.js, and other files',
            test: 'Should generate appropriate files for the document type',
            hint: 'Different document types need different file structures'
        }
    };
}

function checkSolution(level, code) {
    const lessons = getCryptoZombiesLessons();
    const lesson = lessons[level];
    
    if (!lesson) {
        return { success: false, message: 'Lesson not found' };
    }
    
    // Simple validation - in real system would run actual tests
    const hasFunction = code.includes('function');
    const hasReturn = code.includes('return');
    
    if (hasFunction && hasReturn) {
        return {
            success: true,
            message: 'Great job! Your solution works perfectly.',
            nextLesson: parseInt(level) + 1,
            skillsGained: ['Problem Solving', 'JavaScript', 'Document Processing'],
            xpGained: 100
        };
    }
    
    return {
        success: false,
        message: 'Not quite right. Make sure you have a function that returns a value.',
        hints: [lesson.hint]
    };
}

app.listen(port, () => {
    console.log(`📄 Simple Document Processor running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`CryptoZombies lessons: http://localhost:${port}/api/lesson/1`);
});

module.exports = app;
#!/usr/bin/env node

/**
 * 🎨 SIMPLE-CANVAS-INTERPRETER
 * Lightweight canvas interpreter that works with existing document generator
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const SmartAnalyzerService = require('./smart-analyzer-service');
const DataFetcherService = require('./services/data-fetcher');

class SimpleCanvasInterpreter {
    constructor() {
        this.app = express();
        this.port = 3008;
        
        // Initialize smart analyzer
        this.analyzer = new SmartAnalyzerService();
        
        // Connect to data fetcher service
        this.dataFetcherUrl = 'http://localhost:3011';
        
        this.businessTemplates = {
            'e-commerce': {
                keywords: ['cart', 'product', 'buy', 'shop', 'payment'],
                description: 'Online store with shopping cart and payments'
            },
            'saas-dashboard': {
                keywords: ['dashboard', 'analytics', 'chart', 'data', 'user'],
                description: 'SaaS dashboard with analytics'
            },
            'landing-page': {
                keywords: ['hero', 'feature', 'contact', 'about', 'home'],
                description: 'Marketing landing page'
            },
            'portfolio': {
                keywords: ['project', 'gallery', 'work', 'portfolio', 'resume'],
                description: 'Professional portfolio site'
            }
        };
        
        this.setupRoutes();
        
        // Start data fetcher if not running
        this.ensureDataFetcherRunning();
    }
    
    setupRoutes() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        // Main canvas interface
        this.app.get('/', (req, res) => {
            res.send(this.generateSimpleCanvasInterface());
        });
        
        // Interpret text input as business idea using smart analyzer
        this.app.post('/interpret-idea', async (req, res) => {
            try {
                const { businessIdea, highlights } = req.body;
                
                // Use smart analyzer for AI-powered analysis
                const analysis = await this.analyzer.analyzeBusinessIdea(businessIdea);
                
                // Get live data if relevant
                const liveData = await this.fetchRelevantData(analysis.concepts);
                
                res.json({
                    interpretation: {
                        businessType: analysis.primaryConcept?.domain || 'general',
                        confidence: analysis.confidence,
                        features: analysis.features.map(f => f.feature),
                        description: analysis.summary,
                        concepts: analysis.concepts,
                        components: analysis.recommendedComponents
                    },
                    suggestions: this.convertToSuggestions(analysis),
                    liveData: liveData,
                    success: true
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Generate whitelabel site
        this.app.post('/generate-site', async (req, res) => {
            try {
                const { template, businessIdea } = req.body;
                
                // Get full analysis first
                const analysis = await this.analyzer.analyzeBusinessIdea(businessIdea);
                
                // Forward to existing document processor with enhanced data
                const docData = this.createEnhancedDocument(businessIdea, template, analysis);
                
                // Send to document processor for MVP generation
                const response = await fetch('http://localhost:3000/api/process-document', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(docData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    res.json(result);
                } else {
                    throw new Error('Document processing failed');
                }
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    generateSimpleCanvasInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Canvas Interpreter - Whitelabel Business Generator</title>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 90%;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.2em;
        }
        
        .idea-input {
            width: 100%;
            min-height: 150px;
            padding: 20px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .idea-input:focus {
            border-color: #4299e1;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }
        
        .highlight-tools {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin: 20px 0;
        }
        
        .highlight-btn {
            padding: 10px 15px;
            border: 2px solid;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            font-weight: bold;
            transition: all 0.2s;
        }
        
        .highlight-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .highlight-action {
            border-color: #8B5CF6;
            color: #8B5CF6;
        }
        
        .highlight-data {
            border-color: #3B82F6;
            color: #3B82F6;
        }
        
        .highlight-nav {
            border-color: #10B981;
            color: #10B981;
        }
        
        .highlight-warning {
            border-color: #F59E0B;
            color: #F59E0B;
        }
        
        .highlight-critical {
            border-color: #DC2626;
            color: #DC2626;
        }
        
        .action-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: #4299e1;
            color: white;
        }
        
        .btn-primary:hover {
            background: #3182ce;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        
        .btn-secondary:hover {
            background: #cbd5e0;
        }
        
        .results {
            margin-top: 30px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 8px;
            display: none;
        }
        
        .suggestions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .suggestion-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .suggestion-card:hover {
            border-color: #4299e1;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .suggestion-card.selected {
            border-color: #4299e1;
            background: #ebf8ff;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4299e1;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        
        .feature {
            text-align: center;
            padding: 20px;
        }
        
        .feature-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #48bb78;
            color: white;
            border-radius: 20px;
            font-weight: bold;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Canvas Business Generator</h1>
        <p class="subtitle">Describe your business idea and AI will turn it into a working website</p>
        
        <textarea 
            id="businessIdea" 
            class="idea-input" 
            placeholder="Describe your business idea here... 

Examples:
• I want to create an online store selling handmade jewelry with a shopping cart and payment processing
• I need a SaaS dashboard for tracking fitness goals with charts and user profiles  
• I want a portfolio website to showcase my photography work with a gallery and contact form

Be specific about:
- What your business does
- Who your customers are  
- Key features you need
- How users will interact with it"
        ></textarea>
        
        <div class="highlight-tools">
            <div class="highlight-btn highlight-action" onclick="addHighlight('action')">
                🟣 Actions
            </div>
            <div class="highlight-btn highlight-data" onclick="addHighlight('data')">
                🔵 Data
            </div>
            <div class="highlight-btn highlight-nav" onclick="addHighlight('navigation')">
                🟢 Navigation
            </div>
            <div class="highlight-btn highlight-warning" onclick="addHighlight('notes')">
                🟡 Notes
            </div>
            <div class="highlight-btn highlight-critical" onclick="addHighlight('critical')">
                🔴 Critical
            </div>
        </div>
        
        <div class="action-buttons">
            <button class="btn btn-primary" onclick="interpretIdea()">
                🔍 Interpret My Idea
            </button>
            <button class="btn btn-secondary" onclick="clearIdea()">
                🗑️ Clear
            </button>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>AI is analyzing your business idea...</p>
        </div>
        
        <div class="results" id="results">
            <h3>🤖 AI Analysis Results</h3>
            <div id="interpretation"></div>
            
            <h4>📋 Template Suggestions</h4>
            <div id="suggestions" class="suggestions"></div>
            
            <div class="action-buttons" style="margin-top: 30px;">
                <button class="btn btn-primary" onclick="generateSite()" id="generateBtn" disabled>
                    🚀 Generate Whitelabel Website
                </button>
            </div>
        </div>
        
        <div class="feature-list">
            <div class="feature">
                <div class="feature-icon">🎯</div>
                <h3>Smart Analysis</h3>
                <p>AI understands your business idea and suggests the perfect template</p>
            </div>
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <h3>Instant Generation</h3>
                <p>Working website generated in under 30 seconds</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🔗</div>
                <h3>Real Deployment</h3>
                <p>Get a real URL that you can share immediately</p>
            </div>
        </div>
    </div>
    
    <div class="status" id="status">Ready</div>
    
    <script>
        let selectedTemplate = null;
        let currentHighlights = [];
        
        function addHighlight(type) {
            const textarea = document.getElementById('businessIdea');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            
            if (selectedText) {
                currentHighlights.push({
                    type: type,
                    text: selectedText,
                    position: { start, end }
                });
                
                showStatus(\`Highlighted "\${selectedText}" as \${type}\`, 'info');
            } else {
                showStatus('Please select text first to highlight', 'warning');
            }
        }
        
        function clearIdea() {
            document.getElementById('businessIdea').value = '';
            currentHighlights = [];
            document.getElementById('results').style.display = 'none';
            selectedTemplate = null;
        }
        
        async function interpretIdea() {
            const businessIdea = document.getElementById('businessIdea').value.trim();
            
            if (!businessIdea) {
                showStatus('Please describe your business idea first', 'warning');
                return;
            }
            
            showLoading(true);
            
            try {
                const response = await fetch('/interpret-idea', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessIdea: businessIdea,
                        highlights: currentHighlights
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    displayResults(result);
                    showStatus('Business idea analyzed successfully!', 'success');
                } else {
                    throw new Error(result.error || 'Analysis failed');
                }
                
            } catch (error) {
                showStatus('Analysis failed: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }
        
        function displayResults(result) {
            // Show interpretation
            const interpretation = result.interpretation;
            document.getElementById('interpretation').innerHTML = \`
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h5>Business Type Detected: <strong>\${interpretation.businessType}</strong></h5>
                    <p>\${interpretation.description}</p>
                    <p><strong>Key Features:</strong> \${interpretation.features.join(', ')}</p>
                    <p><strong>Confidence:</strong> \${Math.round(interpretation.confidence * 100)}%</p>
                </div>
            \`;
            
            // Show template suggestions
            const suggestionsDiv = document.getElementById('suggestions');
            suggestionsDiv.innerHTML = '';
            
            result.suggestions.forEach(suggestion => {
                const card = document.createElement('div');
                card.className = 'suggestion-card';
                card.onclick = () => selectTemplate(suggestion.id, card);
                card.innerHTML = \`
                    <h5>\${suggestion.name}</h5>
                    <p>\${suggestion.description}</p>
                    <small>Match: \${Math.round(suggestion.score * 100)}%</small>
                \`;
                suggestionsDiv.appendChild(card);
            });
            
            document.getElementById('results').style.display = 'block';
        }
        
        function selectTemplate(templateId, cardElement) {
            // Remove previous selection
            document.querySelectorAll('.suggestion-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Select new template
            cardElement.classList.add('selected');
            selectedTemplate = templateId;
            document.getElementById('generateBtn').disabled = false;
            
            showStatus(\`Selected \${templateId} template\`, 'success');
        }
        
        async function generateSite() {
            if (!selectedTemplate) {
                showStatus('Please select a template first', 'warning');
                return;
            }
            
            const businessIdea = document.getElementById('businessIdea').value;
            showLoading(true);
            showStatus('Generating your whitelabel website...', 'info');
            
            try {
                const response = await fetch('/generate-site', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        template: selectedTemplate,
                        businessIdea: businessIdea
                    })
                });
                
                const result = await response.json();
                
                if (result.url) {
                    showStatus('Website generated successfully!', 'success');
                    
                    // Show success with link
                    const successDiv = document.createElement('div');
                    successDiv.style.cssText = 'background: #f0fff4; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;';
                    successDiv.innerHTML = \`
                        <h3 style="color: #48bb78;">🎉 Website Generated Successfully!</h3>
                        <p>Your whitelabel website is ready:</p>
                        <a href="\${result.url}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                            🔗 View Your Website
                        </a>
                        <p style="margin-top: 15px; font-size: 14px; color: #666;">
                            URL: <code>\${result.url}</code>
                        </p>
                    \`;
                    document.getElementById('results').appendChild(successDiv);
                    
                } else {
                    throw new Error(result.error || 'Generation failed');
                }
                
            } catch (error) {
                showStatus('Generation failed: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }
        
        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.style.display = 'block';
            
            const colors = {
                success: '#48bb78',
                error: '#f56565',
                warning: '#ed8936',
                info: '#4299e1'
            };
            
            status.style.background = colors[type] || colors.info;
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
        
        // Initialize
        showStatus('Ready to analyze your business idea!', 'success');
    </script>
</body>
</html>`;
    }
    
    interpretBusinessIdea(businessIdea, highlights) {
        console.log('🤖 Interpreting business idea...');
        
        // Simple keyword-based analysis
        const words = businessIdea.toLowerCase();
        let bestMatch = { template: 'landing-page', score: 0.1 };
        
        // Score each template
        Object.entries(this.businessTemplates).forEach(([templateId, template]) => {
            let score = 0;
            template.keywords.forEach(keyword => {
                if (words.includes(keyword)) {
                    score += 0.3;
                }
            });
            
            if (score > bestMatch.score) {
                bestMatch = { template: templateId, score };
            }
        });
        
        // Extract features from text
        const features = [];
        if (words.includes('cart') || words.includes('shop')) features.push('Shopping Cart');
        if (words.includes('payment')) features.push('Payment Processing');
        if (words.includes('user') || words.includes('profile')) features.push('User Accounts');
        if (words.includes('dashboard')) features.push('Analytics Dashboard');
        if (words.includes('gallery') || words.includes('portfolio')) features.push('Project Gallery');
        if (words.includes('contact')) features.push('Contact Form');
        if (words.includes('blog') || words.includes('article')) features.push('Blog/CMS');
        
        return {
            businessType: this.businessTemplates[bestMatch.template].description,
            confidence: Math.min(bestMatch.score + 0.5, 1),
            features: features.length > 0 ? features : ['Basic Website'],
            description: `Based on your description, this appears to be a ${bestMatch.template.replace('-', ' ')} focused on ${features.join(', ').toLowerCase() || 'general business needs'}.`,
            templateMatch: bestMatch.template
        };
    }
    
    suggestTemplates(interpretation) {
        const suggestions = [];
        
        // Add all templates with scores
        Object.entries(this.businessTemplates).forEach(([templateId, template]) => {
            let score = 0.2; // Base score
            
            // Boost score for the matched template
            if (templateId === interpretation.templateMatch) {
                score = interpretation.confidence;
            }
            
            suggestions.push({
                id: templateId,
                name: templateId.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' '),
                description: template.description,
                score: score
            });
        });
        
        // Sort by score
        suggestions.sort((a, b) => b.score - a.score);
        
        return suggestions;
    }
    
    async fetchRelevantData(concepts) {
        try {
            const response = await fetch(`${this.dataFetcherUrl}/api/data/all`);
            if (response.ok) {
                const allData = await response.json();
                
                // Filter data relevant to the business concepts
                const relevantData = {};
                concepts.forEach(concept => {
                    if (concept.concept === 'finance' && allData.crypto) {
                        relevantData.crypto = allData.crypto;
                    }
                    if (concept.concept === 'gaming' && allData.gaming) {
                        relevantData.gaming = allData.gaming;
                    }
                });
                
                return relevantData;
            }
        } catch (error) {
            console.warn('Could not fetch live data:', error.message);
        }
        return {};
    }
    
    convertToSuggestions(analysis) {
        return analysis.concepts.map(concept => ({
            id: concept.boilerplate,
            name: this.formatTemplateName(concept.boilerplate),
            description: this.businessTemplates[concept.concept]?.description || concept.domain,
            score: concept.confidence,
            components: concept.components,
            features: analysis.features.map(f => f.feature)
        }));
    }
    
    formatTemplateName(template) {
        return template.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    async ensureDataFetcherRunning() {
        try {
            const response = await fetch(`${this.dataFetcherUrl}/health`);
            if (!response.ok) {
                console.log('📡 Starting data fetcher service...');
                const DataFetcher = require('./services/data-fetcher');
                const fetcher = new DataFetcher();
                fetcher.start();
            }
        } catch (error) {
            // Data fetcher not running, that's okay
        }
    }
    
    createEnhancedDocument(businessIdea, template, analysis) {
        return {
            type: 'business-idea',
            content: {
                title: `${template.replace('-', ' ')} Business Plan`,
                description: businessIdea,
                template: template,
                requirements: this.extractRequirements(businessIdea),
                features: analysis.features.map(f => f.feature),
                components: analysis.recommendedComponents.map(c => c.name),
                concepts: analysis.concepts,
                techStack: analysis.boilerplate.modifiers
            },
            metadata: {
                source: 'canvas-interpreter',
                timestamp: new Date().toISOString(),
                template: template,
                confidence: analysis.confidence,
                aiAnalysis: analysis
            }
        };
    }
    
    createDocumentFromIdea(businessIdea, template) {
        return {
            type: 'business-idea',
            content: {
                title: `${template.replace('-', ' ')} Business Plan`,
                description: businessIdea,
                template: template,
                requirements: this.extractRequirements(businessIdea),
                features: this.extractFeatures(businessIdea)
            },
            metadata: {
                source: 'canvas-interpreter',
                timestamp: new Date().toISOString(),
                template: template
            }
        };
    }
    
    extractRequirements(businessIdea) {
        const requirements = [];
        const words = businessIdea.toLowerCase();
        
        if (words.includes('mobile') || words.includes('phone')) {
            requirements.push('Mobile responsive design');
        }
        if (words.includes('seo') || words.includes('search')) {
            requirements.push('Search engine optimization');
        }
        if (words.includes('social') || words.includes('share')) {
            requirements.push('Social media integration');
        }
        if (words.includes('secure') || words.includes('ssl')) {
            requirements.push('Security and SSL');
        }
        
        return requirements.length > 0 ? requirements : ['Basic functionality'];
    }
    
    extractFeatures(businessIdea) {
        const features = [];
        const words = businessIdea.toLowerCase();
        
        if (words.includes('auth') || words.includes('login') || words.includes('register')) {
            features.push('User authentication');
        }
        if (words.includes('admin') || words.includes('manage')) {
            features.push('Admin panel');
        }
        if (words.includes('search')) {
            features.push('Search functionality');
        }
        if (words.includes('notification') || words.includes('email')) {
            features.push('Email notifications');
        }
        
        return features;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('🎨 Simple Canvas Interpreter Started!');
            console.log('====================================');
            console.log(`🌐 Interface: http://localhost:${this.port}`);
            console.log('🤖 AI Analysis: Ready');
            console.log('🏭 Whitelabel Generation: Ready');
            console.log('');
            console.log('✨ Ready to turn business ideas into websites!');
        });
    }
}

// Export for use as module
module.exports = SimpleCanvasInterpreter;

// Start server if run directly
if (require.main === module) {
    const interpreter = new SimpleCanvasInterpreter();
    interpreter.start();
}
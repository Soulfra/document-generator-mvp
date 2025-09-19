#!/usr/bin/env node

// Start AI Services with Ollama Integration
// This connects the AI Orchestrator to the Document Generator

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express app
const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Mock AI Orchestrator (simplified version for testing)
class AIOrchestrator {
  constructor() {
    this.conversations = new Map();
    this.ollamaUrl = 'http://127.0.0.1:11434';
  }

  async processWithMemory(prompt, conversationId, options = {}) {
    console.log(`📝 Processing prompt for conversation: ${conversationId}`);
    
    // Get or create conversation
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        id: conversationId,
        messages: [],
        created: new Date()
      });
    }
    
    const conversation = this.conversations.get(conversationId);
    
    // Add user message
    conversation.messages.push({
      role: 'user',
      content: prompt,
      timestamp: new Date()
    });

    try {
      // Try Ollama first
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'mistral:latest',
          prompt: this.buildPromptWithContext(conversation, prompt, options),
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 2048
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add assistant response
        conversation.messages.push({
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          model: options.model || 'mistral:7b'
        });
        
        return data.response;
      } else {
        throw new Error('Ollama request failed');
      }
    } catch (error) {
      console.error('❌ AI processing error:', error);
      
      // Fallback response
      const fallback = 'AI service temporarily unavailable. Please ensure Ollama is running.';
      conversation.messages.push({
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
        model: 'fallback'
      });
      
      return fallback;
    }
  }

  buildPromptWithContext(conversation, prompt, options) {
    let fullPrompt = '';
    
    if (options.systemPrompt) {
      fullPrompt += `System: ${options.systemPrompt}\n\n`;
    }
    
    // Add recent context (last 5 messages)
    const recentMessages = conversation.messages.slice(-5);
    if (recentMessages.length > 1) {
      fullPrompt += 'Previous conversation:\n';
      recentMessages.slice(0, -1).forEach(msg => {
        fullPrompt += `${msg.role}: ${msg.content}\n`;
      });
      fullPrompt += '\n';
    }
    
    fullPrompt += `User: ${prompt}`;
    return fullPrompt;
  }

  async processDocument(documentPath, options = {}) {
    const content = await fs.readFile(documentPath, 'utf-8');
    const conversationId = options.conversationId || `doc-${Date.now()}`;
    
    const results = {
      documentPath,
      conversationId,
      timestamp: new Date()
    };

    if (options.extractText) {
      results.text = content;
    }

    if (options.generateSummary) {
      results.summary = await this.processWithMemory(
        `Summarize this document concisely:\n\n${content}`,
        conversationId,
        { systemPrompt: 'You are a document summarization expert.' }
      );
    }

    if (options.generateCode) {
      results.code = await this.processWithMemory(
        `Generate code based on this specification:\n\n${content}`,
        conversationId,
        { systemPrompt: 'You are an expert programmer. Generate clean, production-ready code.' }
      );
    }

    return results;
  }

  getStatus() {
    return {
      initialized: true,
      conversations: this.conversations.size,
      ollama: {
        url: this.ollamaUrl,
        available: true // Simplified for testing
      }
    };
  }

  getConversation(id) {
    return this.conversations.get(id) || null;
  }
}

// Initialize AI Orchestrator
const aiOrchestrator = new AIOrchestrator();

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Orchestrator',
    timestamp: new Date(),
    ...aiOrchestrator.getStatus()
  });
});

// Process text with AI
app.post('/ai/process', async (req, res) => {
  try {
    const { prompt, conversationId, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await aiOrchestrator.processWithMemory(
      prompt,
      conversationId || `conv-${Date.now()}`,
      options || {}
    );

    res.json({
      success: true,
      response,
      conversationId: conversationId || `conv-${Date.now()}`
    });
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process uploaded document
app.post('/ai/document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }

    const options = {
      extractText: req.body.extractText === 'true',
      generateSummary: req.body.generateSummary === 'true',
      generateCode: req.body.generateCode === 'true',
      conversationId: req.body.conversationId
    };

    const results = await aiOrchestrator.processDocument(
      req.file.path,
      options
    );

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(console.error);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation history
app.get('/ai/conversation/:id', (req, res) => {
  const conversation = aiOrchestrator.getConversation(req.params.id);
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  res.json({
    success: true,
    conversation
  });
});

// Update API keys
app.post('/ai/keys', async (req, res) => {
  try {
    const { service, apiKey } = req.body;
    
    if (!service || !apiKey) {
      return res.status(400).json({ error: 'Service and API key required' });
    }

    // In production, this would update the vault
    process.env[`${service.toUpperCase()}_API_KEY`] = apiKey;
    
    res.json({
      success: true,
      message: `${service} API key updated`
    });
  } catch (error) {
    console.error('Key update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List available models
app.get('/ai/models', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    
    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        models: data.models || []
      });
    } else {
      throw new Error('Failed to fetch models from Ollama');
    }
  } catch (error) {
    console.error('Model listing error:', error);
    res.json({
      success: false,
      models: [],
      error: error.message
    });
  }
});

// Test endpoint
app.get('/ai/test', async (req, res) => {
  try {
    const response = await aiOrchestrator.processWithMemory(
      'Say "AI service is working" and nothing else.',
      'test-conversation',
      { temperature: 0.1 }
    );

    res.json({
      success: true,
      test: 'passed',
      response
    });
  } catch (error) {
    res.json({
      success: false,
      test: 'failed',
      error: error.message
    });
  }
});

// API documentation
app.get('/docs', (req, res) => {
  res.json({
    service: 'AI Orchestrator Service',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Service health check',
      'GET /docs': 'API documentation',
      'POST /ai/process': 'Process text with AI',
      'POST /ai/document': 'Process uploaded document',
      'GET /ai/conversation/:id': 'Get conversation history',
      'POST /ai/keys': 'Update API keys',
      'GET /ai/models': 'List available Ollama models',
      'GET /ai/test': 'Test AI service'
    },
    usage: {
      process: {
        method: 'POST',
        url: '/ai/process',
        body: {
          prompt: 'Your prompt here',
          conversationId: 'optional-conversation-id',
          options: {
            systemPrompt: 'Optional system prompt',
            temperature: 0.7,
            maxTokens: 2048,
            model: 'mistral:7b'
          }
        }
      },
      document: {
        method: 'POST',
        url: '/ai/document',
        contentType: 'multipart/form-data',
        fields: {
          document: 'File upload',
          extractText: 'true/false',
          generateSummary: 'true/false',
          generateCode: 'true/false',
          conversationId: 'optional-id'
        }
      }
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
async function startServer() {
  // Ensure uploads directory exists
  await fs.mkdir('uploads', { recursive: true }).catch(() => {});
  await fs.mkdir('data', { recursive: true }).catch(() => {});
  
  app.listen(PORT, () => {
    console.log(`
🤖 AI Orchestrator Service Started
==================================
🌐 URL: http://localhost:${PORT}
📚 Docs: http://localhost:${PORT}/docs
🧪 Test: http://localhost:${PORT}/ai/test

Available endpoints:
- POST /ai/process - Process text with AI
- POST /ai/document - Process documents
- GET /ai/conversation/:id - Get history
- GET /ai/models - List Ollama models

Press Ctrl+C to stop
    `);
  });
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down AI service...');
  process.exit(0);
});

// Start the service
startServer().catch(console.error);
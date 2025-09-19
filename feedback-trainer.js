#!/usr/bin/env node

/**
 * 🎓 Feedback Trainer
 * 
 * Simple HTTP server that serves the feedback interface
 * and handles communication between the AI reasoning engine and human feedback
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { parse } from 'url';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FeedbackTrainer {
    constructor(port = 3333) {
        this.port = port;
        this.feedbackFile = './ai-feedback-data.json';
        this.currentSession = null;
        this.server = null;
    }

    // Start the feedback server
    start() {
        this.server = createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🎓 Feedback Trainer started on http://localhost:${this.port}`);
            console.log('🌐 Open the URL in your browser to provide feedback');
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down feedback trainer...');
            this.server.close(() => {
                console.log('✅ Feedback trainer stopped');
                process.exit(0);
            });
        });
    }

    // Handle HTTP requests
    handleRequest(req, res) {
        const parsedUrl = parse(req.url, true);
        const path = parsedUrl.pathname;
        const query = parsedUrl.query;

        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            switch (path) {
                case '/':
                    this.serveFile(res, 'human-feedback-interface.html', 'text/html');
                    break;

                case '/api/reasoning':
                    this.handleGetReasoning(res);
                    break;

                case '/api/feedback':
                    if (req.method === 'POST') {
                        this.handlePostFeedback(req, res);
                    } else {
                        this.handleGetFeedback(res);
                    }
                    break;

                case '/api/stats':
                    this.handleGetStats(res);
                    break;

                case '/health':
                    this.sendJSON(res, { status: 'ok', timestamp: new Date().toISOString() });
                    break;

                default:
                    this.send404(res);
                    break;
            }
        } catch (error) {
            console.error('Request error:', error);
            this.sendError(res, 500, 'Internal server error');
        }
    }

    // Serve static files
    serveFile(res, filename, contentType) {
        const filePath = join(__dirname, filename);
        
        if (!existsSync(filePath)) {
            this.send404(res);
            return;
        }

        try {
            const content = readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch (error) {
            console.error('File read error:', error);
            this.sendError(res, 500, 'Could not read file');
        }
    }

    // Handle GET /api/reasoning
    handleGetReasoning(res) {
        // In a real implementation, this would get the current reasoning session
        // from the AI engine. For now, we'll return a default session.
        
        const defaultReasoning = {
            question: "How do I debug JavaScript async issues?",
            reasoning: [
                {
                    step: 1,
                    content: "I need to understand what is being asked: \"How do I debug JavaScript async issues?\"",
                    confidence: 0.9,
                    timestamp: new Date().toISOString()
                },
                {
                    step: 2,
                    content: "This appears to be a technical type question",
                    confidence: 0.7,
                    timestamp: new Date().toISOString()
                },
                {
                    step: 3,
                    content: "For this technical problem, I would: 1) Break it into smaller components, 2) Consider existing solutions and patterns, 3) Think about edge cases and potential issues, 4) Plan implementation steps",
                    confidence: 0.8,
                    timestamp: new Date().toISOString()
                },
                {
                    step: 4,
                    content: "Alternative approaches: step-by-step tutorial, visual diagram, examples",
                    confidence: 0.4,
                    timestamp: new Date().toISOString()
                },
                {
                    step: 5,
                    content: "Final answer: Use debugging tools like console.log, debugger statements, and browser dev tools. Set up proper error handling with try-catch blocks. Break async operations into smaller, testable functions.",
                    confidence: 0.8,
                    timestamp: new Date().toISOString()
                }
            ],
            conclusion: "Use debugging tools, proper error handling, and step-by-step analysis",
            confidence: 0.8,
            sessionId: Date.now()
        };

        this.sendJSON(res, defaultReasoning);
    }

    // Handle GET /api/feedback
    handleGetFeedback(res) {
        const feedback = this.loadFeedback();
        this.sendJSON(res, feedback);
    }

    // Handle POST /api/feedback
    handlePostFeedback(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const feedbackData = JSON.parse(body);
                this.recordFeedback(feedbackData);
                
                this.sendJSON(res, { 
                    success: true, 
                    message: 'Feedback recorded successfully',
                    timestamp: new Date().toISOString()
                });
                
                console.log(`📝 Feedback recorded: ${feedbackData.positive ? 'positive' : 'negative'}`);
                if (feedbackData.stepIndex !== null) {
                    console.log(`   For step: ${feedbackData.stepIndex + 1}`);
                }
                
            } catch (error) {
                console.error('Feedback parsing error:', error);
                this.sendError(res, 400, 'Invalid feedback data');
            }
        });
    }

    // Handle GET /api/stats
    handleGetStats(res) {
        const feedback = this.loadFeedback();
        
        const stats = {
            totalFeedback: feedback.positive.length + feedback.negative.length,
            positiveFeedback: feedback.positive.length,
            negativeFeedback: feedback.negative.length,
            learningScore: this.calculateLearningScore(feedback),
            topPatterns: this.getTopPatterns(feedback.patterns),
            recentFeedback: this.getRecentFeedback(feedback),
            lastUpdated: new Date().toISOString()
        };

        this.sendJSON(res, stats);
    }

    // Load feedback from file
    loadFeedback() {
        if (existsSync(this.feedbackFile)) {
            try {
                const data = readFileSync(this.feedbackFile, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.log('⚠️  Could not load feedback data, using defaults');
            }
        }
        
        return { 
            positive: [], 
            negative: [], 
            patterns: {},
            sessions: []
        };
    }

    // Save feedback to file
    saveFeedback(feedback) {
        try {
            writeFileSync(this.feedbackFile, JSON.stringify(feedback, null, 2));
        } catch (error) {
            console.error('❌ Could not save feedback:', error.message);
        }
    }

    // Record new feedback
    recordFeedback(feedbackData) {
        const feedback = this.loadFeedback();
        
        const record = {
            timestamp: new Date().toISOString(),
            positive: feedbackData.positive,
            stepIndex: feedbackData.stepIndex || null,
            content: feedbackData.content || '',
            sessionId: feedbackData.sessionId || Date.now(),
            userAgent: feedbackData.userAgent || 'unknown'
        };

        if (feedbackData.positive) {
            feedback.positive.push(record);
        } else {
            feedback.negative.push(record);
        }

        // Update patterns if content is provided
        if (record.content) {
            this.updatePatterns(feedback, record);
        }

        this.saveFeedback(feedback);
    }

    // Update learned patterns
    updatePatterns(feedback, record) {
        const content = record.content.toLowerCase();
        const words = content.split(/\s+/).filter(word => word.length > 3);
        
        words.forEach(word => {
            if (!feedback.patterns[word]) {
                feedback.patterns[word] = { positive: 0, negative: 0 };
            }
            
            if (record.positive) {
                feedback.patterns[word].positive++;
            } else {
                feedback.patterns[word].negative++;
            }
        });
    }

    // Calculate learning score
    calculateLearningScore(feedback) {
        const total = feedback.positive.length + feedback.negative.length;
        if (total === 0) return 0;
        
        return Math.round((feedback.positive.length / total) * 100);
    }

    // Get top patterns
    getTopPatterns(patterns) {
        return Object.entries(patterns)
            .map(([word, counts]) => ({
                word,
                positive: counts.positive,
                negative: counts.negative,
                score: counts.positive - counts.negative
            }))
            .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
            .slice(0, 10);
    }

    // Get recent feedback
    getRecentFeedback(feedback) {
        const allFeedback = [
            ...feedback.positive.map(f => ({ ...f, type: 'positive' })),
            ...feedback.negative.map(f => ({ ...f, type: 'negative' }))
        ];
        
        return allFeedback
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }

    // Send JSON response
    sendJSON(res, data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }

    // Send error response
    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message, timestamp: new Date().toISOString() }));
    }

    // Send 404 response
    send404(res) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }

    // Stop the server
    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const port = process.argv[2] ? parseInt(process.argv[2]) : 3333;
    
    if (isNaN(port) || port < 1 || port > 65535) {
        console.error('❌ Invalid port number. Please use a port between 1 and 65535.');
        process.exit(1);
    }

    console.log('🎓 Starting Feedback Trainer...');
    console.log(`📡 Server will start on port ${port}`);
    
    const trainer = new FeedbackTrainer(port);
    trainer.start();
    
    console.log('\n💡 Usage:');
    console.log('  1. Run the AI reasoning engine: node ai-reasoning-engine.js "your question"');
    console.log('  2. The feedback interface will automatically open in your browser');
    console.log('  3. Provide feedback using the web interface');
    console.log('  4. The AI will learn from your feedback for future reasoning\n');
}

export default FeedbackTrainer;
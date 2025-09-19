#!/usr/bin/env node

/**
 * 🧠 Prompt Engineering Capture System
 * 
 * Captures, analyzes, and optimizes AI prompts and responses
 * for the 3D game system and document processing
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

class PromptEngineeringSystem {
    constructor(config = {}) {
        this.config = {
            databaseUrl: config.databaseUrl || process.env.DATABASE_URL ||
                'postgresql://postgres:postgres@localhost:5432/document_generator',
            dataDir: config.dataDir || './prompt-engineering-data',
            analysisInterval: config.analysisInterval || 3600000, // 1 hour
            ...config
        };
        
        this.pool = null;
        this.metrics = {
            totalPrompts: 0,
            successfulResponses: 0,
            averageResponseTime: 0,
            patternMatches: new Map()
        };
    }
    
    async init() {
        // Initialize database connection
        this.pool = new Pool({
            connectionString: this.config.databaseUrl
        });
        
        // Create schema
        await this.createSchema();
        
        // Ensure data directory exists
        await fs.mkdir(this.config.dataDir, { recursive: true });
        
        // Start periodic analysis
        this.startAnalysis();
        
        console.log('✅ Prompt Engineering System initialized');
    }
    
    async createSchema() {
        const schema = `
            -- Prompt/Response pairs
            CREATE TABLE IF NOT EXISTS prompt_interactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                prompt_hash VARCHAR(64) NOT NULL,
                prompt_text TEXT NOT NULL,
                prompt_type VARCHAR(50),
                context JSONB,
                response_text TEXT,
                response_metadata JSONB,
                success BOOLEAN DEFAULT true,
                response_time_ms INTEGER,
                model_used VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tags TEXT[],
                user_feedback INTEGER, -- 1-5 rating
                session_id VARCHAR(100)
            );
            
            -- Prompt patterns and templates
            CREATE TABLE IF NOT EXISTS prompt_patterns (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                pattern_name VARCHAR(100) UNIQUE NOT NULL,
                pattern_template TEXT NOT NULL,
                success_rate DECIMAL(5,2),
                avg_response_time_ms INTEGER,
                usage_count INTEGER DEFAULT 0,
                category VARCHAR(50),
                variables JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Successful prompt examples
            CREATE TABLE IF NOT EXISTS successful_prompts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                interaction_id UUID REFERENCES prompt_interactions(id),
                pattern_id UUID REFERENCES prompt_patterns(id),
                effectiveness_score DECIMAL(3,2),
                context_match JSONB,
                extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- AI behavior patterns from game
            CREATE TABLE IF NOT EXISTS ai_behavior_patterns (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                behavior_type VARCHAR(50),
                trigger_prompt TEXT,
                resulting_actions JSONB,
                effectiveness DECIMAL(3,2),
                game_context JSONB,
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Indexes for performance
            CREATE INDEX IF NOT EXISTS idx_prompt_hash ON prompt_interactions(prompt_hash);
            CREATE INDEX IF NOT EXISTS idx_prompt_type ON prompt_interactions(prompt_type);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON prompt_interactions(timestamp);
            CREATE INDEX IF NOT EXISTS idx_success ON prompt_interactions(success);
            CREATE INDEX IF NOT EXISTS idx_pattern_category ON prompt_patterns(category);
        `;
        
        await this.pool.query(schema);
    }
    
    /**
     * Log a prompt/response interaction
     */
    async logPromptResponse(data) {
        const {
            prompt,
            response,
            promptType,
            context = {},
            responseTime,
            modelUsed,
            success = true,
            tags = [],
            sessionId
        } = data;
        
        const promptHash = this.hashPrompt(prompt);
        
        try {
            const result = await this.pool.query(`
                INSERT INTO prompt_interactions (
                    prompt_hash, prompt_text, prompt_type, context,
                    response_text, response_metadata, success,
                    response_time_ms, model_used, tags, session_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `, [
                promptHash,
                prompt,
                promptType,
                JSON.stringify(context),
                response,
                JSON.stringify({ length: response.length, timestamp: new Date() }),
                success,
                responseTime,
                modelUsed,
                tags,
                sessionId
            ]);
            
            // Update metrics
            this.updateMetrics(success, responseTime);
            
            // Check for pattern matches
            await this.checkPatternMatches(prompt, response, result.rows[0].id);
            
            return result.rows[0].id;
        } catch (error) {
            console.error('Error logging prompt:', error);
            throw error;
        }
    }
    
    /**
     * Analyze prompt patterns and effectiveness
     */
    async analyzePromptPatterns() {
        console.log('🔍 Analyzing prompt patterns...');
        
        // Find successful prompt patterns
        const successfulPatterns = await this.pool.query(`
            SELECT 
                prompt_type,
                COUNT(*) as usage_count,
                AVG(response_time_ms) as avg_response_time,
                SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as success_rate,
                array_agg(DISTINCT tags) as common_tags
            FROM prompt_interactions
            WHERE timestamp > NOW() - INTERVAL '7 days'
            GROUP BY prompt_type
            HAVING COUNT(*) > 5
            ORDER BY success_rate DESC, avg_response_time ASC
        `);
        
        // Extract common phrases from successful prompts
        const phraseAnalysis = await this.extractCommonPhrases();
        
        // Find optimal context patterns
        const contextPatterns = await this.analyzeContextPatterns();
        
        // Generate optimization report
        const report = {
            timestamp: new Date(),
            successfulPatterns: successfulPatterns.rows,
            commonPhrases: phraseAnalysis,
            contextPatterns: contextPatterns,
            recommendations: this.generateRecommendations(
                successfulPatterns.rows,
                phraseAnalysis,
                contextPatterns
            )
        };
        
        // Save report
        await this.saveAnalysisReport(report);
        
        return report;
    }
    
    /**
     * Extract common phrases from successful prompts
     */
    async extractCommonPhrases() {
        const result = await this.pool.query(`
            SELECT prompt_text
            FROM prompt_interactions
            WHERE success = true
            AND timestamp > NOW() - INTERVAL '7 days'
            AND user_feedback >= 4
            LIMIT 1000
        `);
        
        // Simple phrase extraction (could be enhanced with NLP)
        const phrases = new Map();
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
        
        result.rows.forEach(row => {
            const words = row.prompt_text.toLowerCase().split(/\s+/);
            
            // Extract 2-4 word phrases
            for (let len = 2; len <= 4; len++) {
                for (let i = 0; i <= words.length - len; i++) {
                    const phrase = words.slice(i, i + len).join(' ');
                    if (!words.slice(i, i + len).some(w => stopWords.has(w))) {
                        phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
                    }
                }
            }
        });
        
        // Return top phrases
        return Array.from(phrases.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([phrase, count]) => ({ phrase, count }));
    }
    
    /**
     * Analyze context patterns for effectiveness
     */
    async analyzeContextPatterns() {
        const result = await this.pool.query(`
            SELECT 
                context,
                AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate,
                AVG(response_time_ms) as avg_response_time,
                COUNT(*) as usage_count
            FROM prompt_interactions
            WHERE context IS NOT NULL
            AND timestamp > NOW() - INTERVAL '7 days'
            GROUP BY context
            HAVING COUNT(*) > 3
            ORDER BY success_rate DESC
            LIMIT 50
        `);
        
        // Extract patterns from context
        const patterns = result.rows.map(row => {
            const context = row.context;
            return {
                contextKeys: Object.keys(context).sort(),
                successRate: parseFloat(row.success_rate),
                avgResponseTime: parseInt(row.avg_response_time),
                usageCount: parseInt(row.usage_count),
                example: context
            };
        });
        
        return patterns;
    }
    
    /**
     * Generate optimization recommendations
     */
    generateRecommendations(patterns, phrases, contexts) {
        const recommendations = [];
        
        // Pattern-based recommendations
        patterns.forEach(pattern => {
            if (pattern.success_rate < 70) {
                recommendations.push({
                    type: 'pattern',
                    severity: 'high',
                    message: `Consider improving prompts of type "${pattern.prompt_type}" - current success rate: ${pattern.success_rate.toFixed(1)}%`,
                    suggestion: 'Review failed prompts and identify common issues'
                });
            }
            
            if (pattern.avg_response_time > 5000) {
                recommendations.push({
                    type: 'performance',
                    severity: 'medium',
                    message: `Prompts of type "${pattern.prompt_type}" are slow (avg: ${pattern.avg_response_time}ms)`,
                    suggestion: 'Consider simplifying or breaking down complex prompts'
                });
            }
        });
        
        // Phrase-based recommendations
        const topPhrases = phrases.slice(0, 5).map(p => p.phrase);
        recommendations.push({
            type: 'optimization',
            severity: 'info',
            message: 'Top performing phrases identified',
            suggestion: `Consider using these phrases more often: ${topPhrases.join(', ')}`
        });
        
        // Context recommendations
        if (contexts.length > 0) {
            const bestContext = contexts[0];
            recommendations.push({
                type: 'context',
                severity: 'info',
                message: 'Optimal context pattern identified',
                suggestion: `Best results with context keys: ${bestContext.contextKeys.join(', ')}`
            });
        }
        
        return recommendations;
    }
    
    /**
     * Optimize a prompt based on learned patterns
     */
    async optimizePrompt(basePrompt, context = {}) {
        // Find similar successful prompts
        const similarPrompts = await this.pool.query(`
            SELECT 
                prompt_text,
                response_text,
                context,
                response_time_ms
            FROM prompt_interactions
            WHERE success = true
            AND similarity(prompt_text, $1) > 0.3
            AND (user_feedback IS NULL OR user_feedback >= 4)
            ORDER BY 
                similarity(prompt_text, $1) DESC,
                response_time_ms ASC
            LIMIT 5
        `, [basePrompt]);
        
        if (similarPrompts.rows.length === 0) {
            return {
                optimized: basePrompt,
                confidence: 0.5,
                suggestions: ['No similar successful prompts found']
            };
        }
        
        // Extract optimization patterns
        const optimizations = this.extractOptimizations(
            basePrompt,
            similarPrompts.rows
        );
        
        return {
            optimized: optimizations.optimizedPrompt,
            confidence: optimizations.confidence,
            suggestions: optimizations.suggestions,
            examples: similarPrompts.rows.slice(0, 3)
        };
    }
    
    /**
     * Extract successful patterns for reverse engineering
     */
    async extractSuccessPatterns() {
        // Get highly rated game AI behaviors
        const behaviors = await this.pool.query(`
            SELECT DISTINCT
                b.behavior_type,
                b.trigger_prompt,
                b.resulting_actions,
                b.effectiveness
            FROM ai_behavior_patterns b
            WHERE b.effectiveness > 0.8
            ORDER BY b.effectiveness DESC
            LIMIT 20
        `);
        
        // Get successful document transformations
        const transformations = await this.pool.query(`
            SELECT 
                pi.prompt_text,
                pi.response_text,
                pi.context
            FROM prompt_interactions pi
            WHERE pi.prompt_type = 'document_transformation'
            AND pi.success = true
            AND pi.user_feedback >= 4
            ORDER BY pi.timestamp DESC
            LIMIT 20
        `);
        
        // Extract patterns
        const patterns = {
            behaviorPatterns: this.analyzeBehaviorPatterns(behaviors.rows),
            transformationPatterns: this.analyzeTransformationPatterns(transformations.rows),
            timestamp: new Date()
        };
        
        // Save patterns for future use
        await this.savePatterns(patterns);
        
        return patterns;
    }
    
    /**
     * Analyze AI behavior patterns from game
     */
    analyzeBehaviorPatterns(behaviors) {
        const patterns = {
            triggerWords: new Map(),
            actionSequences: [],
            contextRequirements: new Set()
        };
        
        behaviors.forEach(behavior => {
            // Extract trigger words
            const words = behavior.trigger_prompt.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 3) {
                    patterns.triggerWords.set(
                        word,
                        (patterns.triggerWords.get(word) || 0) + behavior.effectiveness
                    );
                }
            });
            
            // Analyze action sequences
            if (behavior.resulting_actions) {
                patterns.actionSequences.push({
                    type: behavior.behavior_type,
                    actions: behavior.resulting_actions,
                    effectiveness: behavior.effectiveness
                });
            }
        });
        
        return {
            topTriggerWords: Array.from(patterns.triggerWords.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10),
            effectiveSequences: patterns.actionSequences
                .sort((a, b) => b.effectiveness - a.effectiveness)
                .slice(0, 5)
        };
    }
    
    /**
     * Start periodic analysis
     */
    startAnalysis() {
        // Run initial analysis
        this.analyzePromptPatterns();
        
        // Schedule periodic analysis
        setInterval(() => {
            this.analyzePromptPatterns();
            this.extractSuccessPatterns();
        }, this.config.analysisInterval);
    }
    
    /**
     * Save analysis report
     */
    async saveAnalysisReport(report) {
        const filename = `analysis-${Date.now()}.json`;
        const filepath = path.join(this.config.dataDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`📊 Analysis report saved: ${filename}`);
    }
    
    /**
     * Hash prompt for deduplication
     */
    hashPrompt(prompt) {
        return crypto.createHash('sha256')
            .update(prompt.toLowerCase().trim())
            .digest('hex');
    }
    
    /**
     * Update real-time metrics
     */
    updateMetrics(success, responseTime) {
        this.metrics.totalPrompts++;
        if (success) {
            this.metrics.successfulResponses++;
        }
        
        // Update average response time
        const currentAvg = this.metrics.averageResponseTime;
        const currentCount = this.metrics.totalPrompts - 1;
        this.metrics.averageResponseTime = 
            (currentAvg * currentCount + responseTime) / this.metrics.totalPrompts;
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.metrics.totalPrompts > 0 
                ? (this.metrics.successfulResponses / this.metrics.totalPrompts * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    
    /**
     * Extract optimizations from similar prompts
     */
    extractOptimizations(basePrompt, similarPrompts) {
        const suggestions = [];
        let optimizedPrompt = basePrompt;
        let confidence = 0.5;
        
        // Find common improvements
        const commonPhrases = new Map();
        
        similarPrompts.forEach(similar => {
            const baseWords = new Set(basePrompt.toLowerCase().split(/\s+/));
            const similarWords = similar.prompt_text.toLowerCase().split(/\s+/);
            
            // Find phrases in similar but not in base
            similarWords.forEach((word, index) => {
                if (!baseWords.has(word) && index < similarWords.length - 1) {
                    const phrase = `${word} ${similarWords[index + 1]}`;
                    commonPhrases.set(phrase, (commonPhrases.get(phrase) || 0) + 1);
                }
            });
        });
        
        // Apply top suggestions
        const topPhrases = Array.from(commonPhrases.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        if (topPhrases.length > 0) {
            suggestions.push(`Consider adding: ${topPhrases.map(p => p[0]).join(', ')}`);
            confidence = Math.min(0.9, 0.5 + topPhrases.length * 0.1);
        }
        
        return {
            optimizedPrompt,
            confidence,
            suggestions
        };
    }
    
    /**
     * Save extracted patterns
     */
    async savePatterns(patterns) {
        const filename = `patterns-${Date.now()}.json`;
        const filepath = path.join(this.config.dataDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(patterns, null, 2));
        console.log(`🎯 Patterns saved: ${filename}`);
    }
    
    /**
     * Analyze transformation patterns
     */
    analyzeTransformationPatterns(transformations) {
        const patterns = {
            inputFormats: new Set(),
            outputStructures: [],
            commonTransformations: []
        };
        
        transformations.forEach(trans => {
            // Analyze input/output patterns
            if (trans.context && trans.context.inputFormat) {
                patterns.inputFormats.add(trans.context.inputFormat);
            }
            
            // Extract transformation types
            const promptLower = trans.prompt_text.toLowerCase();
            if (promptLower.includes('convert') || promptLower.includes('transform')) {
                patterns.commonTransformations.push({
                    prompt: trans.prompt_text.substring(0, 100),
                    responseLength: trans.response_text.length,
                    context: trans.context
                });
            }
        });
        
        return {
            supportedFormats: Array.from(patterns.inputFormats),
            transformationExamples: patterns.commonTransformations.slice(0, 5)
        };
    }
    
    /**
     * Check for pattern matches
     */
    async checkPatternMatches(prompt, response, interactionId) {
        const patterns = await this.pool.query(`
            SELECT id, pattern_name, pattern_template
            FROM prompt_patterns
            WHERE $1 LIKE '%' || pattern_template || '%'
            OR pattern_template LIKE '%' || $1 || '%'
        `, [prompt.toLowerCase()]);
        
        for (const pattern of patterns.rows) {
            await this.pool.query(`
                INSERT INTO successful_prompts (interaction_id, pattern_id, effectiveness_score)
                VALUES ($1, $2, $3)
            `, [interactionId, pattern.id, 0.8]); // Default effectiveness
            
            // Update pattern usage
            await this.pool.query(`
                UPDATE prompt_patterns
                SET usage_count = usage_count + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [pattern.id]);
        }
    }
    
    /**
     * Close database connection
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

// Export for use in other modules
module.exports = PromptEngineeringSystem;

// CLI interface
if (require.main === module) {
    const system = new PromptEngineeringSystem();
    
    async function main() {
        await system.init();
        
        // Example usage
        console.log('🧠 Prompt Engineering System Running');
        console.log('Commands:');
        console.log('  analyze - Run pattern analysis');
        console.log('  metrics - Show current metrics');
        console.log('  optimize <prompt> - Optimize a prompt');
        console.log('  exit - Quit');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const processCommand = async (command) => {
            const [cmd, ...args] = command.trim().split(' ');
            
            switch (cmd) {
                case 'analyze':
                    const report = await system.analyzePromptPatterns();
                    console.log('📊 Analysis complete:', report.recommendations);
                    break;
                    
                case 'metrics':
                    console.log('📈 Current metrics:', system.getMetrics());
                    break;
                    
                case 'optimize':
                    if (args.length === 0) {
                        console.log('Usage: optimize <prompt>');
                        break;
                    }
                    const result = await system.optimizePrompt(args.join(' '));
                    console.log('✨ Optimization result:', result);
                    break;
                    
                case 'exit':
                    await system.close();
                    process.exit(0);
                    break;
                    
                default:
                    console.log('Unknown command:', cmd);
            }
            
            rl.question('> ', processCommand);
        };
        
        rl.question('> ', processCommand);
    }
    
    main().catch(console.error);
}
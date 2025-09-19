#!/usr/bin/env node

/**
 * 🔍 CAL SYSTEM TRACER - COMPLETE VISIBILITY ENGINE
 * 
 * Comprehensive system event logging and tracing:
 * - Every API call logged with timing, costs, and reasoning
 * - Model selection decisions with full decision trees
 * - Database queries tracked with performance metrics
 * - Component activation history with success/failure rates
 * - Cross-librarian knowledge sharing events
 * - Real-time event streaming to monitoring dashboard
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class CalSystemTracer extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            logDir: process.env.TRACE_LOG_DIR || './trace_logs',
            maxLogSize: 100 * 1024 * 1024, // 100MB per log file
            retentionDays: 30,
            enableFileLogging: true,
            enableConsoleLogging: process.env.NODE_ENV !== 'production',
            enableMetrics: true
        };
        
        // Active trace sessions
        this.activeSessions = new Map();
        
        // Event counters and metrics
        this.metrics = {
            events: {
                api_calls: 0,
                model_selections: 0,
                database_queries: 0,
                component_activations: 0,
                system_events: 0,
                errors: 0
            },
            performance: {
                avg_api_response_time: 0,
                avg_db_query_time: 0,
                avg_component_execution_time: 0,
                total_cost_incurred: 0
            },
            librarians: {
                'ship-cal': { queries: 0, success_rate: 1.0, avg_time: 0 },
                'trade-cal': { queries: 0, success_rate: 1.0, avg_time: 0 },
                'combat-cal': { queries: 0, success_rate: 1.0, avg_time: 0 },
                'wiki-cal': { queries: 0, success_rate: 1.0, avg_time: 0 },
                'cal-master': { queries: 0, success_rate: 1.0, avg_time: 0 }
            }
        };
        
        // Log file handles
        this.logFiles = {
            api_calls: null,
            model_selections: null,
            database_queries: null,
            system_events: null,
            errors: null
        };
        
        console.log('🔍 Cal System Tracer initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Create log directory
        await fs.mkdir(this.config.logDir, { recursive: true });
        
        // Initialize log files
        if (this.config.enableFileLogging) {
            await this.initializeLogFiles();
        }
        
        // Start background tasks
        this.startBackgroundTasks();
        
        // Set up global error handling
        this.setupGlobalErrorHandling();
        
        console.log('✅ Cal System Tracer ready');
        console.log(`   📁 Logs directory: ${this.config.logDir}`);
        console.log(`   📊 Metrics tracking: ${this.config.enableMetrics ? 'enabled' : 'disabled'}`);
        
        this.emit('tracer_ready');
    }
    
    async initializeLogFiles() {
        for (const logType of Object.keys(this.logFiles)) {
            const filename = path.join(this.config.logDir, `${logType}_${this.getDateString()}.jsonl`);
            this.logFiles[logType] = filename;
        }
    }
    
    startBackgroundTasks() {
        // Rotate logs daily
        setInterval(() => {
            this.rotateLogs();
        }, 24 * 60 * 60 * 1000);
        
        // Clean old logs
        setInterval(() => {
            this.cleanOldLogs();
        }, 60 * 60 * 1000); // Every hour
        
        // Emit metrics updates
        setInterval(() => {
            this.emit('metrics_update', this.getMetrics());
        }, 10000); // Every 10 seconds
    }
    
    setupGlobalErrorHandling() {
        process.on('uncaughtException', (error) => {
            this.traceError('system', 'uncaught_exception', error, {
                stack: error.stack,
                severity: 'critical'
            });
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            this.traceError('system', 'unhandled_rejection', reason, {
                promise: promise.toString(),
                severity: 'critical'
            });
        });
    }
    
    // ========================================
    // TRACING METHODS
    // ========================================
    
    startTraceSession(sessionType, sessionId, metadata = {}) {
        const session = {
            id: sessionId,
            type: sessionType,
            start_time: Date.now(),
            metadata: metadata,
            events: [],
            status: 'active'
        };
        
        this.activeSessions.set(sessionId, session);
        
        this.logEvent('trace_session', {
            action: 'start',
            session_id: sessionId,
            session_type: sessionType,
            metadata: metadata
        });
        
        return sessionId;
    }
    
    endTraceSession(sessionId, result = {}) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;
        
        session.end_time = Date.now();
        session.duration = session.end_time - session.start_time;
        session.result = result;
        session.status = 'completed';
        
        this.logEvent('trace_session', {
            action: 'end',
            session_id: sessionId,
            duration: session.duration,
            events_count: session.events.length,
            result: result
        });
        
        this.activeSessions.delete(sessionId);
        return session;
    }
    
    traceApiCall(librarian, endpoint, method, startTime, result, metadata = {}) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const traceData = {
            timestamp: endTime,
            librarian: librarian,
            endpoint: endpoint,
            method: method,
            response_time_ms: responseTime,
            success: result.success,
            status_code: result.statusCode,
            cost: result.cost || 0,
            tokens_used: result.tokensUsed || 0,
            model_used: result.model,
            trust_score: result.trustScore || 0.5,
            error: result.error,
            metadata: metadata,
            trace_id: this.generateTraceId()
        };
        
        // Update metrics
        this.metrics.events.api_calls++;
        this.updateAverageMetric('avg_api_response_time', responseTime, this.metrics.events.api_calls);
        this.metrics.performance.total_cost_incurred += (result.cost || 0);
        
        // Update librarian stats
        if (this.metrics.librarians[librarian]) {
            this.updateLibrarianStats(librarian, responseTime, result.success);
        }
        
        // Log the event
        this.logEvent('api_call', traceData);
        
        // Emit for real-time monitoring
        this.emit('api_call_traced', traceData);
        
        return traceData.trace_id;
    }
    
    traceModelSelection(librarian, query, domain, selectedModel, reasoning, startTime, result) {
        const endTime = Date.now();
        const selectionTime = endTime - startTime;
        
        const traceData = {
            timestamp: endTime,
            librarian: librarian,
            query: query,
            query_hash: this.hashString(query),
            domain_detected: domain,
            selected_model: selectedModel.model,
            selected_provider: selectedModel.provider,
            estimated_cost: selectedModel.cost,
            reasoning_chain: reasoning.steps || [],
            confidence_score: reasoning.finalConfidence || 0.5,
            alternatives_considered: reasoning.alternatives || [],
            selection_time_ms: selectionTime,
            cache_hit: result.cached || false,
            success: result.success,
            actual_cost: result.actualCost || 0,
            trace_id: this.generateTraceId()
        };
        
        // Update metrics
        this.metrics.events.model_selections++;
        
        // Log the event
        this.logEvent('model_selection', traceData);
        
        // Emit for real-time monitoring
        this.emit('model_selection_traced', traceData);
        
        return traceData.trace_id;
    }
    
    traceDatabaseQuery(librarian, database, query, startTime, result) {
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        const traceData = {
            timestamp: endTime,
            librarian: librarian,
            database: database,
            query_type: this.inferQueryType(query),
            query_hash: this.hashString(query),
            execution_time_ms: queryTime,
            rows_affected: result.rowsAffected || 0,
            rows_returned: result.rowsReturned || 0,
            success: result.success,
            error: result.error,
            cache_hit: result.cached || false,
            index_used: result.indexUsed,
            trace_id: this.generateTraceId()
        };
        
        // Update metrics
        this.metrics.events.database_queries++;
        this.updateAverageMetric('avg_db_query_time', queryTime, this.metrics.events.database_queries);
        
        // Log the event
        this.logEvent('database_query', traceData);
        
        // Emit for real-time monitoring
        this.emit('database_query_traced', traceData);
        
        return traceData.trace_id;
    }
    
    traceComponentActivation(librarian, componentName, inputData, startTime, result) {
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        const traceData = {
            timestamp: endTime,
            librarian: librarian,
            component: componentName,
            input_hash: this.hashString(JSON.stringify(inputData)),
            execution_time_ms: executionTime,
            success: result.success,
            output_size: result.output ? JSON.stringify(result.output).length : 0,
            confidence_score: result.confidence || 0.5,
            sources_consulted: result.sources || [],
            error: result.error,
            memory_used: result.memoryUsed,
            cpu_time: result.cpuTime,
            trace_id: this.generateTraceId()
        };
        
        // Update metrics
        this.metrics.events.component_activations++;
        this.updateAverageMetric('avg_component_execution_time', executionTime, this.metrics.events.component_activations);
        
        // Log the event
        this.logEvent('component_activation', traceData);
        
        // Emit for real-time monitoring
        this.emit('component_activation_traced', traceData);
        
        return traceData.trace_id;
    }
    
    traceKnowledgeSharing(sourceLibrarian, targetLibrarian, knowledgeType, data, result) {
        const traceData = {
            timestamp: Date.now(),
            source_librarian: sourceLibrarian,
            target_librarian: targetLibrarian,
            knowledge_type: knowledgeType,
            data_size: JSON.stringify(data).length,
            success: result.success,
            effectiveness_score: result.effectiveness || 0.5,
            usage_count: result.usageCount || 0,
            trust_adjustment: result.trustAdjustment || 0,
            error: result.error,
            trace_id: this.generateTraceId()
        };
        
        // Log the event
        this.logEvent('knowledge_sharing', traceData);
        
        // Emit for real-time monitoring
        this.emit('knowledge_sharing_traced', traceData);
        
        return traceData.trace_id;
    }
    
    traceSystemEvent(component, eventType, message, severity = 'info', metadata = {}) {
        const traceData = {
            timestamp: Date.now(),
            component: component,
            event_type: eventType,
            message: message,
            severity: severity,
            metadata: metadata,
            trace_id: this.generateTraceId()
        };
        
        // Update metrics
        this.metrics.events.system_events++;
        if (severity === 'error' || severity === 'critical') {
            this.metrics.events.errors++;
        }
        
        // Log the event
        this.logEvent('system_event', traceData);
        
        // Console log if enabled
        if (this.config.enableConsoleLogging) {
            const emoji = this.getSeverityEmoji(severity);
            console.log(`${emoji} [${component}] ${eventType}: ${message}`);
        }
        
        // Emit for real-time monitoring
        this.emit('system_event_traced', traceData);
        
        return traceData.trace_id;
    }
    
    traceError(component, errorType, error, metadata = {}) {
        const traceData = {
            timestamp: Date.now(),
            component: component,
            error_type: errorType,
            error_message: error.message || error.toString(),
            error_stack: error.stack,
            severity: 'error',
            metadata: metadata,
            trace_id: this.generateTraceId()
        };
        
        // Update metrics
        this.metrics.events.errors++;
        
        // Log the event
        this.logEvent('error', traceData);
        
        // Console log error
        console.error(`❌ [${component}] ${errorType}:`, error);
        
        // Emit for real-time monitoring
        this.emit('error_traced', traceData);
        
        return traceData.trace_id;
    }
    
    // ========================================
    // UTILITY METHODS
    // ========================================
    
    async logEvent(eventType, data) {
        const logEntry = {
            timestamp: Date.now(),
            event_type: eventType,
            ...data
        };
        
        // File logging
        if (this.config.enableFileLogging) {
            try {
                const filename = this.logFiles[eventType] || this.logFiles.system_events;
                await fs.appendFile(filename, JSON.stringify(logEntry) + '\n');
            } catch (error) {
                console.error('Failed to write log file:', error);
            }
        }
        
        // Add to active session if exists
        const sessionId = data.session_id;
        if (sessionId && this.activeSessions.has(sessionId)) {
            this.activeSessions.get(sessionId).events.push(logEntry);
        }
    }
    
    updateLibrarianStats(librarian, responseTime, success) {
        const stats = this.metrics.librarians[librarian];
        if (!stats) return;
        
        stats.queries++;
        
        // Update success rate
        const totalQueries = stats.queries;
        const prevSuccesses = Math.floor(stats.success_rate * (totalQueries - 1));
        const currentSuccesses = prevSuccesses + (success ? 1 : 0);
        stats.success_rate = currentSuccesses / totalQueries;
        
        // Update average time
        if (success) {
            stats.avg_time = (stats.avg_time * (prevSuccesses) + responseTime) / (prevSuccesses + 1);
        }
    }
    
    updateAverageMetric(metricName, value, count) {
        const current = this.metrics.performance[metricName];
        this.metrics.performance[metricName] = (current * (count - 1) + value) / count;
    }
    
    generateTraceId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    hashString(str) {
        return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
    }
    
    inferQueryType(query) {
        const queryLower = query.toLowerCase().trim();
        if (queryLower.startsWith('select')) return 'SELECT';
        if (queryLower.startsWith('insert')) return 'INSERT';
        if (queryLower.startsWith('update')) return 'UPDATE';
        if (queryLower.startsWith('delete')) return 'DELETE';
        if (queryLower.startsWith('create')) return 'CREATE';
        return 'OTHER';
    }
    
    getSeverityEmoji(severity) {
        const emojis = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            critical: '🚨'
        };
        return emojis[severity] || 'ℹ️';
    }
    
    getDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    async rotateLogs() {
        console.log('🔄 Rotating log files...');
        await this.initializeLogFiles();
    }
    
    async cleanOldLogs() {
        try {
            const files = await fs.readdir(this.config.logDir);
            const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
            
            for (const file of files) {
                const filePath = path.join(this.config.logDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Cleaned old log file: ${file}`);
                }
            }
        } catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    getMetrics() {
        return {
            ...this.metrics,
            active_sessions: this.activeSessions.size,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            cpu_usage: process.cpuUsage()
        };
    }
    
    getActiveSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }
    
    getAllActiveSessions() {
        return Array.from(this.activeSessions.values());
    }
    
    async searchLogs(eventType, filters = {}, limit = 100) {
        try {
            const filename = this.logFiles[eventType];
            if (!filename) return [];
            
            const content = await fs.readFile(filename, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            
            let events = lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(event => event !== null);
            
            // Apply filters
            if (filters.librarian) {
                events = events.filter(e => e.librarian === filters.librarian);
            }
            if (filters.since) {
                events = events.filter(e => e.timestamp >= filters.since);
            }
            if (filters.success !== undefined) {
                events = events.filter(e => e.success === filters.success);
            }
            
            return events.slice(-limit);
            
        } catch (error) {
            console.error('Failed to search logs:', error);
            return [];
        }
    }
    
    exportMetrics(format = 'json') {
        const metrics = this.getMetrics();
        
        if (format === 'prometheus') {
            return this.formatPrometheusMetrics(metrics);
        }
        
        return JSON.stringify(metrics, null, 2);
    }
    
    formatPrometheusMetrics(metrics) {
        let output = '';
        
        // Event counters
        Object.entries(metrics.events).forEach(([key, value]) => {
            output += `cal_system_events_total{type="${key}"} ${value}\n`;
        });
        
        // Performance metrics
        Object.entries(metrics.performance).forEach(([key, value]) => {
            output += `cal_system_${key} ${value}\n`;
        });
        
        // Librarian metrics
        Object.entries(metrics.librarians).forEach(([librarian, stats]) => {
            output += `cal_librarian_queries_total{librarian="${librarian}"} ${stats.queries}\n`;
            output += `cal_librarian_success_rate{librarian="${librarian}"} ${stats.success_rate}\n`;
            output += `cal_librarian_avg_time_ms{librarian="${librarian}"} ${stats.avg_time}\n`;
        });
        
        return output;
    }
}

module.exports = CalSystemTracer;

// Test if run directly
if (require.main === module) {
    const tracer = new CalSystemTracer();
    
    // Example usage
    tracer.on('tracer_ready', async () => {
        console.log('\n🧪 Testing Cal System Tracer...\n');
        
        // Start a trace session
        const sessionId = tracer.startTraceSession('user_query', 'test-session-123', {
            user_id: 'test-user',
            query: 'Find OSRS arbitrage opportunities'
        });
        
        // Simulate API call
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 150));
        tracer.traceApiCall('trade-cal', 'OSRS Grand Exchange API', 'GET', startTime, {
            success: true,
            statusCode: 200,
            cost: 0.0002,
            tokensUsed: 150,
            model: 'deepseek-coder',
            trustScore: 0.95
        });
        
        // Simulate model selection
        const selectionStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 50));
        tracer.traceModelSelection('trade-cal', 'Find profitable arbitrage', 'trading', 
            { model: 'deepseek-coder', provider: 'deepseek', cost: 0.0002 },
            { 
                steps: [
                    { action: 'analyze_domain', confidence: 0.9 },
                    { action: 'select_optimal_model', confidence: 0.85 }
                ],
                finalConfidence: 0.87
            },
            selectionStart,
            { success: true, cached: false, actualCost: 0.0002 }
        );
        
        // Simulate component activation
        const componentStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        tracer.traceComponentActivation('trade-cal', 'arbitrage_detector', 
            { market: 'osrs', items: ['Dragon bones'] },
            componentStart,
            {
                success: true,
                confidence: 0.9,
                sources: ['grand_exchange_api', 'runelite_api'],
                output: { opportunities: 3 }
            }
        );
        
        // End trace session
        tracer.endTraceSession(sessionId, {
            opportunities_found: 3,
            total_cost: 0.0002,
            user_satisfied: true
        });
        
        // Log some system events
        tracer.traceSystemEvent('market_hub', 'price_update', 'OSRS Dragon bones price updated', 'info');
        tracer.traceSystemEvent('model_router', 'cost_alert', 'Daily cost approaching limit', 'warn');
        
        // Show metrics after 2 seconds
        setTimeout(() => {
            console.log('\n📊 Current Metrics:');
            console.log(JSON.stringify(tracer.getMetrics(), null, 2));
            
            console.log('\n✅ All tracing features tested successfully!');
        }, 2000);
    });
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n🔴 Shutting down Cal System Tracer...');
        process.exit(0);
    });
}
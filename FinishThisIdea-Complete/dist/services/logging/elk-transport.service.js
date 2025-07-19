"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAnalyzer = exports.elkLogger = exports.LogAnalyzer = exports.ELKTransport = void 0;
exports.createELKLogger = createELKLogger;
const winston_1 = __importDefault(require("winston"));
const winston_transport_1 = __importDefault(require("winston-transport"));
const axios_1 = __importDefault(require("axios"));
const os_1 = require("os");
class ELKTransport extends winston_transport_1.default {
    options;
    logBuffer = [];
    flushTimer;
    logstashUrl;
    elasticsearchUrl;
    constructor(options = {}) {
        super(options);
        this.options = {
            logstashHost: process.env.LOGSTASH_HOST || 'localhost',
            logstashPort: parseInt(process.env.LOGSTASH_PORT || '5000'),
            elasticsearchHost: process.env.ELASTICSEARCH_HOST || 'localhost',
            elasticsearchPort: parseInt(process.env.ELASTICSEARCH_PORT || '9200'),
            indexPrefix: 'finishthisidea',
            messageType: 'application',
            includeMetadata: true,
            flushInterval: 5000,
            maxBatchSize: 100,
            ...options
        };
        this.logstashUrl = `http://${this.options.logstashHost}:${this.options.logstashPort}`;
        this.elasticsearchUrl = `http://${this.options.elasticsearchHost}:${this.options.elasticsearchPort}`;
        this.startFlushTimer();
    }
    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        const logEntry = this.formatLogEntry(info);
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length >= this.options.maxBatchSize) {
            this.flush();
        }
        callback();
    }
    formatLogEntry(info) {
        const entry = {
            '@timestamp': new Date().toISOString(),
            level: info.level,
            message: info.message,
            type: this.options.messageType,
            hostname: (0, os_1.hostname)(),
            application: 'finishthisidea',
            environment: process.env.NODE_ENV || 'development'
        };
        if (this.options.includeMetadata) {
            const { level, message, timestamp, ...metadata } = info;
            Object.assign(entry, metadata);
            if (metadata.error) {
                entry.error = {
                    type: metadata.error.name || 'Error',
                    message: metadata.error.message,
                    stack: metadata.error.stack
                };
            }
            if (metadata.req) {
                entry.request = {
                    method: metadata.req.method,
                    url: metadata.req.url,
                    ip: metadata.req.ip,
                    userAgent: metadata.req.get('user-agent')
                };
            }
            if (metadata.userId) {
                entry.userId = metadata.userId;
            }
            if (metadata.duration) {
                entry.duration = metadata.duration;
            }
        }
        return entry;
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            if (this.logBuffer.length > 0) {
                this.flush();
            }
        }, this.options.flushInterval);
    }
    async flush() {
        if (this.logBuffer.length === 0)
            return;
        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];
        try {
            await axios_1.default.post(`${this.logstashUrl}/`, logsToSend, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
        }
        catch (error) {
            try {
                await this.bulkInsertToElasticsearch(logsToSend);
            }
            catch (esError) {
                console.error('Failed to send logs to ELK:', error);
                this.logBuffer.unshift(...logsToSend.slice(0, 10));
            }
        }
    }
    async bulkInsertToElasticsearch(logs) {
        const bulkBody = logs.flatMap(log => [
            {
                index: {
                    _index: `${this.options.indexPrefix}-${log.type}-${new Date().toISOString().split('T')[0]}`
                }
            },
            log
        ]);
        await axios_1.default.post(`${this.elasticsearchUrl}/_bulk`, bulkBody.map(item => JSON.stringify(item)).join('\n') + '\n', {
            headers: {
                'Content-Type': 'application/x-ndjson'
            },
            timeout: 10000
        });
    }
    close() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
}
exports.ELKTransport = ELKTransport;
function createELKLogger(options) {
    const elkTransport = new ELKTransport(options);
    return winston_1.default.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
        transports: [
            elkTransport,
            ...(process.env.NODE_ENV !== 'production' ? [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                })
            ] : [])
        ]
    });
}
class LogAnalyzer {
    elasticsearchUrl;
    constructor() {
        this.elasticsearchUrl = `http://${process.env.ELASTICSEARCH_HOST || 'localhost'}:${process.env.ELASTICSEARCH_PORT || '9200'}`;
    }
    async searchLogs(query, index) {
        const targetIndex = index || 'finishthisidea-*';
        const response = await axios_1.default.post(`${this.elasticsearchUrl}/${targetIndex}/_search`, query, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    async getErrorTrends(timeRange = '24h') {
        const query = {
            size: 0,
            query: {
                bool: {
                    filter: [
                        { term: { level: 'error' } },
                        { range: { '@timestamp': { gte: `now-${timeRange}` } } }
                    ]
                }
            },
            aggs: {
                errors_over_time: {
                    date_histogram: {
                        field: '@timestamp',
                        calendar_interval: '1h'
                    },
                    aggs: {
                        by_error_type: {
                            terms: {
                                field: 'error.type',
                                size: 10
                            }
                        }
                    }
                }
            }
        };
        return this.searchLogs(query, 'finishthisidea-errors-*');
    }
    async getSlowRequests(threshold = 5000) {
        const query = {
            size: 100,
            query: {
                bool: {
                    filter: [
                        { range: { duration: { gte: threshold } } },
                        { range: { '@timestamp': { gte: 'now-1h' } } }
                    ]
                }
            },
            sort: [
                { duration: { order: 'desc' } }
            ]
        };
        return this.searchLogs(query);
    }
    async getUserActivity(userId, days = 7) {
        const query = {
            size: 1000,
            query: {
                bool: {
                    filter: [
                        { term: { userId } },
                        { range: { '@timestamp': { gte: `now-${days}d` } } }
                    ]
                }
            },
            sort: [
                { '@timestamp': { order: 'desc' } }
            ]
        };
        return this.searchLogs(query);
    }
    async getSecurityEvents(hours = 24) {
        const query = {
            size: 100,
            query: {
                bool: {
                    filter: [
                        { term: { 'tags.keyword': 'security_event' } },
                        { range: { '@timestamp': { gte: `now-${hours}h` } } }
                    ]
                }
            },
            sort: [
                { '@timestamp': { order: 'desc' } }
            ]
        };
        return this.searchLogs(query, 'finishthisidea-security-*');
    }
}
exports.LogAnalyzer = LogAnalyzer;
exports.elkLogger = createELKLogger();
exports.logAnalyzer = new LogAnalyzer();
//# sourceMappingURL=elk-transport.service.js.map
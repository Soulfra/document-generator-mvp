"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaosEngineering = exports.CircuitBreaker = exports.ChaosEngineeringService = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const redis_1 = __importDefault(require("../../config/redis"));
const os = __importStar(require("os"));
class ChaosEngineeringService extends events_1.EventEmitter {
    static instance;
    experiments = new Map();
    activeExperiments = new Set();
    circuitBreakers = new Map();
    isEnabled;
    constructor() {
        super();
        this.isEnabled = process.env.CHAOS_ENGINEERING_ENABLED === 'true' &&
            process.env.NODE_ENV !== 'production';
        if (this.isEnabled) {
            this.initializeDefaultExperiments();
        }
    }
    static getInstance() {
        if (!ChaosEngineeringService.instance) {
            ChaosEngineeringService.instance = new ChaosEngineeringService();
        }
        return ChaosEngineeringService.instance;
    }
    initializeDefaultExperiments() {
        const defaults = [
            {
                id: 'api-latency',
                name: 'API Latency Injection',
                description: 'Adds random latency to API requests',
                type: 'latency',
                target: '/api/*',
                probability: 0.1,
                duration: 2000,
                enabled: false,
                config: {
                    minLatency: 500,
                    maxLatency: 3000
                }
            },
            {
                id: 'db-error',
                name: 'Database Error Simulation',
                description: 'Simulates database connection errors',
                type: 'database',
                probability: 0.05,
                enabled: false,
                config: {
                    errorType: 'connection_timeout'
                }
            },
            {
                id: 'memory-pressure',
                name: 'Memory Pressure',
                description: 'Simulates high memory usage',
                type: 'resource',
                probability: 0.1,
                duration: 60000,
                enabled: false,
                config: {
                    memoryPercent: 80
                }
            },
            {
                id: 'network-partition',
                name: 'Network Partition',
                description: 'Simulates network failures',
                type: 'network',
                target: 'redis',
                probability: 0.05,
                duration: 5000,
                enabled: false
            },
            {
                id: 'random-500',
                name: 'Random 500 Errors',
                description: 'Returns random 500 errors',
                type: 'error',
                target: '/api/*',
                probability: 0.02,
                enabled: false,
                config: {
                    statusCode: 500,
                    message: 'Chaos: Simulated server error'
                }
            }
        ];
        defaults.forEach(exp => {
            this.experiments.set(exp.id, exp);
        });
    }
    middleware() {
        return async (req, res, next) => {
            if (!this.isEnabled) {
                return next();
            }
            for (const [id, experiment] of this.experiments) {
                if (!experiment.enabled)
                    continue;
                if (this.shouldTrigger(experiment, req)) {
                    try {
                        await this.executeExperiment(experiment, req, res, next);
                        return;
                    }
                    catch (error) {
                        logger_1.logger.error('Chaos experiment failed', { experimentId: id, error });
                    }
                }
            }
            next();
        };
    }
    shouldTrigger(experiment, req) {
        if (experiment.target) {
            if (experiment.target.includes('*')) {
                const pattern = experiment.target.replace('*', '.*');
                if (!new RegExp(pattern).test(req.path)) {
                    return false;
                }
            }
            else if (!req.path.startsWith(experiment.target)) {
                return false;
            }
        }
        return Math.random() < experiment.probability;
    }
    async executeExperiment(experiment, req, res, next) {
        this.activeExperiments.add(experiment.id);
        const startTime = Date.now();
        logger_1.logger.warn('Chaos experiment triggered', {
            experimentId: experiment.id,
            type: experiment.type,
            path: req.path
        });
        this.emit('experiment:triggered', {
            experiment,
            request: {
                method: req.method,
                path: req.path,
                ip: req.ip
            }
        });
        try {
            switch (experiment.type) {
                case 'latency':
                    await this.injectLatency(experiment, req, res, next);
                    break;
                case 'error':
                    await this.injectError(experiment, req, res);
                    break;
                case 'resource':
                    await this.injectResourcePressure(experiment);
                    next();
                    break;
                case 'network':
                    await this.injectNetworkFailure(experiment, req, res, next);
                    break;
                case 'database':
                    await this.injectDatabaseError(experiment, req, res, next);
                    break;
                default:
                    next();
            }
        }
        finally {
            this.activeExperiments.delete(experiment.id);
            const result = {
                experimentId: experiment.id,
                timestamp: new Date(),
                triggered: true,
                affectedRequests: 1,
                impact: `Added ${Date.now() - startTime}ms delay`
            };
            await this.recordResult(result);
        }
    }
    async injectLatency(experiment, req, res, next) {
        const config = experiment.config || {};
        const minLatency = config.minLatency || 100;
        const maxLatency = config.maxLatency || experiment.duration || 1000;
        const latency = Math.random() * (maxLatency - minLatency) + minLatency;
        logger_1.logger.info('Injecting latency', { latency, path: req.path });
        setTimeout(() => next(), latency);
    }
    async injectError(experiment, req, res) {
        const config = experiment.config || {};
        const statusCode = config.statusCode || 500;
        const message = config.message || 'Chaos: Injected error';
        logger_1.logger.info('Injecting error', { statusCode, path: req.path });
        res.status(statusCode).json({
            success: false,
            error: message,
            chaos: true,
            experimentId: experiment.id
        });
    }
    async injectResourcePressure(experiment) {
        const config = experiment.config || {};
        if (config.memoryPercent) {
            const totalMemory = os.totalmem();
            const targetMemory = (totalMemory * config.memoryPercent) / 100;
            const currentMemory = process.memoryUsage().heapUsed;
            const toAllocate = Math.max(0, targetMemory - currentMemory);
            logger_1.logger.info('Injecting memory pressure', {
                targetPercent: config.memoryPercent,
                bytesToAllocate: toAllocate
            });
            const chunks = [];
            const chunkSize = 1024 * 1024;
            const numChunks = Math.floor(toAllocate / chunkSize);
            for (let i = 0; i < numChunks; i++) {
                chunks.push(Buffer.alloc(chunkSize));
            }
            setTimeout(() => {
                chunks.length = 0;
                logger_1.logger.info('Released memory pressure');
            }, experiment.duration || 10000);
        }
    }
    async injectNetworkFailure(experiment, req, res, next) {
        if (experiment.target === 'redis') {
            logger_1.logger.info('Simulating Redis network failure');
            const originalGet = redis_1.default.get;
            const originalSet = redis_1.default.set;
            redis_1.default.get = async () => {
                throw new Error('Chaos: Redis connection lost');
            };
            redis_1.default.set = async () => {
                throw new Error('Chaos: Redis connection lost');
            };
            setTimeout(() => {
                redis_1.default.get = originalGet;
                redis_1.default.set = originalSet;
                logger_1.logger.info('Restored Redis connection');
            }, experiment.duration || 5000);
        }
        next();
    }
    async injectDatabaseError(experiment, req, res, next) {
        logger_1.logger.info('Simulating database connection timeout');
        setTimeout(() => {
            logger_1.logger.info('Database simulation ended');
        }, experiment.duration || 5000);
        next();
    }
    async recordResult(result) {
        const key = `chaos:results:${result.experimentId}:${Date.now()}`;
        await redis_1.default.setex(key, 86400, JSON.stringify(result));
        await redis_1.default.zadd(`chaos:history:${result.experimentId}`, Date.now(), key);
    }
    enableExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (experiment) {
            experiment.enabled = true;
            logger_1.logger.info('Chaos experiment enabled', { experimentId });
            this.emit('experiment:enabled', experiment);
        }
    }
    disableExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (experiment) {
            experiment.enabled = false;
            logger_1.logger.info('Chaos experiment disabled', { experimentId });
            this.emit('experiment:disabled', experiment);
        }
    }
    createExperiment(experiment) {
        this.experiments.set(experiment.id, experiment);
        logger_1.logger.info('Created chaos experiment', { experimentId: experiment.id });
    }
    async getExperimentResults(experimentId, limit = 100) {
        const keys = await redis_1.default.zrevrange(`chaos:history:${experimentId}`, 0, limit - 1);
        const results = [];
        for (const key of keys) {
            const data = await redis_1.default.get(key);
            if (data) {
                results.push(JSON.parse(data));
            }
        }
        return results;
    }
    getExperiments() {
        return Array.from(this.experiments.values());
    }
    getCircuitBreaker(serviceName) {
        if (!this.circuitBreakers.has(serviceName)) {
            this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
        }
        return this.circuitBreakers.get(serviceName);
    }
}
exports.ChaosEngineeringService = ChaosEngineeringService;
class CircuitBreaker {
    serviceName;
    state = 'closed';
    failures = 0;
    successes = 0;
    lastFailureTime;
    threshold = 5;
    timeout = 60000;
    successThreshold = 3;
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    async execute(operation, fallback) {
        if (this.state === 'open') {
            if (Date.now() - (this.lastFailureTime?.getTime() || 0) > this.timeout) {
                this.state = 'half-open';
                logger_1.logger.info('Circuit breaker half-open', { service: this.serviceName });
            }
            else if (fallback) {
                return fallback();
            }
            else {
                throw new Error(`Circuit breaker open for ${this.serviceName}`);
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        if (this.state === 'half-open') {
            this.successes++;
            if (this.successes >= this.successThreshold) {
                this.state = 'closed';
                this.successes = 0;
                logger_1.logger.info('Circuit breaker closed', { service: this.serviceName });
            }
        }
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = new Date();
        this.successes = 0;
        if (this.failures >= this.threshold) {
            this.state = 'open';
            logger_1.logger.warn('Circuit breaker opened', {
                service: this.serviceName,
                failures: this.failures
            });
        }
    }
    getState() {
        return this.state;
    }
    reset() {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = undefined;
    }
}
exports.CircuitBreaker = CircuitBreaker;
exports.chaosEngineering = ChaosEngineeringService.getInstance();
//# sourceMappingURL=chaos-engineering.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetry = exports.OpenTelemetryService = void 0;
exports.Trace = Trace;
exports.TraceClass = TraceClass;
exports.createChildSpan = createChildSpan;
exports.withTracing = withTracing;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const instrumentation_1 = require("@opentelemetry/instrumentation");
const instrumentation_express_1 = require("@opentelemetry/instrumentation-express");
const instrumentation_http_1 = require("@opentelemetry/instrumentation-http");
const instrumentation_redis_4_1 = require("@opentelemetry/instrumentation-redis-4");
const instrumentation_ioredis_1 = require("@opentelemetry/instrumentation-ioredis");
const api_1 = require("@opentelemetry/api");
const logger_1 = require("../../utils/logger");
const defaultConfig = {
    serviceName: 'finishthisidea',
    serviceVersion: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    jaegerAgentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
    jaegerAgentPort: parseInt(process.env.JAEGER_AGENT_PORT || '6831'),
    enableConsoleExporter: process.env.NODE_ENV === 'development',
    enableAutoInstrumentation: true,
    samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || '0.1')
};
class OpenTelemetryService {
    static instance;
    sdk;
    tracer;
    config;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        this.tracer = api_1.trace.getTracer(this.config.serviceName, this.config.serviceVersion);
    }
    static getInstance(config) {
        if (!OpenTelemetryService.instance) {
            OpenTelemetryService.instance = new OpenTelemetryService(config);
        }
        return OpenTelemetryService.instance;
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing OpenTelemetry', this.config);
            const resource = resources_1.Resource.default().merge(new resources_1.Resource({
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
                [semantic_conventions_1.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
                'service.namespace': 'finishthisidea',
                'service.instance.id': process.env.HOSTNAME || 'local'
            }));
            const jaegerExporter = new exporter_jaeger_1.JaegerExporter({
                endpoint: this.config.jaegerEndpoint,
            });
            const spanProcessor = new sdk_trace_base_1.BatchSpanProcessor(jaegerExporter);
            const instrumentations = [
                new instrumentation_http_1.HttpInstrumentation({
                    requestHook: (span, request) => {
                        span.setAttributes({
                            'http.request.body.size': request.headers['content-length'] || 0,
                            'http.user_agent': request.headers['user-agent'] || 'unknown'
                        });
                    },
                    responseHook: (span, response) => {
                        span.setAttributes({
                            'http.response.body.size': response.headers['content-length'] || 0
                        });
                    }
                }),
                new instrumentation_express_1.ExpressInstrumentation({
                    requestHook: (span, info) => {
                        span.setAttributes({
                            'express.route': info.route,
                            'express.type': info.layerType
                        });
                    }
                }),
                new instrumentation_redis_4_1.RedisInstrumentation(),
                new instrumentation_ioredis_1.IORedisInstrumentation()
            ];
            (0, instrumentation_1.registerInstrumentations)({
                instrumentations: this.config.enableAutoInstrumentation
                    ? [...instrumentations, ...(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()]
                    : instrumentations
            });
            this.sdk = new sdk_node_1.NodeSDK({
                resource,
                spanProcessor,
                instrumentations: []
            });
            await this.sdk.start();
            logger_1.logger.info('OpenTelemetry initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize OpenTelemetry', error);
            throw error;
        }
    }
    createSpan(name, options) {
        return this.tracer.startSpan(name, {
            kind: options?.kind || api_1.SpanKind.INTERNAL,
            attributes: options?.attributes || {}
        });
    }
    async traceAsync(name, operation, attributes) {
        const span = this.createSpan(name, { attributes });
        try {
            const result = await operation();
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            return result;
        }
        catch (error) {
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: error.message
            });
            span.recordException(error);
            throw error;
        }
        finally {
            span.end();
        }
    }
    trace(name, operation, attributes) {
        const span = this.createSpan(name, { attributes });
        try {
            const result = operation();
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            return result;
        }
        catch (error) {
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: error.message
            });
            span.recordException(error);
            throw error;
        }
        finally {
            span.end();
        }
    }
    addEvent(name, attributes) {
        const span = api_1.trace.getActiveSpan();
        if (span) {
            span.addEvent(name, attributes);
        }
    }
    setAttributes(attributes) {
        const span = api_1.trace.getActiveSpan();
        if (span) {
            span.setAttributes(attributes);
        }
    }
    getCurrentTraceId() {
        const span = api_1.trace.getActiveSpan();
        return span?.spanContext().traceId;
    }
    createTraceContext() {
        const span = api_1.trace.getActiveSpan();
        if (!span)
            return {};
        const spanContext = span.spanContext();
        return {
            'x-trace-id': spanContext.traceId,
            'x-span-id': spanContext.spanId,
            'x-trace-flags': spanContext.traceFlags.toString()
        };
    }
    expressMiddleware() {
        return (req, res, next) => {
            const traceId = req.headers['x-trace-id'];
            const spanId = req.headers['x-span-id'];
            req.traceId = traceId || this.getCurrentTraceId();
            if (req.traceId) {
                res.setHeader('X-Trace-Id', req.traceId);
            }
            next();
        };
    }
    async shutdown() {
        if (this.sdk) {
            await this.sdk.shutdown();
            logger_1.logger.info('OpenTelemetry shut down');
        }
    }
}
exports.OpenTelemetryService = OpenTelemetryService;
function Trace(spanName) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        const name = spanName || `${target.constructor.name}.${propertyName}`;
        descriptor.value = async function (...args) {
            const telemetry = OpenTelemetryService.getInstance();
            return telemetry.traceAsync(name, () => method.apply(this, args), {
                'method.name': propertyName,
                'method.args.count': args.length
            });
        };
        return descriptor;
    };
}
function TraceClass(className) {
    return function (constructor) {
        const name = className || constructor.name;
        Object.getOwnPropertyNames(constructor.prototype).forEach(propertyName => {
            const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, propertyName);
            if (descriptor && typeof descriptor.value === 'function' && propertyName !== 'constructor') {
                const originalMethod = descriptor.value;
                descriptor.value = async function (...args) {
                    const telemetry = OpenTelemetryService.getInstance();
                    return telemetry.traceAsync(`${name}.${propertyName}`, () => originalMethod.apply(this, args), {
                        'class.name': name,
                        'method.name': propertyName,
                        'method.args.count': args.length
                    });
                };
                Object.defineProperty(constructor.prototype, propertyName, descriptor);
            }
        });
    };
}
function createChildSpan(name, attributes) {
    const tracer = api_1.trace.getTracer('finishthisidea');
    const parentSpan = api_1.trace.getActiveSpan();
    if (parentSpan) {
        const ctx = api_1.trace.setSpan(api_1.context.active(), parentSpan);
        return tracer.startSpan(name, { attributes }, ctx);
    }
    return tracer.startSpan(name, { attributes });
}
function withTracing(name, fn, attributes) {
    const telemetry = OpenTelemetryService.getInstance();
    return telemetry.traceAsync(name, fn, attributes);
}
exports.telemetry = OpenTelemetryService.getInstance();
//# sourceMappingURL=opentelemetry.service.js.map
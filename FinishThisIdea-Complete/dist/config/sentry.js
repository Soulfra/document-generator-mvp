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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryUtils = void 0;
exports.initializeSentry = initializeSentry;
exports.setupSentryFingerprinting = setupSentryFingerprinting;
exports.closeSentry = closeSentry;
exports.getSentryHealth = getSentryHealth;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const logger_1 = require("../utils/logger");
const getSentryConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    return {
        dsn: process.env.SENTRY_DSN || '',
        environment: process.env.NODE_ENV || 'development',
        release: process.env.SENTRY_RELEASE || `finishthisidea@${process.env.npm_package_version || '1.0.0'}`,
        sampleRate: isProduction ? 1.0 : 0.5,
        tracesSampleRate: isProduction ? 0.2 : 0.1,
        profilesSampleRate: isProduction ? 0.1 : 0.05,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app: undefined }),
            new Sentry.Integrations.Postgres(),
            new Sentry.Integrations.Redis(),
            new profiling_node_1.ProfilingIntegration(),
            new Sentry.Integrations.OnUncaughtException({
                exitEvenIfOtherHandlersAreRegistered: false,
            }),
            new Sentry.Integrations.OnUnhandledRejection({
                mode: 'warn',
            }),
        ],
        beforeSend: (event) => {
            if (isDevelopment && event.level === 'warning') {
                return null;
            }
            if (event.extra) {
                event.extra.timestamp = new Date().toISOString();
                event.extra.nodeVersion = process.version;
                event.extra.platform = process.platform;
            }
            return event;
        },
        beforeSendTransaction: (transaction) => {
            if (transaction.name?.includes('/health')) {
                return null;
            }
            if (transaction.name?.includes('/static/') || transaction.name?.includes('/assets/')) {
                return null;
            }
            return transaction;
        },
    };
};
function initializeSentry() {
    try {
        const config = getSentryConfig();
        if (!config.dsn) {
            logger_1.logger.warn('Sentry DSN not configured - error tracking disabled');
            return;
        }
        Sentry.init(config);
        Sentry.setTag('service', 'finishthisidea-backend');
        Sentry.setTag('node_version', process.version);
        logger_1.logger.info('Sentry initialized successfully', {
            environment: config.environment,
            release: config.release,
            sampleRate: config.sampleRate,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Sentry', { error });
    }
}
class SentryUtils {
    static captureException(error, context) {
        return Sentry.captureException(error, {
            tags: {
                component: context?.component || 'unknown',
                operation: context?.operation || 'unknown',
            },
            extra: {
                ...context,
                timestamp: new Date().toISOString(),
            },
            level: 'error',
        });
    }
    static captureMessage(message, level = 'info', context) {
        return Sentry.captureMessage(message, {
            level,
            tags: {
                component: context?.component || 'unknown',
            },
            extra: context,
        });
    }
    static setUser(user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.username,
            segment: user.tier || 'free',
        });
    }
    static addBreadcrumb(message, category, data) {
        Sentry.addBreadcrumb({
            message,
            category,
            data,
            level: 'info',
            timestamp: Date.now() / 1000,
        });
    }
    static startTransaction(name, operation) {
        return Sentry.startTransaction({
            name,
            op: operation,
            tags: {
                service: 'finishthisidea',
            },
        });
    }
    static async trackLLMCall(provider, operation, fn, context) {
        const transaction = Sentry.startTransaction({
            name: `llm.${provider}.${operation}`,
            op: 'llm.call',
            tags: {
                provider,
                operation,
            },
        });
        const span = transaction.startChild({
            op: 'llm.request',
            description: `${provider} ${operation} call`,
        });
        try {
            span.setData('context', context);
            const result = await fn();
            span.setStatus('ok');
            transaction.setStatus('ok');
            return result;
        }
        catch (error) {
            span.setStatus('internal_error');
            transaction.setStatus('internal_error');
            SentryUtils.captureException(error, {
                component: 'llm',
                provider,
                operation,
                ...context,
            });
            throw error;
        }
        finally {
            span.finish();
            transaction.finish();
        }
    }
    static async trackDatabaseOperation(operation, table, fn) {
        const transaction = Sentry.startTransaction({
            name: `db.${table}.${operation}`,
            op: 'db.query',
            tags: {
                table,
                operation,
            },
        });
        try {
            const result = await fn();
            transaction.setStatus('ok');
            return result;
        }
        catch (error) {
            transaction.setStatus('internal_error');
            SentryUtils.captureException(error, {
                component: 'database',
                table,
                operation,
            });
            throw error;
        }
        finally {
            transaction.finish();
        }
    }
    static async trackExternalCall(service, operation, fn, url) {
        const transaction = Sentry.startTransaction({
            name: `external.${service}.${operation}`,
            op: 'http.client',
            tags: {
                service,
                operation,
            },
        });
        if (url) {
            transaction.setData('url', url);
        }
        try {
            const result = await fn();
            transaction.setStatus('ok');
            return result;
        }
        catch (error) {
            transaction.setStatus('internal_error');
            SentryUtils.captureException(error, {
                component: 'external_service',
                service,
                operation,
                url,
            });
            throw error;
        }
        finally {
            transaction.finish();
        }
    }
}
exports.SentryUtils = SentryUtils;
function setupSentryFingerprinting() {
    Sentry.configureScope((scope) => {
        scope.setFingerprint(['{{ default }}', process.env.NODE_ENV || 'unknown']);
    });
}
function closeSentry() {
    return Sentry.close(2000);
}
function getSentryHealth() {
    return {
        status: 'ok',
        configured: !!process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
    };
}
exports.default = Sentry;
//# sourceMappingURL=sentry.js.map
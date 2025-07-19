"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputValidationService = exports.InputValidationService = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const defaultConfig = {
    enableXSSProtection: true,
    enableSQLInjectionDetection: true,
    enableFilePathTraversal: true,
    enableNoScriptTags: true,
    maxStringLength: 10000,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: ['href', 'title', 'target']
};
class InputValidationService {
    static instance;
    config;
    sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
        /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
        /((\%27)|(\'))((\%73)|s|(\%53))((\%65)|e|(\%45))((\%6C)|l|(\%4C))((\%65)|e|(\%45))((\%63)|c|(\%43))((\%74)|t|(\%54))/gi,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|((\%3C)|<)|((\%3E)|>))/gi,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
        /((\%27)|(\'))union/gi,
        /exec(\s|\+)+(s|x)p\w+/gi,
        /UNION.*SELECT/gi,
        /1=1|1=1|'='|''=''/gi
    ];
    pathTraversalPatterns = [
        /\.\.\//gi,
        /\.\.\\g/gi,
        /%2e%2e%2f/gi,
        /%2e%2e%5c/gi,
        /\.\.%2f/gi,
        /\.\.%5c/gi
    ];
    xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<form/gi,
        /vbscript:/gi,
        /data:text\/html/gi
    ];
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
    }
    static getInstance(config) {
        if (!InputValidationService.instance) {
            InputValidationService.instance = new InputValidationService(config);
        }
        return InputValidationService.instance;
    }
    sanitizeHTML(input) {
        const start = Date.now();
        try {
            const sanitized = purify.sanitize(input, {
                ALLOWED_TAGS: this.config.allowedTags,
                ALLOWED_ATTR: this.config.allowedAttributes,
                ALLOW_DATA_ATTR: false,
                ALLOW_UNKNOWN_PROTOCOLS: false,
                RETURN_DOM: false,
                RETURN_DOM_FRAGMENT: false,
                SANITIZE_DOM: true
            });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'input_sanitize_html' }, Date.now() - start);
            return sanitized;
        }
        catch (error) {
            logger_1.logger.error('HTML sanitization error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'input_sanitize_html_error' });
            return '';
        }
    }
    detectSQLInjection(input) {
        if (!this.config.enableSQLInjectionDetection)
            return false;
        const start = Date.now();
        try {
            const detected = this.sqlInjectionPatterns.some(pattern => pattern.test(input));
            if (detected) {
                logger_1.logger.warn('SQL injection attempt detected', { input: input.substring(0, 100) });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'sql_injection_detected' });
            }
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'input_sql_injection_check' }, Date.now() - start);
            return detected;
        }
        catch (error) {
            logger_1.logger.error('SQL injection detection error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'sql_injection_check_error' });
            return false;
        }
    }
    detectPathTraversal(input) {
        if (!this.config.enableFilePathTraversal)
            return false;
        const start = Date.now();
        try {
            const detected = this.pathTraversalPatterns.some(pattern => pattern.test(input));
            if (detected) {
                logger_1.logger.warn('Path traversal attempt detected', { input: input.substring(0, 100) });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'path_traversal_detected' });
            }
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'input_path_traversal_check' }, Date.now() - start);
            return detected;
        }
        catch (error) {
            logger_1.logger.error('Path traversal detection error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'path_traversal_check_error' });
            return false;
        }
    }
    detectXSS(input) {
        if (!this.config.enableXSSProtection)
            return false;
        const start = Date.now();
        try {
            const detected = this.xssPatterns.some(pattern => pattern.test(input));
            if (detected) {
                logger_1.logger.warn('XSS attempt detected', { input: input.substring(0, 100) });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'xss_detected' });
            }
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'input_xss_check' }, Date.now() - start);
            return detected;
        }
        catch (error) {
            logger_1.logger.error('XSS detection error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'xss_check_error' });
            return false;
        }
    }
    validateInput(input, type = 'string') {
        const threats = [];
        let sanitized = input;
        let isValid = true;
        if (typeof input === 'string') {
            if (input.length > this.config.maxStringLength) {
                threats.push('INPUT_TOO_LONG');
                isValid = false;
            }
            if (this.detectSQLInjection(input)) {
                threats.push('SQL_INJECTION');
                isValid = false;
            }
            if (this.detectPathTraversal(input)) {
                threats.push('PATH_TRAVERSAL');
                isValid = false;
            }
            if (this.detectXSS(input)) {
                threats.push('XSS_ATTEMPT');
                isValid = false;
            }
            switch (type) {
                case 'html':
                    sanitized = this.sanitizeHTML(input);
                    break;
                case 'email':
                    sanitized = input.toLowerCase().trim();
                    isValid = isValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);
                    break;
                case 'url':
                    try {
                        new URL(input);
                        sanitized = input.trim();
                    }
                    catch {
                        isValid = false;
                        threats.push('INVALID_URL');
                    }
                    break;
                case 'number':
                    const num = Number(input);
                    isValid = isValid && !isNaN(num) && isFinite(num);
                    sanitized = isValid ? num : null;
                    break;
                default:
                    sanitized = input.trim();
            }
        }
        return { isValid, sanitized, threats };
    }
    middleware(options = {}) {
        const { validateBody = true, validateQuery = true, validateParams = true, allowedFields = [], requiredFields = [] } = options;
        return (req, res, next) => {
            const start = Date.now();
            const threats = [];
            let hasInvalidInput = false;
            try {
                if (validateBody && req.body) {
                    const result = this.validateObject(req.body, allowedFields, requiredFields);
                    if (!result.isValid) {
                        hasInvalidInput = true;
                        threats.push(...result.threats);
                    }
                    else {
                        req.body = result.sanitized;
                    }
                }
                if (validateQuery && req.query) {
                    const result = this.validateObject(req.query, allowedFields);
                    if (!result.isValid) {
                        hasInvalidInput = true;
                        threats.push(...result.threats);
                    }
                    else {
                        req.query = result.sanitized;
                    }
                }
                if (validateParams && req.params) {
                    const result = this.validateObject(req.params);
                    if (!result.isValid) {
                        hasInvalidInput = true;
                        threats.push(...result.threats);
                    }
                    else {
                        req.params = result.sanitized;
                    }
                }
                if (hasInvalidInput) {
                    logger_1.logger.warn('Input validation failed', {
                        method: req.method,
                        path: req.path,
                        ip: req.ip,
                        threats,
                        userAgent: req.get('user-agent')
                    });
                    prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'input_validation_failed' });
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_INPUT',
                            message: 'Input validation failed',
                            threats: process.env.NODE_ENV === 'development' ? threats : undefined
                        }
                    });
                }
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'input_validation_middleware' }, Date.now() - start);
                next();
            }
            catch (error) {
                logger_1.logger.error('Input validation middleware error', error);
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'input_validation_middleware_error' });
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Input validation error'
                    }
                });
            }
        };
    }
    validateObject(obj, allowedFields = [], requiredFields = []) {
        const threats = [];
        const sanitized = {};
        let isValid = true;
        for (const field of requiredFields) {
            if (!obj.hasOwnProperty(field) || obj[field] === undefined || obj[field] === null) {
                threats.push(`MISSING_REQUIRED_FIELD_${field.toUpperCase()}`);
                isValid = false;
            }
        }
        for (const [key, value] of Object.entries(obj)) {
            if (allowedFields.length > 0 && !allowedFields.includes(key)) {
                threats.push(`UNEXPECTED_FIELD_${key.toUpperCase()}`);
                continue;
            }
            if (typeof value === 'string') {
                const result = this.validateInput(value);
                if (!result.isValid) {
                    threats.push(...result.threats.map(t => `${key.toUpperCase()}_${t}`));
                    isValid = false;
                }
                else {
                    sanitized[key] = result.sanitized;
                }
            }
            else {
                sanitized[key] = value;
            }
        }
        return { isValid, sanitized, threats };
    }
    createSecureSchema(schema) {
        return schema.custom((value, helpers) => {
            if (typeof value === 'object' && value !== null) {
                const result = this.validateObject(value);
                if (!result.isValid) {
                    return helpers.error('any.invalid', { threats: result.threats });
                }
                return result.sanitized;
            }
            return value;
        });
    }
}
exports.InputValidationService = InputValidationService;
exports.inputValidationService = InputValidationService.getInstance();
//# sourceMappingURL=input-validation.service.js.map
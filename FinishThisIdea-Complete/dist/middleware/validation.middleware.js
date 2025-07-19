"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = exports.validationSchemas = exports.sanitizers = exports.commonSchemas = void 0;
exports.validate = validate;
exports.securityValidation = securityValidation;
const joi_1 = __importDefault(require("joi"));
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
exports.commonSchemas = {
    uuid: joi_1.default.string().uuid({ version: 'uuidv4' }),
    email: joi_1.default.string().email().max(255),
    password: joi_1.default.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    url: joi_1.default.string().uri(),
    filename: joi_1.default.string().max(255).pattern(/^[a-zA-Z0-9._-]+$/),
    positiveInteger: joi_1.default.number().integer().positive(),
    nonNegativeInteger: joi_1.default.number().integer().min(0),
    percentage: joi_1.default.number().min(0).max(100),
    shortText: joi_1.default.string().max(255).trim(),
    mediumText: joi_1.default.string().max(1000).trim(),
    longText: joi_1.default.string().max(10000).trim(),
    platformTokens: joi_1.default.number().integer().min(0).max(1000000),
    trustTier: joi_1.default.string().valid('seedling', 'sprout', 'sapling', 'tree', 'forest'),
    jobStatus: joi_1.default.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
    paymentStatus: joi_1.default.string().valid('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'),
    fileUpload: joi_1.default.object({
        filename: joi_1.default.string().required(),
        mimetype: joi_1.default.string().valid('application/zip', 'application/x-zip-compressed', 'text/plain', 'text/javascript', 'text/typescript', 'application/json'),
        size: joi_1.default.number().max(100 * 1024 * 1024)
    }),
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        sortBy: joi_1.default.string().max(50),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
    }),
    dateRange: joi_1.default.object({
        startDate: joi_1.default.date().iso(),
        endDate: joi_1.default.date().iso().greater(joi_1.default.ref('startDate'))
    })
};
exports.sanitizers = {
    sanitizeHTML: (input) => {
        if (typeof input !== 'string')
            return input;
        return isomorphic_dompurify_1.default.sanitize(input, { ALLOWED_TAGS: [] });
    },
    sanitizeSQL: (input) => {
        if (typeof input !== 'string')
            return input;
        return input.replace(/['";\\]/g, '\\$&');
    },
    sanitizeXSS: (input) => {
        if (typeof input !== 'string')
            return input;
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    },
    trim: (input) => {
        if (typeof input !== 'string')
            return input;
        return input.trim();
    },
    toLowerCase: (input) => {
        if (typeof input !== 'string')
            return input;
        return input.toLowerCase();
    },
    sanitizeFilePath: (input) => {
        if (typeof input !== 'string')
            return input;
        return input
            .replace(/\.\./g, '')
            .replace(/[<>:"|?*]/g, '')
            .replace(/^\/+/, '')
            .trim();
    },
    sanitizeSearch: (input) => {
        if (typeof input !== 'string')
            return input;
        return input
            .replace(/[^\w\s-_.]/g, '')
            .trim()
            .substring(0, 100);
    }
};
function applySanitization(obj, options) {
    if (typeof obj === 'string') {
        let result = obj;
        if (options.trim) {
            result = exports.sanitizers.trim(result);
        }
        if (options.toLowerCase) {
            result = exports.sanitizers.toLowerCase(result);
        }
        if (options.html) {
            result = exports.sanitizers.sanitizeHTML(result);
        }
        if (options.sql) {
            result = exports.sanitizers.sanitizeSQL(result);
        }
        if (options.xss) {
            result = exports.sanitizers.sanitizeXSS(result);
        }
        return result;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => applySanitization(item, options));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = applySanitization(value, options);
        }
        return sanitized;
    }
    return obj;
}
function validate(options) {
    return async (req, res, next) => {
        try {
            const errors = [];
            if (options.body) {
                const { error, value } = options.body.validate(req.body, {
                    stripUnknown: options.stripUnknown ?? true,
                    allowUnknown: options.allowUnknown ?? false,
                    abortEarly: false
                });
                if (error) {
                    errors.push(...error.details.map(detail => `Body: ${detail.message}`));
                }
                else {
                    req.body = value;
                }
            }
            if (options.query) {
                const { error, value } = options.query.validate(req.query, {
                    stripUnknown: options.stripUnknown ?? true,
                    allowUnknown: options.allowUnknown ?? false,
                    abortEarly: false
                });
                if (error) {
                    errors.push(...error.details.map(detail => `Query: ${detail.message}`));
                }
                else {
                    req.query = value;
                }
            }
            if (options.params) {
                const { error, value } = options.params.validate(req.params, {
                    stripUnknown: options.stripUnknown ?? true,
                    allowUnknown: options.allowUnknown ?? false,
                    abortEarly: false
                });
                if (error) {
                    errors.push(...error.details.map(detail => `Params: ${detail.message}`));
                }
                else {
                    req.params = value;
                }
            }
            if (options.headers) {
                const { error, value } = options.headers.validate(req.headers, {
                    stripUnknown: options.stripUnknown ?? true,
                    allowUnknown: options.allowUnknown ?? true,
                    abortEarly: false
                });
                if (error) {
                    errors.push(...error.details.map(detail => `Headers: ${detail.message}`));
                }
            }
            if (options.sanitize) {
                const sanitizationOptions = {
                    html: true,
                    sql: true,
                    xss: true,
                    trim: true
                };
                req.body = applySanitization(req.body, sanitizationOptions);
                req.query = applySanitization(req.query, sanitizationOptions);
                req.params = applySanitization(req.params, sanitizationOptions);
            }
            if (errors.length > 0) {
                logger_1.logger.warn('Validation error', {
                    path: req.path,
                    method: req.method,
                    errors,
                    ip: req.ip
                });
                throw new errors_1.ValidationError('Validation failed', errors);
            }
            next();
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                next(error);
            }
            else {
                logger_1.logger.error('Validation middleware error:', error);
                next(new errors_1.ValidationError('Validation failed due to server error'));
            }
        }
    };
}
exports.validationSchemas = {
    login: {
        body: joi_1.default.object({
            email: exports.commonSchemas.email.required(),
            password: joi_1.default.string().required().max(128)
        })
    },
    register: {
        body: joi_1.default.object({
            email: exports.commonSchemas.email.required(),
            password: exports.commonSchemas.password.required(),
            displayName: exports.commonSchemas.shortText.optional(),
            referralCode: joi_1.default.string().max(50).optional()
        })
    },
    createJob: {
        body: joi_1.default.object({
            type: joi_1.default.string().valid('cleanup', 'documentation', 'analysis').required(),
            inputFileUrl: exports.commonSchemas.url.required(),
            originalFileName: exports.commonSchemas.filename.required(),
            fileSizeBytes: exports.commonSchemas.positiveInteger.required(),
            fileCount: exports.commonSchemas.nonNegativeInteger.optional(),
            contextProfileId: exports.commonSchemas.uuid.optional(),
            metadata: joi_1.default.object().optional()
        })
    },
    getJobs: {
        query: joi_1.default.object({
            ...exports.commonSchemas.pagination,
            status: exports.commonSchemas.jobStatus.optional(),
            type: joi_1.default.string().max(50).optional(),
            userId: exports.commonSchemas.uuid.optional()
        })
    },
    createPayment: {
        body: joi_1.default.object({
            jobId: exports.commonSchemas.uuid.required(),
            amount: exports.commonSchemas.positiveInteger.required(),
            currency: joi_1.default.string().valid('usd', 'eur', 'gbp').default('usd'),
            stripeCustomerId: joi_1.default.string().max(255).optional()
        })
    },
    uploadFile: {
        body: joi_1.default.object({
            filename: exports.commonSchemas.filename.required(),
            contentType: joi_1.default.string().max(100).required(),
            size: exports.commonSchemas.positiveInteger.required()
        })
    },
    createProfile: {
        body: joi_1.default.object({
            name: exports.commonSchemas.shortText.required(),
            description: exports.commonSchemas.mediumText.required(),
            language: joi_1.default.string().max(50).optional(),
            framework: joi_1.default.string().max(50).optional(),
            data: joi_1.default.object().required(),
            isPublic: joi_1.default.boolean().default(false)
        })
    },
    updateUser: {
        body: joi_1.default.object({
            displayName: exports.commonSchemas.shortText.optional(),
            email: exports.commonSchemas.email.optional(),
            metadata: joi_1.default.object().optional()
        })
    },
    createShowcase: {
        body: joi_1.default.object({
            title: exports.commonSchemas.shortText.required(),
            description: exports.commonSchemas.mediumText.required(),
            beforeCode: exports.commonSchemas.longText.required(),
            afterCode: exports.commonSchemas.longText.required(),
            improvements: joi_1.default.array().items(joi_1.default.string().max(500)).required(),
            technologies: joi_1.default.array().items(joi_1.default.string().max(50)).required(),
            isPublic: joi_1.default.boolean().default(true)
        })
    },
    createAgent: {
        body: joi_1.default.object({
            templateId: exports.commonSchemas.uuid.required(),
            customName: exports.commonSchemas.shortText.required(),
            specializations: joi_1.default.array().items(joi_1.default.string().max(100)).required(),
            isPublic: joi_1.default.boolean().default(false)
        })
    },
    uuidParam: {
        params: joi_1.default.object({
            id: exports.commonSchemas.uuid.required()
        })
    },
    slugParam: {
        params: joi_1.default.object({
            slug: joi_1.default.string().max(100).pattern(/^[a-z0-9-]+$/).required()
        })
    }
};
exports.validators = {
    validateUUID: validate({ params: exports.validationSchemas.uuidParam.params }),
    validateSlug: validate({ params: exports.validationSchemas.slugParam.params }),
    validatePagination: validate({ query: exports.commonSchemas.pagination }),
    validateLogin: validate({ ...exports.validationSchemas.login, sanitize: true }),
    validateRegister: validate({ ...exports.validationSchemas.register, sanitize: true }),
    validateCreateJob: validate({ ...exports.validationSchemas.createJob, sanitize: true }),
    validateGetJobs: validate({ ...exports.validationSchemas.getJobs }),
    validateCreatePayment: validate({ ...exports.validationSchemas.createPayment }),
    validateUploadFile: validate({ ...exports.validationSchemas.uploadFile, sanitize: true }),
    validateUpdateUser: validate({ ...exports.validationSchemas.updateUser, sanitize: true }),
    validateCreateShowcase: validate({ ...exports.validationSchemas.createShowcase, sanitize: true }),
    validateCreateAgent: validate({ ...exports.validationSchemas.createAgent, sanitize: true })
};
function securityValidation() {
    return (req, res, next) => {
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i,
            /eval\(/i,
            /union\s+select/i,
            /drop\s+table/i,
            /insert\s+into/i,
            /delete\s+from/i,
            /update\s+.*set/i,
            /\.\.\/\.\.\//,
            /\/etc\/passwd/,
            /\/proc\/self/
        ];
        const checkForSuspiciousContent = (obj, path = '') => {
            if (typeof obj === 'string') {
                return suspiciousPatterns.some(pattern => pattern.test(obj));
            }
            if (Array.isArray(obj)) {
                return obj.some((item, index) => checkForSuspiciousContent(item, `${path}[${index}]`));
            }
            if (obj && typeof obj === 'object') {
                return Object.entries(obj).some(([key, value]) => checkForSuspiciousContent(value, path ? `${path}.${key}` : key));
            }
            return false;
        };
        const requests = [
            { data: req.body, type: 'body' },
            { data: req.query, type: 'query' },
            { data: req.params, type: 'params' }
        ];
        for (const { data, type } of requests) {
            if (checkForSuspiciousContent(data)) {
                logger_1.logger.warn(`Suspicious content detected in ${type}`, {
                    path: req.path,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    data: JSON.stringify(data)
                });
                return res.status(400).json({
                    success: false,
                    error: 'Request contains potentially malicious content'
                });
            }
        }
        next();
    };
}
exports.default = validate;
//# sourceMappingURL=validation.middleware.js.map
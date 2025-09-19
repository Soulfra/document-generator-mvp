/**
 * JSON Sanitization Middleware
 * Prevents Unicode encoding errors that cause "no low surrogate in string" issues
 */

/**
 * Sanitizes a string by removing or replacing invalid Unicode characters
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
        // Remove unpaired surrogate characters
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
        .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
        // Remove other problematic characters
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Replace non-printable characters with spaces
        .replace(/[\uFFFE\uFFFF]/g, ' ')
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

/**
 * Recursively sanitizes an object, including all nested objects and arrays
 * @param {any} obj - The object to sanitize
 * @returns {any} - The sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = sanitizeString(key);
            sanitized[sanitizedKey] = sanitizeObject(value);
        }
        return sanitized;
    }
    
    return obj;
}

/**
 * Express middleware for sanitizing JSON request bodies
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function jsonSanitizerMiddleware(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        try {
            req.body = sanitizeObject(req.body);
        } catch (error) {
            console.error('JSON sanitization error:', error);
            return res.status(400).json({ 
                error: 'Invalid JSON format',
                message: 'Request contains invalid Unicode characters'
            });
        }
    }
    next();
}

/**
 * Sanitizes JSON before stringify to prevent encoding errors
 * @param {any} obj - Object to stringify
 * @returns {string} - Sanitized JSON string
 */
function safeJSONStringify(obj) {
    try {
        const sanitized = sanitizeObject(obj);
        return JSON.stringify(sanitized);
    } catch (error) {
        console.error('JSON stringify error:', error);
        // Fallback: return error object as JSON
        return JSON.stringify({
            error: 'JSON encoding failed',
            message: error.message
        });
    }
}

/**
 * Safely parses JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @returns {any} - Parsed object or error object
 */
function safeJSONParse(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        return sanitizeObject(parsed);
    } catch (error) {
        console.error('JSON parse error:', error);
        return {
            error: 'JSON parse failed',
            message: error.message,
            originalString: jsonString.substring(0, 100) + '...'
        };
    }
}

module.exports = {
    sanitizeString,
    sanitizeObject,
    jsonSanitizerMiddleware,
    safeJSONStringify,
    safeJSONParse
};
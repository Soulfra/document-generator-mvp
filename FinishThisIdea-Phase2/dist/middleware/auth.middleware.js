"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = authentication;
exports.generateToken = generateToken;
exports.apiKeyAuth = apiKeyAuth;
const errors_1 = require("../utils/errors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
function authentication(options = {}) {
    return async (req, res, next) => {
        try {
            // For MVP, we'll use simple session-based auth
            // In production, implement proper JWT or session management
            const token = extractToken(req);
            if (!token) {
                if (options.optional) {
                    return next();
                }
                throw new errors_1.AuthenticationError('No authentication token provided');
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                req.user = {
                    id: decoded.id,
                    role: decoded.role,
                };
                // Check role if specified
                if (options.role && req.user.role !== options.role) {
                    throw new errors_1.ForbiddenError('Insufficient permissions');
                }
                next();
            }
            catch (jwtError) {
                throw new errors_1.AuthenticationError('Invalid authentication token');
            }
        }
        catch (error) {
            next(error);
        }
    };
}
function extractToken(req) {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check cookie (for web app)
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    // Check query parameter (for download links)
    if (req.query.token && typeof req.query.token === 'string') {
        return req.query.token;
    }
    return null;
}
// Helper to generate tokens
function generateToken(userId, role) {
    return jsonwebtoken_1.default.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}
// For MVP: Simple API key authentication for certain endpoints
function apiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        next(new errors_1.AuthenticationError('Invalid API key'));
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map
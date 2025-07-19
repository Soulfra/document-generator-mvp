"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUser = exports.isAuthenticated = exports.requireAuth = void 0;
const errors_1 = require("../utils/errors");
const requireAuth = (req, res, next) => {
    if (!req.user) {
        throw new errors_1.AuthenticationError('Authentication required');
    }
    next();
};
exports.requireAuth = requireAuth;
const isAuthenticated = (req) => {
    return !!req.user;
};
exports.isAuthenticated = isAuthenticated;
const getAuthenticatedUser = (req) => {
    if (!req.user) {
        throw new errors_1.AuthenticationError('User not authenticated');
    }
    return req.user;
};
exports.getAuthenticatedUser = getAuthenticatedUser;
//# sourceMappingURL=require-auth.middleware.js.map
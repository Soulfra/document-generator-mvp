"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const database_1 = require("../../utils/database");
const logger_1 = require("../../utils/logger");
const env_validation_1 = require("../../utils/env-validation");
const achievement_service_1 = require("../../services/gamification/achievement.service");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
exports.authRouter = router;
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    displayName: zod_1.z.string().min(2, 'Display name must be at least 2 characters').optional(),
    referralCode: zod_1.z.string().optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format')
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
});
function generateToken(userId, email) {
    return jsonwebtoken_1.default.sign({ userId, email }, env_validation_1.env.JWT_SECRET, { expiresIn: '7d' });
}
function generateReferralCode(email) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const emailPrefix = email.substring(0, 3).toUpperCase();
    return `${emailPrefix}${randomSuffix}`;
}
router.post('/register', async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const { email, password, displayName, referralCode } = validatedData;
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: 'User with this email already exists'
                }
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        let userReferralCode = generateReferralCode(email);
        let codeExists = await database_1.prisma.user.findUnique({ where: { referralCode: userReferralCode } });
        while (codeExists) {
            userReferralCode = generateReferralCode(email);
            codeExists = await database_1.prisma.user.findUnique({ where: { referralCode: userReferralCode } });
        }
        let referrerId = null;
        if (referralCode) {
            const referrer = await database_1.prisma.user.findUnique({
                where: { referralCode }
            });
            if (referrer) {
                referrerId = referrer.id;
            }
        }
        const user = await database_1.prisma.user.create({
            data: {
                email,
                displayName: displayName || email.split('@')[0],
                name: displayName || email.split('@')[0],
                referralCode: userReferralCode,
                referredBy: referrerId,
                platformTokens: 1000,
                metadata: {
                    hashedPassword,
                    achievements: [],
                    xp: 0,
                    level: 1,
                    preferences: {
                        notifications: true,
                        theme: 'dark'
                    },
                    registrationDate: new Date().toISOString()
                }
            }
        });
        await database_1.prisma.tokenHolding.create({
            data: {
                userId: user.id,
                amount: 1000,
                acquisitionType: 'INITIAL',
                source: 'Welcome bonus for new users'
            }
        });
        if (referrerId) {
            await database_1.prisma.user.update({
                where: { id: referrerId },
                data: {
                    referralCount: { increment: 1 },
                    platformTokens: { increment: 200 },
                    referralEarnings: { increment: 5.0 }
                }
            });
            await database_1.prisma.tokenHolding.create({
                data: {
                    userId: referrerId,
                    amount: 200,
                    acquisitionType: 'REFERRAL',
                    source: `Referral bonus for inviting ${email}`
                }
            });
        }
        try {
            await achievement_service_1.achievementService.checkAchievements(user.id, '');
        }
        catch (achievementError) {
            logger_1.logger.warn('Failed to check achievements for new user', {
                userId: user.id,
                error: (0, errors_1.getErrorMessage)(achievementError)
            });
        }
        const token = generateToken(user.id, user.email);
        logger_1.logger.info('User registered successfully', {
            userId: user.id,
            email: user.email,
            referredBy: referrerId
        });
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    platformTokens: user.platformTokens,
                    referralCode: user.referralCode,
                    userNumber: user.userNumber
                },
                token,
                message: 'Registration successful! Welcome to FinishThisIdea!'
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
        }
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Registration failed', { error: (0, errors_1.getErrorMessage)(error), body: req.body });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'REGISTRATION_FAILED',
                message: appError.message
            }
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const { email, password } = validatedData;
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: {
                tokenHoldings: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!user || !user.metadata) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }
        const metadata = user.metadata;
        const hashedPassword = metadata.hashedPassword;
        if (!hashedPassword) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, hashedPassword);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
        });
        const token = generateToken(user.id, user.email);
        logger_1.logger.info('User logged in successfully', {
            userId: user.id,
            email: user.email
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    name: user.name,
                    platformTokens: user.platformTokens,
                    totalEarnings: user.totalEarnings,
                    referralCode: user.referralCode,
                    referralCount: user.referralCount,
                    userNumber: user.userNumber,
                    metadata: {
                        achievements: metadata.achievements || [],
                        xp: metadata.xp || 0,
                        level: metadata.level || 1,
                        preferences: metadata.preferences || {}
                    }
                },
                token,
                recentTokens: user.tokenHoldings.map(holding => ({
                    amount: holding.amount,
                    type: holding.acquisitionType,
                    source: holding.source,
                    date: holding.createdAt
                }))
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
        }
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Login failed', { error: (0, errors_1.getErrorMessage)(error), email: req.body.email });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'LOGIN_FAILED',
                message: appError.message
            }
        });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const validatedData = forgotPasswordSchema.parse(req.body);
        const { email } = validatedData;
        const user = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'password-reset' }, env_validation_1.env.JWT_SECRET, { expiresIn: '1h' });
        logger_1.logger.info('Password reset requested', {
            userId: user.id,
            email,
            resetToken
        });
        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
            resetToken: env_validation_1.env.NODE_ENV === 'development' ? resetToken : undefined
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
        }
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Forgot password failed', { error: (0, errors_1.getErrorMessage)(error) });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'FORGOT_PASSWORD_FAILED',
                message: appError.message
            }
        });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const validatedData = resetPasswordSchema.parse(req.body);
        const { token, password } = validatedData;
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_validation_1.env.JWT_SECRET);
        }
        catch (jwtError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired reset token'
                }
            });
        }
        if (decoded.type !== 'password-reset') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token type'
                }
            });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        const currentMetadata = user.metadata || {};
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: {
                metadata: {
                    ...currentMetadata,
                    hashedPassword,
                    passwordResetAt: new Date().toISOString()
                }
            }
        });
        logger_1.logger.info('Password reset successfully', {
            userId: user.id,
            email: user.email
        });
        res.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
        }
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Reset password failed', { error: (0, errors_1.getErrorMessage)(error) });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'RESET_PASSWORD_FAILED',
                message: appError.message
            }
        });
    }
});
router.post('/logout', (_req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'No authentication token provided'
                }
            });
        }
        const token = authHeader.substring(7);
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_validation_1.env.JWT_SECRET);
        }
        catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid authentication token'
                }
            });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                tokenHoldings: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                jobs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        status: true,
                        originalFileName: true,
                        createdAt: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }
        const metadata = user.metadata || {};
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    name: user.name,
                    platformTokens: user.platformTokens,
                    totalEarnings: user.totalEarnings,
                    referralCode: user.referralCode,
                    referralCount: user.referralCount,
                    userNumber: user.userNumber,
                    createdAt: user.createdAt,
                    lastActiveAt: user.lastActiveAt,
                    metadata: {
                        achievements: metadata.achievements || [],
                        xp: metadata.xp || 0,
                        level: metadata.level || 1,
                        preferences: metadata.preferences || {}
                    }
                },
                recentTokens: user.tokenHoldings.map(holding => ({
                    amount: holding.amount,
                    type: holding.acquisitionType,
                    source: holding.source,
                    date: holding.createdAt
                })),
                recentJobs: user.jobs
            }
        });
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Get profile failed', { error: (0, errors_1.getErrorMessage)(error) });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'GET_PROFILE_FAILED',
                message: appError.message
            }
        });
    }
});
//# sourceMappingURL=auth.route.js.map
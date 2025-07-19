import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { env } from '../../utils/env-validation';
import { achievementService } from '../../services/gamification/achievement.service';
import { handleError, getErrorMessage } from '../../utils/errors';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  referralCode: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Helper function to generate JWT
function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper function to generate referral code
function generateReferralCode(email: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const emailPrefix = email.substring(0, 3).toUpperCase();
  return `${emailPrefix}${randomSuffix}`;
}

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    const { email, password, displayName, referralCode } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code
    let userReferralCode = generateReferralCode(email);
    let codeExists = await prisma.user.findUnique({ where: { referralCode: userReferralCode } });
    
    // Ensure referral code is unique
    while (codeExists) {
      userReferralCode = generateReferralCode(email);
      codeExists = await prisma.user.findUnique({ where: { referralCode: userReferralCode } });
    }

    // Find referrer if referral code provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        displayName: displayName || email.split('@')[0],
        name: displayName || email.split('@')[0],
        referralCode: userReferralCode,
        referredBy: referrerId,
        platformTokens: 1000, // Initial welcome tokens
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

    // Create initial token holding record
    await prisma.tokenHolding.create({
      data: {
        userId: user.id,
        amount: 1000,
        acquisitionType: 'INITIAL',
        source: 'Welcome bonus for new users'
      }
    });

    // Update referrer if applicable
    if (referrerId) {
      await prisma.user.update({
        where: { id: referrerId },
        data: {
          referralCount: { increment: 1 },
          platformTokens: { increment: 200 }, // Referral bonus
          referralEarnings: { increment: 5.0 } // $5 referral bonus
        }
      });

      // Create referral token holding
      await prisma.tokenHolding.create({
        data: {
          userId: referrerId,
          amount: 200,
          acquisitionType: 'REFERRAL',
          source: `Referral bonus for inviting ${email}`
        }
      });
    }

    // Check for achievements (new user achievements)
    try {
      // Check for new user achievements
      // Pass empty string for jobId as this is user registration, not a job completion
      await achievementService.checkAchievements(user.id, '');
    } catch (achievementError) {
      logger.warn('Failed to check achievements for new user', {
        userId: user.id,
        error: getErrorMessage(achievementError)
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email!);

    logger.info('User registered successfully', {
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

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    const appError = handleError(error);
    logger.error('Registration failed', { error: getErrorMessage(error), body: req.body });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'REGISTRATION_FAILED',
        message: appError.message
      }
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const user = await prisma.user.findUnique({
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

    // Check password
    const metadata = user.metadata as any;
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

    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Update last active time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email!);

    logger.info('User logged in successfully', {
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

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    const appError = handleError(error);
    logger.error('Login failed', { error: getErrorMessage(error), email: req.body.email });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'LOGIN_FAILED',
        message: appError.message
      }
    });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real application, you would send an email here
    // For now, we'll just log it
    logger.info('Password reset requested', {
      userId: user.id,
      email,
      resetToken // In production, don't log the actual token
    });

    // TODO: Send email with reset link
    // await emailService.sendPasswordReset(email, resetToken);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // NOTE: Remove this in production - only for development
      resetToken: env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    const appError = handleError(error);
    logger.error('Forgot password failed', { error: getErrorMessage(error) });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'FORGOT_PASSWORD_FAILED',
        message: appError.message
      }
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { token, password } = validatedData;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as any;
    } catch (jwtError) {
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

    // Find user
    const user = await prisma.user.findUnique({
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password in user metadata
    const currentMetadata = (user.metadata as any) || {};
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...currentMetadata,
          hashedPassword,
          passwordResetAt: new Date().toISOString()
        }
      }
    });

    logger.info('Password reset successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    const appError = handleError(error);
    logger.error('Reset password failed', { error: getErrorMessage(error) });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'RESET_PASSWORD_FAILED',
        message: appError.message
      }
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Public
 */
router.post('/logout', (_req, res) => {
  // Since we're using stateless JWT, logout is handled client-side
  // In a more secure implementation, you might maintain a blacklist of tokens
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
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
      decoded = jwt.verify(token, env.JWT_SECRET) as any;
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      });
    }

    const user = await prisma.user.findUnique({
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

    const metadata = (user.metadata as any) || {};

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

  } catch (error) {
    const appError = handleError(error);
    logger.error('Get profile failed', { error: getErrorMessage(error) });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'GET_PROFILE_FAILED',
        message: appError.message
      }
    });
  }
});

export { router as authRouter };
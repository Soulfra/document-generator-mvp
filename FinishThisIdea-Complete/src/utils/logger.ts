import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logLevel = process.env.LOG_LEVEL || 'info';

// Enhanced custom log format with more structured data
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Safely stringify metadata, handling circular references
    if (Object.keys(metadata).length > 0) {
      try {
        const safeMetadata = JSON.stringify(metadata, (key, value) => {
          // Handle circular references
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        });
        msg += ` ${safeMetadata}`;
      } catch (error) {
        msg += ` [Metadata serialization error: ${error.message}]`;
      }
    }
    return msg;
  })
);

// Set for tracking circular references
const seen = new WeakSet();

// Console format for development with enhanced readability
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, userId, requestId, ...meta }) => {
    let logLine = `${timestamp} [${level}]`;
    
    // Add service context
    if (service) logLine += ` [${service}]`;
    
    // Add user context
    if (userId) logLine += ` [user:${userId}]`;
    
    // Add request context
    if (requestId) logLine += ` [req:${requestId.slice(0, 8)}]`;
    
    logLine += `: ${message}`;
    
    // Format metadata nicely for console
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      const formattedMeta = metaKeys.map(key => {
        const value = meta[key];
        if (typeof value === 'object') {
          return `${key}=${JSON.stringify(value)}`;
        }
        return `${key}=${value}`;
      }).join(' ');
      logLine += ` ${formattedMeta}`;
    }
    
    return logLine;
  })
);

// Create enhanced logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { 
    service: 'finishthisidea-platform',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport with different formats for dev/prod
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? 
        winston.format.combine(winston.format.colorize(), winston.format.simple()) : 
        consoleFormat,
    }),
  ],
  // Enhanced exception and rejection handling
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 3
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 3
    })
  ]
});

// Add file transports for all environments (not just production)
logger.add(
  new winston.transports.File({
    filename: path.join(logDir, 'app.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
);

logger.add(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
);

// Add security events log
logger.add(
  new winston.transports.File({
    filename: path.join(logDir, 'security.log'),
    level: 'warn', // Security events are typically warnings or errors
    maxsize: 10485760, // 10MB
    maxFiles: 10, // Keep more security logs
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // Only log security-related events to this file
        if (meta.security || message.toLowerCase().includes('security') || 
            message.toLowerCase().includes('auth') || message.toLowerCase().includes('attack')) {
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(meta)}`;
        }
        return null;
      })
    )
  })
);

// Stream for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.info(message.trim(), { type: 'http' });
  },
};

// Enhanced utility functions for structured logging
export const logError = (message: string, error: Error | any, meta?: Record<string, any>) => {
  const errorDetails = {
    error: error?.message || String(error),
    stack: error?.stack,
    name: error?.name,
    code: error?.code,
    ...meta
  };
  logger.error(message, errorDetails);
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

// Security-specific logging functions
export const logSecurity = (event: string, meta?: Record<string, any>) => {
  logger.warn(event, { security: true, ...meta });
};

export const logAuth = (event: string, userId?: string, meta?: Record<string, any>) => {
  logger.info(event, { type: 'auth', userId, ...meta });
};

export const logPayment = (event: string, userId?: string, amount?: number, meta?: Record<string, any>) => {
  logger.info(event, { type: 'payment', userId, amount, ...meta });
};

// Request-specific logging with context
export const logRequest = (method: string, path: string, statusCode: number, responseTime: number, userId?: string, meta?: Record<string, any>) => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, 'HTTP Request', {
    type: 'request',
    method,
    path,
    statusCode,
    responseTime,
    userId,
    ...meta
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: Record<string, any>) => {
  logger.info('Performance metric', {
    type: 'performance',
    operation,
    duration,
    ...meta
  });
};

// Business metrics logging
export const logMetric = (metric: string, value: number, unit?: string, meta?: Record<string, any>) => {
  logger.info('Business metric', {
    type: 'metric',
    metric,
    value,
    unit,
    ...meta
  });
};

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise: promise.toString(), reason });
  // Log but don't exit for unhandled rejections in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Graceful shutdown logging
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
});

// Export logger as default for easy importing
export default logger;
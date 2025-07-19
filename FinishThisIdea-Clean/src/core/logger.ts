/**
 * Centralized logging system for FinishThisIdea
 * Provides structured logging with different levels and transports
 */

import winston from 'winston';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';

// Create log directories
const logDirs = {
  root: path.join(process.cwd(), 'logs'),
  services: path.join(process.cwd(), 'logs', 'services'),
  agents: path.join(process.cwd(), 'logs', 'agents'),
  system: path.join(process.cwd(), 'logs', 'system'),
  dashboard: path.join(process.cwd(), 'logs', 'dashboard'),
};

// Ensure all log directories exist
Object.values(logDirs).forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'gray',
};

winston.addColors(colors);

// Create custom format with metadata
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    ({ timestamp, level, message, label, ...metadata }) => {
      let msg = `${timestamp} [${label || 'app'}] ${level}: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    }
  )
);

// Create base transports
const createTransports = (category: string = 'system', serviceName?: string) => {
  const transports: winston.transport[] = [
    // Console transport (only in development)
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: consoleFormat,
      })
    ] : []),
    
    // Category-specific log file
    new winston.transports.File({
      filename: path.join(logDirs[category as keyof typeof logDirs] || logDirs.root, 
        serviceName ? `${serviceName}.log` : 'app.log'),
      format: customFormat,
    }),
    
    // Error log file (all errors go here)
    new winston.transports.File({
      filename: path.join(logDirs.system, 'error.log'),
      level: 'error',
      format: customFormat,
    }),
    
    // Combined log file (everything)
    new winston.transports.File({
      filename: path.join(logDirs.system, 'combined.log'),
      format: customFormat,
    }),
  ];

  // Add daily rotate transport for production
  if (process.env.NODE_ENV === 'production') {
    const DailyRotateFile = require('winston-daily-rotate-file');
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDirs[category as keyof typeof logDirs] || logDirs.root,
          serviceName ? `${serviceName}-%DATE%.log` : 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: customFormat,
      })
    );
  }

  return transports;
};

// Create main logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format: customFormat,
  defaultMeta: { service: 'main' },
  transports: createTransports('system'),
});

// Logger factory for different categories
export const createLogger = (options: {
  service?: string;
  category?: 'services' | 'agents' | 'system' | 'dashboard';
  defaultMeta?: Record<string, any>;
}) => {
  const { service = 'unknown', category = 'system', defaultMeta = {} } = options;
  
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    levels,
    format: customFormat,
    defaultMeta: { service, ...defaultMeta },
    transports: createTransports(category, service),
  });
};

// Service-specific loggers
export const apiLogger = createLogger({ service: 'api', category: 'services' });
export const workerLogger = createLogger({ service: 'worker', category: 'services' });
export const dbLogger = createLogger({ service: 'database', category: 'services' });
export const paymentLogger = createLogger({ service: 'payment', category: 'services' });
export const queueLogger = createLogger({ service: 'queue', category: 'services' });
export const mcpLogger = createLogger({ service: 'mcp', category: 'services' });

// Agent-specific logger factory
export const createAgentLogger = (agentId: string) => {
  return createLogger({
    service: `agent-${agentId}`,
    category: 'agents',
    defaultMeta: { agentId }
  });
};

// Dashboard logger
export const dashboardLogger = createLogger({ 
  service: 'dashboard', 
  category: 'dashboard' 
});

// Memory/state change logger
export const memoryLogger = createLogger({
  service: 'memory',
  category: 'system',
  defaultMeta: { component: 'memory-tracker' }
});

// Worktree operations logger
export const worktreeLogger = createLogger({
  service: 'worktree',
  category: 'system',
  defaultMeta: { component: 'git-operations' }
});

// Performance logger
export const perfLogger = createLogger({
  service: 'performance',
  category: 'system',
  defaultMeta: { component: 'metrics' }
});

// Utility functions for structured logging
export const logError = (logger: winston.Logger, error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
};

export const logRequest = (logger: winston.Logger, req: any, res: any, duration: number) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

export const logDatabaseQuery = (query: string, duration: number, rows?: number) => {
  dbLogger.debug('Database Query', {
    query: query.substring(0, 200), // Truncate long queries
    duration: `${duration}ms`,
    rows,
  });
};

export const logWorktreeOperation = (operation: string, details: Record<string, any>) => {
  worktreeLogger.info(`Worktree ${operation}`, details);
};

export const logMemoryUpdate = (update: Record<string, any>) => {
  memoryLogger.info('Memory state updated', update);
};

// Export log levels for external use
export { levels as logLevels };
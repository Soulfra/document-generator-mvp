/**
 * DATABASE CONFIGURATION
 * 
 * Prisma client configuration for database operations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Global Prisma instance
let prisma: PrismaClient;

// Prisma client configuration
const prismaConfig = {
  // Database logging
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ] as const,
  
  // Error handling
  errorFormat: 'pretty' as const,
};

// Initialize Prisma client
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaConfig);
} else {
  // Use global variable in development to prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaConfig);
  }
  prisma = global.prisma;
}

// Set up logging for database events
prisma.$on('query', (e) => {
  logger.debug('Database Query', {
    query: e.query,
    params: e.params,
    duration: e.duration,
    target: e.target
  });
});

prisma.$on('error', (e) => {
  logger.error('Database Error', {
    message: e.message,
    target: e.target
  });
});

prisma.$on('info', (e) => {
  logger.info('Database Info', {
    message: e.message,
    target: e.target
  });
});

prisma.$on('warn', (e) => {
  logger.warn('Database Warning', {
    message: e.message,
    target: e.target
  });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export prisma client
export { prisma };

// Type definitions for global
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection check failed', { error });
    return false;
  }
}

/**
 * Database transaction wrapper with error handling
 */
export async function withTransaction<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      return await operation(tx);
    });
  } catch (error) {
    logger.error('Database transaction failed', { error });
    throw error;
  }
}

/**
 * Database seeding utilities
 */
export async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // Add any seeding logic here
    
    logger.info('Database seeding completed');
  } catch (error) {
    logger.error('Database seeding failed', { error });
    throw error;
  }
}

/**
 * Database cleanup for testing
 */
export async function cleanupTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database cleanup only allowed in test environment');
  }
  
  try {
    // Clean up in reverse order of dependencies
    await prisma.transaction.deleteMany({});
    await prisma.promptBundle.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    
    logger.info('Test database cleanup completed');
  } catch (error) {
    logger.error('Test database cleanup failed', { error });
    throw error;
  }
}
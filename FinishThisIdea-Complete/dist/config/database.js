"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.withTransaction = withTransaction;
exports.seedDatabase = seedDatabase;
exports.cleanupTestDatabase = cleanupTestDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
let prisma;
const prismaConfig = {
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' }
    ],
    errorFormat: 'pretty',
};
if (process.env.NODE_ENV === 'production') {
    exports.prisma = prisma = new client_1.PrismaClient(prismaConfig);
}
else {
    if (!global.prisma) {
        global.prisma = new client_1.PrismaClient(prismaConfig);
    }
    exports.prisma = prisma = global.prisma;
}
prisma.$on('query', (e) => {
    logger_1.logger.debug('Database Query', {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target
    });
});
prisma.$on('error', (e) => {
    logger_1.logger.error('Database Error', {
        message: e.message,
        target: e.target
    });
});
prisma.$on('info', (e) => {
    logger_1.logger.info('Database Info', {
        message: e.message,
        target: e.target
    });
});
prisma.$on('warn', (e) => {
    logger_1.logger.warn('Database Warning', {
        message: e.message,
        target: e.target
    });
});
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection check failed', { error });
        return false;
    }
}
async function withTransaction(operation) {
    try {
        return await prisma.$transaction(async (tx) => {
            return await operation(tx);
        });
    }
    catch (error) {
        logger_1.logger.error('Database transaction failed', { error });
        throw error;
    }
}
async function seedDatabase() {
    try {
        logger_1.logger.info('Starting database seeding...');
        logger_1.logger.info('Database seeding completed');
    }
    catch (error) {
        logger_1.logger.error('Database seeding failed', { error });
        throw error;
    }
}
async function cleanupTestDatabase() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Database cleanup only allowed in test environment');
    }
    try {
        await prisma.transaction.deleteMany({});
        await prisma.promptBundle.deleteMany({});
        await prisma.project.deleteMany({});
        await prisma.user.deleteMany({});
        logger_1.logger.info('Test database cleanup completed');
    }
    catch (error) {
        logger_1.logger.error('Test database cleanup failed', { error });
        throw error;
    }
}
//# sourceMappingURL=database.js.map
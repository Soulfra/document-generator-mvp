"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma error:', e);
});
exports.prisma.$on('warn', (e) => {
    logger_1.logger.warn('Prisma warning:', e);
});
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
    logger_1.logger.info('Database disconnected');
}
//# sourceMappingURL=database.js.map
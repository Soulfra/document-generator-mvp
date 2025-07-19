import { PrismaClient } from '@prisma/client';
declare let prisma: PrismaClient;
export { prisma };
declare global {
    var prisma: PrismaClient | undefined;
}
export declare function checkDatabaseConnection(): Promise<boolean>;
export declare function withTransaction<T>(operation: (prisma: PrismaClient) => Promise<T>): Promise<T>;
export declare function seedDatabase(): Promise<void>;
export declare function cleanupTestDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map
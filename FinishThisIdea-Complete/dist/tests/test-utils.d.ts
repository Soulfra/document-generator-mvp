import request from 'supertest';
import { Express } from 'express';
import { testUtils } from './setup';
export interface TestUser {
    id: string;
    email: string;
    username: string;
    platformTokens: number;
    trustTier: string;
    token?: string;
}
export interface TestProject {
    id: string;
    title: string;
    description: string;
    userId: string;
}
export declare class APITestHelper {
    private app;
    private currentUser?;
    constructor(app: Express);
    loginAs(userData?: Partial<TestUser>): Promise<TestUser>;
    get(path: string): request.Test;
    post(path: string, data?: any): request.Test;
    put(path: string, data?: any): request.Test;
    delete(path: string): request.Test;
    upload(path: string, fieldName: string, filePath: string): request.Test;
    logout(): void;
    getCurrentUser(): TestUser | undefined;
}
export declare class DatabaseTestHelper {
    createTestUser(overrides?: Partial<TestUser>): Promise<TestUser>;
    createTestProject(userId: string, overrides?: Partial<TestProject>): Promise<TestProject>;
    cleanupTestData(): Promise<void>;
}
export declare class MockDataFactory {
    static createUser(overrides?: Partial<TestUser>): TestUser;
    static createProject(userId: string, overrides?: Partial<TestProject>): TestProject;
    static createValidProjectData(): {
        title: string;
        description: string;
        techStack: string[];
        requirements: string[];
    };
    static createInvalidProjectData(): {
        title: string;
        description: string;
        techStack: string;
    };
    static createValidUserData(): {
        username: string;
        email: string;
        password: string;
    };
    static createInvalidUserData(): {
        username: string;
        email: string;
        password: string;
    };
}
export declare class AssertionHelpers {
    static expectSuccessResponse(response: request.Response, expectedData?: any): void;
    static expectErrorResponse(response: request.Response, expectedStatus: number, expectedMessage?: string): void;
    static expectValidationError(response: request.Response, field?: string): void;
    static expectAuthenticationError(response: request.Response): void;
    static expectAuthorizationError(response: request.Response): void;
    static expectNotFoundError(response: request.Response): void;
    static expectRateLimitError(response: request.Response): void;
}
export declare class PerformanceTestHelper {
    static measureResponseTime<T>(operation: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
    static runConcurrentRequests(requests: (() => Promise<any>)[], concurrency?: number): Promise<any[]>;
}
export declare class FileUploadTestHelper {
    static createMockFile(name: string, content: string, mimeType?: string): Buffer<ArrayBuffer>;
    static createMockZipFile(): Buffer<ArrayBuffer>;
    static createMockImageFile(): Buffer<ArrayBuffer>;
}
export { testUtils, APITestHelper, DatabaseTestHelper, MockDataFactory, AssertionHelpers, PerformanceTestHelper, FileUploadTestHelper };
//# sourceMappingURL=test-utils.d.ts.map
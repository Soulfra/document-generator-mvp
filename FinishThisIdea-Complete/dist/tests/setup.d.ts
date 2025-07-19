export declare const testUtils: {
    createMockUser: () => {
        id: string;
        email: string;
        username: string;
        platformTokens: number;
        trustTier: string;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockProject: () => {
        id: string;
        title: string;
        description: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockRequest: (overrides?: {}) => {
        body: {};
        params: {};
        query: {};
        headers: {};
        user: {
            id: string;
            email: string;
            username: string;
            platformTokens: number;
            trustTier: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    createMockResponse: () => any;
    createMockNext: () => jest.Mock<any, any, any>;
    cleanupDatabase(): Promise<void>;
    cleanupRedis(): Promise<void>;
};
//# sourceMappingURL=setup.d.ts.map
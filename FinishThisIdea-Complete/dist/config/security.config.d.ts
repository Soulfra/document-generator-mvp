export declare const securityFeatures: {
    mfaEnabled: boolean;
    ssoEnabled: boolean;
    apiKeyAuthEnabled: boolean;
    sessionAuthEnabled: boolean;
    csrfProtection: boolean;
    requestSigning: boolean;
    webhookValidation: boolean;
    inputSanitization: boolean;
    outputEncoding: boolean;
    auditLogging: boolean;
    complianceMode: boolean;
    gdprEnabled: boolean;
    ccpaEnabled: boolean;
    anomalyDetection: boolean;
    honeypotEndpoints: boolean;
    shadowBanning: boolean;
    debugMode: boolean;
    verboseErrors: boolean;
    swaggerEnabled: boolean;
};
export declare const securityPolicies: {
    password: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
        saltRounds: number;
    };
    session: {
        timeout: number;
        maxAge: number;
        cookieName: string;
        secure: boolean;
        sameSite: string;
    };
    apiKey: {
        prefix: string;
        testPrefix: string;
        rotationDays: number;
        autoRotate: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    fileUpload: {
        maxSize: number;
        allowedTypes: string[];
        scanForViruses: boolean;
        quarantineEnabled: boolean;
    };
};
export declare const securityHeaders: {
    hsts: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    contentSecurityPolicy: {
        directives: {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            fontSrc: string[];
            objectSrc: string[];
            mediaSrc: string[];
            frameSrc: string[];
            reportUri: string | undefined;
        };
    };
    cors: {
        origin: string[];
        credentials: boolean;
        optionsSuccessStatus: number;
    };
    referrerPolicy: string;
    xContentTypeOptions: string;
    xFrameOptions: string;
    xXssProtection: string;
    permissionsPolicy: {
        features: {
            camera: string[];
            microphone: string[];
            geolocation: string[];
            payment: string[];
        };
    };
};
export declare const secretsConfig: {
    masterSecret: string;
    encryptionKey: string;
    sessionSecret: string;
    jwtSecret: string;
    jwtRefreshSecret: string;
    webhooks: {
        stripe: string | undefined;
        github: string | undefined;
    };
};
export declare const security: {
    config: {
        NODE_ENV: "development" | "production" | "test";
        JWT_SECRET: string;
        RATE_LIMIT_WINDOW_MS: number;
        RATE_LIMIT_MAX_REQUESTS: number;
        MAX_FILE_SIZE: number;
        ALLOWED_FILE_TYPES: string[];
        MASTER_SECRET: string;
        SESSION_SECRET: string;
        SESSION_COOKIE_NAME: string;
        SESSION_TIMEOUT: number;
        SESSION_MAX_AGE: number;
        CSRF_TOKEN_LENGTH: number;
        CSRF_TOKEN_TTL: number;
        API_KEY_PREFIX: string;
        API_KEY_TEST_PREFIX: string;
        API_KEY_ROTATION_DAYS: number;
        API_REQUEST_SIGNATURE_MAX_AGE: number;
        RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: boolean;
        RATE_LIMIT_SKIP_FAILED_REQUESTS: boolean;
        PASSWORD_MIN_LENGTH: number;
        PASSWORD_REQUIRE_UPPERCASE: boolean;
        PASSWORD_REQUIRE_LOWERCASE: boolean;
        PASSWORD_REQUIRE_NUMBERS: boolean;
        PASSWORD_REQUIRE_SYMBOLS: boolean;
        PASSWORD_SALT_ROUNDS: number;
        JWT_EXPIRES_IN: string;
        JWT_REFRESH_EXPIRES_IN: string;
        WEBHOOK_SIGNATURE_MAX_AGE: number;
        HSTS_MAX_AGE: number;
        ALLOWED_ORIGINS: string[];
        SECRETS_STORAGE_BACKEND: "redis" | "file" | "memory";
        SECRETS_ENCRYPTION_ENABLED: boolean;
        SECRETS_ROTATION_CHECK_INTERVAL: number;
        SECRETS_DEFAULT_TTL: number;
        MAX_REQUEST_SIZE: string;
        AUDIT_LOG_ENABLED: boolean;
        AUDIT_LOG_RETENTION_DAYS: number;
        SECURITY_MONITORING_ENABLED: boolean;
        SECURE_COOKIES: boolean;
        TRUST_PROXY: boolean;
        ENCRYPTION_KEY?: string | undefined;
        JWT_REFRESH_SECRET?: string | undefined;
        WEBHOOK_SECRET_STRIPE?: string | undefined;
        WEBHOOK_SECRET_GITHUB?: string | undefined;
        CSP_REPORT_URI?: string | undefined;
    };
    features: {
        mfaEnabled: boolean;
        ssoEnabled: boolean;
        apiKeyAuthEnabled: boolean;
        sessionAuthEnabled: boolean;
        csrfProtection: boolean;
        requestSigning: boolean;
        webhookValidation: boolean;
        inputSanitization: boolean;
        outputEncoding: boolean;
        auditLogging: boolean;
        complianceMode: boolean;
        gdprEnabled: boolean;
        ccpaEnabled: boolean;
        anomalyDetection: boolean;
        honeypotEndpoints: boolean;
        shadowBanning: boolean;
        debugMode: boolean;
        verboseErrors: boolean;
        swaggerEnabled: boolean;
    };
    policies: {
        password: {
            minLength: number;
            requireUppercase: boolean;
            requireLowercase: boolean;
            requireNumbers: boolean;
            requireSymbols: boolean;
            saltRounds: number;
        };
        session: {
            timeout: number;
            maxAge: number;
            cookieName: string;
            secure: boolean;
            sameSite: string;
        };
        apiKey: {
            prefix: string;
            testPrefix: string;
            rotationDays: number;
            autoRotate: boolean;
        };
        rateLimit: {
            windowMs: number;
            max: number;
            skipSuccessfulRequests: boolean;
            skipFailedRequests: boolean;
        };
        fileUpload: {
            maxSize: number;
            allowedTypes: string[];
            scanForViruses: boolean;
            quarantineEnabled: boolean;
        };
    };
    headers: {
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                scriptSrc: string[];
                styleSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
                fontSrc: string[];
                objectSrc: string[];
                mediaSrc: string[];
                frameSrc: string[];
                reportUri: string | undefined;
            };
        };
        cors: {
            origin: string[];
            credentials: boolean;
            optionsSuccessStatus: number;
        };
        referrerPolicy: string;
        xContentTypeOptions: string;
        xFrameOptions: string;
        xXssProtection: string;
        permissionsPolicy: {
            features: {
                camera: string[];
                microphone: string[];
                geolocation: string[];
                payment: string[];
            };
        };
    };
    secrets: {
        masterSecret: string;
        encryptionKey: string;
        sessionSecret: string;
        jwtSecret: string;
        jwtRefreshSecret: string;
        webhooks: {
            stripe: string | undefined;
            github: string | undefined;
        };
    };
};
export declare function validateSecurityConfig(): void;
export default security;
//# sourceMappingURL=security.config.d.ts.map
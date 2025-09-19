/**
 * Jest Configuration for Document Generator
 * Comprehensive testing from bit-level to system integration
 */

module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/*.test.js',
        '**/*.spec.js'
    ],
    
    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/',
        '/.rapid-backup-*/',
        '/FinishThisIdea-archive/',
        '/FinishThisIdea-backup-*/',
        '/backups/'
    ],
    
    // Coverage configuration
    collectCoverage: false, // Enable with --coverage flag
    collectCoverageFrom: [
        '**/*.js',
        '!**/__tests__/**',
        '!**/*.test.js',
        '!**/*.spec.js',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/build/**',
        '!jest.config.js',
        '!**/test-*.js' // Exclude standalone test files
    ],
    
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 75,
            statements: 75
        }
    },
    
    // Coverage directory
    coverageDirectory: 'coverage',
    
    // Coverage reporters
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov'
    ],
    
    // Module directories
    moduleDirectories: [
        'node_modules',
        '.'
    ],
    
    // Setup files
    setupFilesAfterEnv: [
        '<rootDir>/__tests__/setup.js'
    ],
    
    // Test timeout (30 seconds for integration tests)
    testTimeout: 30000,
    
    // Verbose output
    verbose: true,
    
    // Transform ignore patterns (skip node_modules except specific packages)
    transformIgnorePatterns: [
        'node_modules/(?!(@babel|uuid|some-es6-package)/)'
    ],
    
    // Module name mapper for aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@services/(.*)$': '<rootDir>/services/$1',
        '^@tests/(.*)$': '<rootDir>/__tests__/$1'
    },
    
    // Global setup/teardown
    globalSetup: '<rootDir>/__tests__/global-setup.js',
    globalTeardown: '<rootDir>/__tests__/global-teardown.js',
    
    // Test sequencer (for ordered tests if needed)
    testSequencer: '<rootDir>/__tests__/test-sequencer.js',
    
    // Bail on first test failure (useful for CI)
    bail: false,
    
    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    
    // Reporter configuration
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'test-results',
            outputName: 'junit.xml',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}',
            ancestorSeparator: ' › ',
            usePathForSuiteName: 'true'
        }],
        ['<rootDir>/__tests__/reporters/research-lab-reporter.js', {
            outputDir: 'research-lab-reports',
            apiEndpoint: process.env.RESEARCH_LAB_API
        }]
    ],
    
    // Watch plugins
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
    ],
    
    // Projects for different test types
    projects: [
        {
            displayName: 'unit',
            testMatch: ['<rootDir>/__tests__/unit/**/*.test.js']
        },
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/__tests__/integration/**/*.test.js']
        },
        {
            displayName: 'e2e',
            testMatch: ['<rootDir>/__tests__/e2e/**/*.test.js']
        },
        {
            displayName: 'stress',
            testMatch: ['<rootDir>/__tests__/stress/**/*.test.js']
        }
    ]
};
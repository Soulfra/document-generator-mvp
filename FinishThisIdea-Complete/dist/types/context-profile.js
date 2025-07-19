"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextProfileSchema = void 0;
const zod_1 = require("zod");
exports.contextProfileSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500),
    language: zod_1.z.string().optional(),
    framework: zod_1.z.string().optional(),
    version: zod_1.z.string().optional(),
    isDefault: zod_1.z.boolean().optional(),
    userId: zod_1.z.string().uuid().optional(),
    style: zod_1.z.object({
        indentation: zod_1.z.enum(['spaces', 'tabs']),
        indentSize: zod_1.z.number().min(1).max(8),
        lineEnding: zod_1.z.enum(['lf', 'crlf', 'auto']),
        quoteStyle: zod_1.z.enum(['single', 'double', 'auto']),
        semicolons: zod_1.z.boolean(),
        trailingComma: zod_1.z.enum(['none', 'es5', 'all']),
        bracketSpacing: zod_1.z.boolean(),
        arrowParens: zod_1.z.enum(['always', 'avoid']),
        maxLineLength: zod_1.z.number().min(40).max(200).optional(),
    }),
    rules: zod_1.z.object({
        naming: zod_1.z.object({
            functions: zod_1.z.enum(['camelCase', 'snake_case', 'PascalCase', 'kebab-case']),
            variables: zod_1.z.enum(['camelCase', 'snake_case', 'PascalCase', 'CONSTANT_CASE']),
            constants: zod_1.z.enum(['UPPER_SNAKE', 'camelCase', 'PascalCase']),
            classes: zod_1.z.enum(['PascalCase', 'snake_case']),
            interfaces: zod_1.z.enum(['PascalCase', 'IPascalCase']).optional(),
            files: zod_1.z.enum(['camelCase', 'snake_case', 'kebab-case', 'PascalCase']),
        }),
        imports: zod_1.z.object({
            orderBy: zod_1.z.enum(['alphabetical', 'grouped', 'custom']),
            groups: zod_1.z.array(zod_1.z.string()).optional(),
            removeUnused: zod_1.z.boolean(),
            addMissing: zod_1.z.boolean(),
            preferRelative: zod_1.z.boolean(),
        }),
        comments: zod_1.z.object({
            style: zod_1.z.enum(['line', 'block', 'jsdoc']),
            requireForPublicApi: zod_1.z.boolean(),
            removeRedundant: zod_1.z.boolean(),
            preserveTodos: zod_1.z.boolean(),
        }),
    }),
    aiContext: zod_1.z.object({
        systemPrompt: zod_1.z.string().optional(),
        additionalContext: zod_1.z.string().optional(),
        tone: zod_1.z.enum(['professional', 'casual', 'educational', 'concise']),
        priorities: zod_1.z.array(zod_1.z.string()),
        avoidPatterns: zod_1.z.array(zod_1.z.string()).optional(),
        preferredPatterns: zod_1.z.array(zod_1.z.string()).optional(),
        exampleCode: zod_1.z.string().optional(),
        focusAreas: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    frameworkConfig: zod_1.z.object({
        react: zod_1.z.object({
            componentStyle: zod_1.z.enum(['functional', 'class', 'mixed']),
            hooksRules: zod_1.z.boolean(),
            propTypesOrTypeScript: zod_1.z.enum(['prop-types', 'typescript', 'both']),
        }).optional(),
        vue: zod_1.z.object({
            apiStyle: zod_1.z.enum(['options', 'composition']),
            scriptSetup: zod_1.z.boolean(),
        }).optional(),
        angular: zod_1.z.object({
            standalone: zod_1.z.boolean(),
            strictTemplates: zod_1.z.boolean(),
        }).optional(),
        node: zod_1.z.object({
            moduleSystem: zod_1.z.enum(['commonjs', 'esm']),
            asyncStyle: zod_1.z.enum(['callbacks', 'promises', 'async-await']),
        }).optional(),
        python: zod_1.z.object({
            version: zod_1.z.enum(['2.7', '3.x']),
            typeHints: zod_1.z.boolean(),
            docstringStyle: zod_1.z.enum(['google', 'numpy', 'sphinx']),
        }).optional(),
    }).optional(),
    quality: zod_1.z.object({
        maxComplexity: zod_1.z.number().optional(),
        maxFileLength: zod_1.z.number().optional(),
        maxFunctionLength: zod_1.z.number().optional(),
        requireTests: zod_1.z.boolean().optional(),
        coverageThreshold: zod_1.z.number().min(0).max(100).optional(),
    }).optional(),
});
//# sourceMappingURL=context-profile.js.map
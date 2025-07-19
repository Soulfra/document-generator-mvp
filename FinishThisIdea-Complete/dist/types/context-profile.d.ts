export interface ContextProfile {
    id: string;
    name: string;
    description: string;
    language?: string;
    framework?: string;
    version?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isDefault?: boolean;
    userId?: string;
    style: {
        indentation: 'spaces' | 'tabs';
        indentSize: number;
        lineEnding: 'lf' | 'crlf' | 'auto';
        quoteStyle: 'single' | 'double' | 'auto';
        semicolons: boolean;
        trailingComma: 'none' | 'es5' | 'all';
        bracketSpacing: boolean;
        arrowParens: 'always' | 'avoid';
        maxLineLength?: number;
    };
    rules: {
        naming: {
            functions: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
            variables: 'camelCase' | 'snake_case' | 'PascalCase' | 'CONSTANT_CASE';
            constants: 'UPPER_SNAKE' | 'camelCase' | 'PascalCase';
            classes: 'PascalCase' | 'snake_case';
            interfaces?: 'PascalCase' | 'IPascalCase';
            files: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';
        };
        imports: {
            orderBy: 'alphabetical' | 'grouped' | 'custom';
            groups?: string[];
            removeUnused: boolean;
            addMissing: boolean;
            preferRelative: boolean;
        };
        comments: {
            style: 'line' | 'block' | 'jsdoc';
            requireForPublicApi: boolean;
            removeRedundant: boolean;
            preserveTodos: boolean;
        };
    };
    aiContext: {
        systemPrompt?: string;
        additionalContext?: string;
        tone: 'professional' | 'casual' | 'educational' | 'concise';
        priorities: string[];
        avoidPatterns?: string[];
        preferredPatterns?: string[];
        exampleCode?: string;
        focusAreas?: string[];
    };
    frameworkConfig?: {
        react?: {
            componentStyle: 'functional' | 'class' | 'mixed';
            hooksRules: boolean;
            propTypesOrTypeScript: 'prop-types' | 'typescript' | 'both';
        };
        vue?: {
            apiStyle: 'options' | 'composition';
            scriptSetup: boolean;
        };
        angular?: {
            standalone: boolean;
            strictTemplates: boolean;
        };
        node?: {
            moduleSystem: 'commonjs' | 'esm';
            asyncStyle: 'callbacks' | 'promises' | 'async-await';
        };
        python?: {
            version: '2.7' | '3.x';
            typeHints: boolean;
            docstringStyle: 'google' | 'numpy' | 'sphinx';
        };
    };
    quality?: {
        maxComplexity?: number;
        maxFileLength?: number;
        maxFunctionLength?: number;
        requireTests?: boolean;
        coverageThreshold?: number;
    };
}
import { z } from 'zod';
export declare const contextProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    userId: z.ZodOptional<z.ZodString>;
    style: z.ZodObject<{
        indentation: z.ZodEnum<["spaces", "tabs"]>;
        indentSize: z.ZodNumber;
        lineEnding: z.ZodEnum<["lf", "crlf", "auto"]>;
        quoteStyle: z.ZodEnum<["single", "double", "auto"]>;
        semicolons: z.ZodBoolean;
        trailingComma: z.ZodEnum<["none", "es5", "all"]>;
        bracketSpacing: z.ZodBoolean;
        arrowParens: z.ZodEnum<["always", "avoid"]>;
        maxLineLength: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        indentation: "spaces" | "tabs";
        indentSize: number;
        lineEnding: "lf" | "crlf" | "auto";
        quoteStyle: "auto" | "single" | "double";
        semicolons: boolean;
        trailingComma: "all" | "none" | "es5";
        bracketSpacing: boolean;
        arrowParens: "always" | "avoid";
        maxLineLength?: number | undefined;
    }, {
        indentation: "spaces" | "tabs";
        indentSize: number;
        lineEnding: "lf" | "crlf" | "auto";
        quoteStyle: "auto" | "single" | "double";
        semicolons: boolean;
        trailingComma: "all" | "none" | "es5";
        bracketSpacing: boolean;
        arrowParens: "always" | "avoid";
        maxLineLength?: number | undefined;
    }>;
    rules: z.ZodObject<{
        naming: z.ZodObject<{
            functions: z.ZodEnum<["camelCase", "snake_case", "PascalCase", "kebab-case"]>;
            variables: z.ZodEnum<["camelCase", "snake_case", "PascalCase", "CONSTANT_CASE"]>;
            constants: z.ZodEnum<["UPPER_SNAKE", "camelCase", "PascalCase"]>;
            classes: z.ZodEnum<["PascalCase", "snake_case"]>;
            interfaces: z.ZodOptional<z.ZodEnum<["PascalCase", "IPascalCase"]>>;
            files: z.ZodEnum<["camelCase", "snake_case", "kebab-case", "PascalCase"]>;
        }, "strip", z.ZodTypeAny, {
            functions: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            variables: "camelCase" | "snake_case" | "PascalCase" | "CONSTANT_CASE";
            constants: "camelCase" | "PascalCase" | "UPPER_SNAKE";
            classes: "snake_case" | "PascalCase";
            files: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            interfaces?: "PascalCase" | "IPascalCase" | undefined;
        }, {
            functions: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            variables: "camelCase" | "snake_case" | "PascalCase" | "CONSTANT_CASE";
            constants: "camelCase" | "PascalCase" | "UPPER_SNAKE";
            classes: "snake_case" | "PascalCase";
            files: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            interfaces?: "PascalCase" | "IPascalCase" | undefined;
        }>;
        imports: z.ZodObject<{
            orderBy: z.ZodEnum<["alphabetical", "grouped", "custom"]>;
            groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            removeUnused: z.ZodBoolean;
            addMissing: z.ZodBoolean;
            preferRelative: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            orderBy: "custom" | "alphabetical" | "grouped";
            removeUnused: boolean;
            addMissing: boolean;
            preferRelative: boolean;
            groups?: string[] | undefined;
        }, {
            orderBy: "custom" | "alphabetical" | "grouped";
            removeUnused: boolean;
            addMissing: boolean;
            preferRelative: boolean;
            groups?: string[] | undefined;
        }>;
        comments: z.ZodObject<{
            style: z.ZodEnum<["line", "block", "jsdoc"]>;
            requireForPublicApi: z.ZodBoolean;
            removeRedundant: z.ZodBoolean;
            preserveTodos: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            style: "line" | "block" | "jsdoc";
            requireForPublicApi: boolean;
            removeRedundant: boolean;
            preserveTodos: boolean;
        }, {
            style: "line" | "block" | "jsdoc";
            requireForPublicApi: boolean;
            removeRedundant: boolean;
            preserveTodos: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        naming: {
            functions: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            variables: "camelCase" | "snake_case" | "PascalCase" | "CONSTANT_CASE";
            constants: "camelCase" | "PascalCase" | "UPPER_SNAKE";
            classes: "snake_case" | "PascalCase";
            files: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            interfaces?: "PascalCase" | "IPascalCase" | undefined;
        };
        imports: {
            orderBy: "custom" | "alphabetical" | "grouped";
            removeUnused: boolean;
            addMissing: boolean;
            preferRelative: boolean;
            groups?: string[] | undefined;
        };
        comments: {
            style: "line" | "block" | "jsdoc";
            requireForPublicApi: boolean;
            removeRedundant: boolean;
            preserveTodos: boolean;
        };
    }, {
        naming: {
            functions: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            variables: "camelCase" | "snake_case" | "PascalCase" | "CONSTANT_CASE";
            constants: "camelCase" | "PascalCase" | "UPPER_SNAKE";
            classes: "snake_case" | "PascalCase";
            files: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            interfaces?: "PascalCase" | "IPascalCase" | undefined;
        };
        imports: {
            orderBy: "custom" | "alphabetical" | "grouped";
            removeUnused: boolean;
            addMissing: boolean;
            preferRelative: boolean;
            groups?: string[] | undefined;
        };
        comments: {
            style: "line" | "block" | "jsdoc";
            requireForPublicApi: boolean;
            removeRedundant: boolean;
            preserveTodos: boolean;
        };
    }>;
    aiContext: z.ZodObject<{
        systemPrompt: z.ZodOptional<z.ZodString>;
        additionalContext: z.ZodOptional<z.ZodString>;
        tone: z.ZodEnum<["professional", "casual", "educational", "concise"]>;
        priorities: z.ZodArray<z.ZodString, "many">;
        avoidPatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        preferredPatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exampleCode: z.ZodOptional<z.ZodString>;
        focusAreas: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tone: "professional" | "casual" | "educational" | "concise";
        priorities: string[];
        systemPrompt?: string | undefined;
        additionalContext?: string | undefined;
        avoidPatterns?: string[] | undefined;
        preferredPatterns?: string[] | undefined;
        exampleCode?: string | undefined;
        focusAreas?: string[] | undefined;
    }, {
        tone: "professional" | "casual" | "educational" | "concise";
        priorities: string[];
        systemPrompt?: string | undefined;
        additionalContext?: string | undefined;
        avoidPatterns?: string[] | undefined;
        preferredPatterns?: string[] | undefined;
        exampleCode?: string | undefined;
        focusAreas?: string[] | undefined;
    }>;
    frameworkConfig: z.ZodOptional<z.ZodObject<{
        react: z.ZodOptional<z.ZodObject<{
            componentStyle: z.ZodEnum<["functional", "class", "mixed"]>;
            hooksRules: z.ZodBoolean;
            propTypesOrTypeScript: z.ZodEnum<["prop-types", "typescript", "both"]>;
        }, "strip", z.ZodTypeAny, {
            componentStyle: "functional" | "class" | "mixed";
            hooksRules: boolean;
            propTypesOrTypeScript: "prop-types" | "typescript" | "both";
        }, {
            componentStyle: "functional" | "class" | "mixed";
            hooksRules: boolean;
            propTypesOrTypeScript: "prop-types" | "typescript" | "both";
        }>>;
        vue: z.ZodOptional<z.ZodObject<{
            apiStyle: z.ZodEnum<["options", "composition"]>;
            scriptSetup: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            apiStyle: "options" | "composition";
            scriptSetup: boolean;
        }, {
            apiStyle: "options" | "composition";
            scriptSetup: boolean;
        }>>;
        angular: z.ZodOptional<z.ZodObject<{
            standalone: z.ZodBoolean;
            strictTemplates: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            standalone: boolean;
            strictTemplates: boolean;
        }, {
            standalone: boolean;
            strictTemplates: boolean;
        }>>;
        node: z.ZodOptional<z.ZodObject<{
            moduleSystem: z.ZodEnum<["commonjs", "esm"]>;
            asyncStyle: z.ZodEnum<["callbacks", "promises", "async-await"]>;
        }, "strip", z.ZodTypeAny, {
            moduleSystem: "commonjs" | "esm";
            asyncStyle: "callbacks" | "promises" | "async-await";
        }, {
            moduleSystem: "commonjs" | "esm";
            asyncStyle: "callbacks" | "promises" | "async-await";
        }>>;
        python: z.ZodOptional<z.ZodObject<{
            version: z.ZodEnum<["2.7", "3.x"]>;
            typeHints: z.ZodBoolean;
            docstringStyle: z.ZodEnum<["google", "numpy", "sphinx"]>;
        }, "strip", z.ZodTypeAny, {
            version: "2.7" | "3.x";
            typeHints: boolean;
            docstringStyle: "google" | "numpy" | "sphinx";
        }, {
            version: "2.7" | "3.x";
            typeHints: boolean;
            docstringStyle: "google" | "numpy" | "sphinx";
        }>>;
    }, "strip", z.ZodTypeAny, {
        react?: {
            componentStyle: "functional" | "class" | "mixed";
            hooksRules: boolean;
            propTypesOrTypeScript: "prop-types" | "typescript" | "both";
        } | undefined;
        vue?: {
            apiStyle: "options" | "composition";
            scriptSetup: boolean;
        } | undefined;
        angular?: {
            standalone: boolean;
            strictTemplates: boolean;
        } | undefined;
        node?: {
            moduleSystem: "commonjs" | "esm";
            asyncStyle: "callbacks" | "promises" | "async-await";
        } | undefined;
        python?: {
            version: "2.7" | "3.x";
            typeHints: boolean;
            docstringStyle: "google" | "numpy" | "sphinx";
        } | undefined;
    }, {
        react?: {
            componentStyle: "functional" | "class" | "mixed";
            hooksRules: boolean;
            propTypesOrTypeScript: "prop-types" | "typescript" | "both";
        } | undefined;
        vue?: {
            apiStyle: "options" | "composition";
            scriptSetup: boolean;
        } | undefined;
        angular?: {
            standalone: boolean;
            strictTemplates: boolean;
        } | undefined;
        node?: {
            moduleSystem: "commonjs" | "esm";
            asyncStyle: "callbacks" | "promises" | "async-await";
        } | undefined;
        python?: {
            version: "2.7" | "3.x";
            typeHints: boolean;
            docstringStyle: "google" | "numpy" | "sphinx";
        } | undefined;
    }>>;
    quality: z.ZodOptional<z.ZodObject<{
        maxComplexity: z.ZodOptional<z.ZodNumber>;
        maxFileLength: z.ZodOptional<z.ZodNumber>;
        maxFunctionLength: z.ZodOptional<z.ZodNumber>;
        requireTests: z.ZodOptional<z.ZodBoolean>;
        coverageThreshold: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxComplexity?: number | undefined;
        maxFileLength?: number | undefined;
        maxFunctionLength?: number | undefined;
        requireTests?: boolean | undefined;
        coverageThreshold?: number | undefined;
    }, {
        maxComplexity?: number | undefined;
        maxFileLength?: number | undefined;
        maxFunctionLength?: number | undefined;
        requireTests?: boolean | undefined;
        coverageThreshold?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    style: {
        indentation: "spaces" | "tabs";
        indentSize: number;
        lineEnding: "lf" | "crlf" | "auto";
        quoteStyle: "auto" | "single" | "double";
        semicolons: boolean;
        trailingComma: "all" | "none" | "es5";
        bracketSpacing: boolean;
        arrowParens: "always" | "avoid";
        maxLineLength?: number | undefined;
    };
    rules: {
        naming: {
            functions: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            variables: "camelCase" | "snake_case" | "PascalCase" | "CONSTANT_CASE";
            constants: "camelCase" | "PascalCase" | "UPPER_SNAKE";
            classes: "snake_case" | "PascalCase";
            files: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            interfaces?: "PascalCase" | "IPascalCase" | undefined;
        };
        imports: {
            orderBy: "custom" | "alphabetical" | "grouped";
            removeUnused: boolean;
            addMissing: boolean;
            preferRelative: boolean;
            groups?: string[] | undefined;
        };
        comments: {
            style: "line" | "block" | "jsdoc";
            requireForPublicApi: boolean;
            removeRedundant: boolean;
            preserveTodos: boolean;
        };
    };
    aiContext: {
        tone: "professional" | "casual" | "educational" | "concise";
        priorities: string[];
        systemPrompt?: string | undefined;
        additionalContext?: string | undefined;
        avoidPatterns?: string[] | undefined;
        preferredPatterns?: string[] | undefined;
        exampleCode?: string | undefined;
        focusAreas?: string[] | undefined;
    };
    userId?: string | undefined;
    version?: string | undefined;
    language?: string | undefined;
    framework?: string | undefined;
    isDefault?: boolean | undefined;
    frameworkConfig?: {
        react?: {
            componentStyle: "functional" | "class" | "mixed";
            hooksRules: boolean;
            propTypesOrTypeScript: "prop-types" | "typescript" | "both";
        } | undefined;
        vue?: {
            apiStyle: "options" | "composition";
            scriptSetup: boolean;
        } | undefined;
        angular?: {
            standalone: boolean;
            strictTemplates: boolean;
        } | undefined;
        node?: {
            moduleSystem: "commonjs" | "esm";
            asyncStyle: "callbacks" | "promises" | "async-await";
        } | undefined;
        python?: {
            version: "2.7" | "3.x";
            typeHints: boolean;
            docstringStyle: "google" | "numpy" | "sphinx";
        } | undefined;
    } | undefined;
    quality?: {
        maxComplexity?: number | undefined;
        maxFileLength?: number | undefined;
        maxFunctionLength?: number | undefined;
        requireTests?: boolean | undefined;
        coverageThreshold?: number | undefined;
    } | undefined;
}, {
    id: string;
    name: string;
    description: string;
    style: {
        indentation: "spaces" | "tabs";
        indentSize: number;
        lineEnding: "lf" | "crlf" | "auto";
        quoteStyle: "auto" | "single" | "double";
        semicolons: boolean;
        trailingComma: "all" | "none" | "es5";
        bracketSpacing: boolean;
        arrowParens: "always" | "avoid";
        maxLineLength?: number | undefined;
    };
    rules: {
        naming: {
            functions: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            variables: "camelCase" | "snake_case" | "PascalCase" | "CONSTANT_CASE";
            constants: "camelCase" | "PascalCase" | "UPPER_SNAKE";
            classes: "snake_case" | "PascalCase";
            files: "camelCase" | "snake_case" | "PascalCase" | "kebab-case";
            interfaces?: "PascalCase" | "IPascalCase" | undefined;
        };
        imports: {
            orderBy: "custom" | "alphabetical" | "grouped";
            removeUnused: boolean;
            addMissing: boolean;
            preferRelative: boolean;
            groups?: string[] | undefined;
        };
        comments: {
            style: "line" | "block" | "jsdoc";
            requireForPublicApi: boolean;
            removeRedundant: boolean;
            preserveTodos: boolean;
        };
    };
    aiContext: {
        tone: "professional" | "casual" | "educational" | "concise";
        priorities: string[];
        systemPrompt?: string | undefined;
        additionalContext?: string | undefined;
        avoidPatterns?: string[] | undefined;
        preferredPatterns?: string[] | undefined;
        exampleCode?: string | undefined;
        focusAreas?: string[] | undefined;
    };
    userId?: string | undefined;
    version?: string | undefined;
    language?: string | undefined;
    framework?: string | undefined;
    isDefault?: boolean | undefined;
    frameworkConfig?: {
        react?: {
            componentStyle: "functional" | "class" | "mixed";
            hooksRules: boolean;
            propTypesOrTypeScript: "prop-types" | "typescript" | "both";
        } | undefined;
        vue?: {
            apiStyle: "options" | "composition";
            scriptSetup: boolean;
        } | undefined;
        angular?: {
            standalone: boolean;
            strictTemplates: boolean;
        } | undefined;
        node?: {
            moduleSystem: "commonjs" | "esm";
            asyncStyle: "callbacks" | "promises" | "async-await";
        } | undefined;
        python?: {
            version: "2.7" | "3.x";
            typeHints: boolean;
            docstringStyle: "google" | "numpy" | "sphinx";
        } | undefined;
    } | undefined;
    quality?: {
        maxComplexity?: number | undefined;
        maxFileLength?: number | undefined;
        maxFunctionLength?: number | undefined;
        requireTests?: boolean | undefined;
        coverageThreshold?: number | undefined;
    } | undefined;
}>;
export type ContextProfileInput = z.infer<typeof contextProfileSchema>;
//# sourceMappingURL=context-profile.d.ts.map
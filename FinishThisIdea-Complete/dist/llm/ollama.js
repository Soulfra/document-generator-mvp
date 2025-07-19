"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollama = exports.OllamaClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const profile_loader_1 = require("../utils/profile-loader");
class OllamaClient {
    baseUrl;
    defaultModel;
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.defaultModel = process.env.OLLAMA_MODEL || 'codellama';
    }
    buildCleanupInstructions(profile) {
        const { style, rules } = profile;
        const indent = style.indentation === 'spaces' ? `${style.indentSize} spaces` : 'tabs';
        let instructions = `1. Fix indentation consistently (use ${indent})
2. ${rules.imports.removeUnused ? 'Remove unused imports' : 'Keep all imports'}
3. ${rules.comments.removeRedundant ? 'Remove redundant comments' : 'Keep all comments'}${rules.comments.preserveTodos ? ' but preserve TODO comments' : ''}
4. Order imports ${rules.imports.orderBy === 'alphabetical' ? 'alphabetically' : rules.imports.orderBy === 'grouped' ? `by groups: ${rules.imports.groups?.join(', ') || 'standard, third-party, local'}` : 'as they are'}
5. Use ${style.quoteStyle === 'auto' ? 'consistent' : style.quoteStyle} quotes for strings
6. ${style.semicolons ? 'Use' : 'Omit'} semicolons
7. Apply ${rules.naming.functions} for function names
8. Apply ${rules.naming.variables} for variable names
9. ${style.trailingComma !== 'none' ? `Use trailing commas (${style.trailingComma})` : 'Remove trailing commas'}
10. Preserve ALL functionality - do not change logic`;
        if (profile.aiContext.focusAreas?.length) {
            instructions += `\n\nFocus especially on: ${profile.aiContext.focusAreas.join(', ')}`;
        }
        return instructions;
    }
    getDefaultCleanupInstructions() {
        return `1. Remove unused imports
2. Fix indentation (use 2 spaces)
3. Remove commented-out code
4. Order imports logically
5. Fix obvious syntax issues
6. Preserve ALL functionality`;
    }
    async generate(prompt, options = {}) {
        const { model = this.defaultModel, temperature = 0.2, systemPrompt = 'You are a code cleanup assistant. You help organize and clean code while preserving functionality.', profile, } = options;
        const finalSystemPrompt = profile
            ? profile_loader_1.ProfileLoader.buildSystemPrompt(profile) + '\n\n' + systemPrompt
            : systemPrompt;
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/generate`, {
                model,
                prompt: `${finalSystemPrompt}\n\n${prompt}`,
                temperature,
                stream: false,
            }, {
                timeout: 120000,
            });
            return response.data.response;
        }
        catch (error) {
            logger_1.logger.error('Ollama generation failed:', error);
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new errors_1.ExternalServiceError('Ollama service is not running. Please start Ollama.', 'Ollama');
                }
                if (error.response?.status === 404) {
                    throw new errors_1.ExternalServiceError(`Model ${model} not found. Please pull the model first.`, 'Ollama');
                }
            }
            throw new errors_1.ExternalServiceError('Failed to generate response from Ollama', 'Ollama');
        }
    }
    async analyzeCode(code, profile) {
        const prompt = `Analyze this code and identify:
1. Code quality issues (dead code, unused imports, etc.)
2. Organization problems
3. Improvement suggestions

Code:
\`\`\`
${code}
\`\`\`

Respond in JSON format:
{
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "complexity": <number from 1-10>
}`;
        try {
            const response = await this.generate(prompt, {
                temperature: 0.1,
                profile,
            });
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Ollama');
            }
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            logger_1.logger.error('Code analysis failed:', error);
            return {
                issues: ['Unable to analyze code'],
                suggestions: ['Manual review recommended'],
                complexity: 5,
            };
        }
    }
    async cleanupCode(code, language, profile) {
        const prompt = `Clean up this ${language} code:
${profile ? this.buildCleanupInstructions(profile) : this.getDefaultCleanupInstructions()}

Original code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the cleaned code without any explanation.`;
        try {
            const response = await this.generate(prompt, {
                temperature: 0.1,
                systemPrompt: 'You are a code formatter. Return only cleaned code without explanations.',
                profile,
            });
            const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
            if (codeMatch) {
                return codeMatch[1].trim();
            }
            return response.trim();
        }
        catch (error) {
            logger_1.logger.error('Code cleanup failed:', error);
            return code;
        }
    }
    async suggestFileStructure(files) {
        const prompt = `Given these files, suggest a clean folder structure:

Files:
${files.join('\n')}

Respond in JSON format:
{
  "structure": {
    "src/": ["file1.js", "file2.js"],
    "tests/": ["test1.js"],
    "docs/": ["README.md"]
  },
  "renames": {
    "old_name.js": "new-name.js"
  }
}`;
        try {
            const response = await this.generate(prompt, {
                temperature: 0.3,
            });
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response');
            }
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            logger_1.logger.error('File structure suggestion failed:', error);
            return {
                structure: {
                    'src/': files.filter(f => !f.includes('test') && !f.includes('.md')),
                    'tests/': files.filter(f => f.includes('test')),
                    'docs/': files.filter(f => f.endsWith('.md')),
                },
                renames: {},
            };
        }
    }
    async isAvailable() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/tags`, {
                timeout: 5000,
            });
            const models = response.data.models || [];
            const hasModel = models.some((m) => m.name === this.defaultModel);
            if (!hasModel) {
                logger_1.logger.warn(`Ollama model ${this.defaultModel} not found. Available models:`, models.map((m) => m.name));
            }
            return hasModel;
        }
        catch (error) {
            logger_1.logger.error('Ollama availability check failed:', error);
            return false;
        }
    }
}
exports.OllamaClient = OllamaClient;
exports.ollama = new OllamaClient();
//# sourceMappingURL=ollama.js.map
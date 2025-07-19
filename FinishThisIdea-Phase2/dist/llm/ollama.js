"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollama = exports.OllamaClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class OllamaClient {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.defaultModel = process.env.OLLAMA_MODEL || 'codellama';
    }
    async generate(prompt, options = {}) {
        const { model = this.defaultModel, temperature = 0.2, // Lower temperature for more consistent code cleanup
        systemPrompt = 'You are a code cleanup assistant. You help organize and clean code while preserving functionality.', } = options;
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/generate`, {
                model,
                prompt: `${systemPrompt}\n\n${prompt}`,
                temperature,
                stream: false,
            }, {
                timeout: 120000, // 2 minute timeout
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
    async analyzeCode(code) {
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
                temperature: 0.1, // Very low temperature for consistent JSON
            });
            // Parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Ollama');
            }
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            logger_1.logger.error('Code analysis failed:', error);
            // Return default analysis on error
            return {
                issues: ['Unable to analyze code'],
                suggestions: ['Manual review recommended'],
                complexity: 5,
            };
        }
    }
    async cleanupCode(code, language) {
        const prompt = `Clean up this ${language} code:
1. Remove unused imports
2. Fix indentation (use 2 spaces)
3. Remove commented-out code
4. Order imports logically
5. Fix obvious syntax issues
6. Preserve ALL functionality

Original code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the cleaned code without any explanation.`;
        try {
            const response = await this.generate(prompt, {
                temperature: 0.1,
                systemPrompt: 'You are a code formatter. Return only cleaned code without explanations.',
            });
            // Extract code from response
            const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
            if (codeMatch) {
                return codeMatch[1].trim();
            }
            // If no code block found, return the response as-is
            return response.trim();
        }
        catch (error) {
            logger_1.logger.error('Code cleanup failed:', error);
            // Return original code on error
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
            // Return basic structure on error
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
// Singleton instance
exports.ollama = new OllamaClient();
//# sourceMappingURL=ollama.js.map
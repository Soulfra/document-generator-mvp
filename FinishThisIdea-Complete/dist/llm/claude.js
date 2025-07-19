"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claude = exports.ClaudeClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const profile_loader_1 = require("../utils/profile-loader");
class ClaudeClient {
    client = null;
    model;
    constructor() {
        if (process.env.ANTHROPIC_API_KEY) {
            this.client = new sdk_1.default({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
        }
        this.model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
    }
    buildCleanupInstructions(profile) {
        const { style, rules } = profile;
        const indent = style.indentation === 'spaces' ? `${style.indentSize} spaces` : 'tabs';
        let instructions = `1. Fix indentation consistently (use ${indent})
2. ${rules.imports.removeUnused ? 'Remove all unused imports and variables' : 'Keep all imports'}
3. ${rules.comments.removeRedundant ? 'Remove redundant comments' : 'Keep all comments'}${rules.comments.preserveTodos ? ' but preserve TODO comments' : ''}
4. Order imports ${rules.imports.orderBy === 'alphabetical' ? 'alphabetically' : rules.imports.orderBy === 'grouped' ? `by groups: ${rules.imports.groups?.join(', ') || 'standard, third-party, local'}` : 'as they are'}
5. Use ${style.quoteStyle === 'auto' ? 'consistent' : style.quoteStyle} quotes for strings
6. ${style.semicolons ? 'Use' : 'Omit'} semicolons
7. Apply ${rules.naming.functions} for function names
8. Apply ${rules.naming.variables} for variable names
9. Apply ${rules.naming.constants} for constants
10. ${style.trailingComma !== 'none' ? `Use trailing commas (${style.trailingComma})` : 'Remove trailing commas'}
11. Preserve ALL functionality - do not change logic`;
        if (profile.aiContext.focusAreas?.length) {
            instructions += `\n\nFocus especially on: ${profile.aiContext.focusAreas.join(', ')}`;
        }
        return instructions;
    }
    getDefaultCleanupInstructions() {
        return `1. Remove all unused imports and variables
2. Fix indentation consistently (use 2 spaces)
3. Remove all commented-out code
4. Order imports logically (standard library, third-party, local)
5. Fix obvious syntax issues
6. Apply language best practices
7. Preserve ALL functionality - do not change logic`;
    }
    calculateCost(inputTokens, outputTokens) {
        const inputCostPer1k = 0.003;
        const outputCostPer1k = 0.015;
        return (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k;
    }
    async analyzeCode(code, profile) {
        if (!this.client) {
            throw new errors_1.ExternalServiceError('Claude API key not configured', 'Claude');
        }
        try {
            const baseSystemPrompt = 'You are a code analysis expert. Analyze code for quality issues, organization problems, and improvement opportunities. Always respond in valid JSON format.';
            const systemPrompt = profile
                ? profile_loader_1.ProfileLoader.buildSystemPrompt(profile) + '\n\n' + baseSystemPrompt
                : baseSystemPrompt;
            const message = await this.client.messages.create({
                model: this.model,
                max_tokens: 2000,
                temperature: 0.1,
                system: systemPrompt,
                messages: [{
                        role: 'user',
                        content: `Analyze this code and provide a detailed report:

\`\`\`
${code}
\`\`\`

Respond in this exact JSON format:
{
  "issues": ["detailed issue 1", "detailed issue 2"],
  "suggestions": ["specific suggestion 1", "specific suggestion 2"],
  "complexity": <number 1-10>,
  "refactorOpportunities": ["opportunity 1", "opportunity 2"],
  "securityConcerns": ["concern 1", "concern 2"]
}`
                    }],
            });
            const response = message.content[0].type === 'text'
                ? message.content[0].text
                : '';
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Claude');
            }
            const data = JSON.parse(jsonMatch[0]);
            const cost = this.calculateCost(message.usage?.input_tokens || 0, message.usage?.output_tokens || 0);
            return { data, cost };
        }
        catch (error) {
            logger_1.logger.error('Claude analysis failed:', error);
            throw new errors_1.ExternalServiceError('Failed to analyze code with Claude', 'Claude');
        }
    }
    async cleanupCode(code, language, profile) {
        if (!this.client) {
            throw new errors_1.ExternalServiceError('Claude API key not configured', 'Claude');
        }
        try {
            const baseSystemPrompt = 'You are a code cleanup expert. Clean and organize code while preserving all functionality. Return only the cleaned code without any explanation.';
            const systemPrompt = profile
                ? profile_loader_1.ProfileLoader.buildSystemPrompt(profile) + '\n\n' + baseSystemPrompt
                : baseSystemPrompt;
            const message = await this.client.messages.create({
                model: this.model,
                max_tokens: 4000,
                temperature: 0,
                system: systemPrompt,
                messages: [{
                        role: 'user',
                        content: `Clean up this ${language} code:
${profile ? this.buildCleanupInstructions(profile) : this.getDefaultCleanupInstructions()}

Original code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the cleaned code wrapped in triple backticks.`
                    }],
            });
            const response = message.content[0].type === 'text'
                ? message.content[0].text
                : '';
            const codeMatch = response.match(/```[\w]*\n?([\s\S]*?)```/);
            if (!codeMatch) {
                throw new Error('No code block in Claude response');
            }
            const cost = this.calculateCost(message.usage?.input_tokens || 0, message.usage?.output_tokens || 0);
            return { data: codeMatch[1].trim(), cost };
        }
        catch (error) {
            logger_1.logger.error('Claude cleanup failed:', error);
            throw new errors_1.ExternalServiceError('Failed to cleanup code with Claude', 'Claude');
        }
    }
    async suggestFileStructure(files) {
        if (!this.client) {
            throw new errors_1.ExternalServiceError('Claude API key not configured', 'Claude');
        }
        try {
            const message = await this.client.messages.create({
                model: this.model,
                max_tokens: 2000,
                temperature: 0.3,
                system: 'You are a software architecture expert. Suggest optimal file organization structures. Always respond in valid JSON format.',
                messages: [{
                        role: 'user',
                        content: `Given these files, suggest an optimal folder structure following best practices:

Files:
${files.join('\n')}

Consider:
1. Language-specific conventions
2. Separation of concerns
3. Test file organization
4. Configuration files placement
5. Documentation organization

Respond in this exact JSON format:
{
  "structure": {
    "folder/": ["file1.ext", "file2.ext"],
    "another/folder/": ["file3.ext"]
  },
  "renames": {
    "old_name.ext": "new-name.ext"
  },
  "reasoning": "Brief explanation of the structure"
}`
                    }],
            });
            const response = message.content[0].type === 'text'
                ? message.content[0].text
                : '';
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Claude');
            }
            const data = JSON.parse(jsonMatch[0]);
            const cost = this.calculateCost(message.usage?.input_tokens || 0, message.usage?.output_tokens || 0);
            return { data, cost };
        }
        catch (error) {
            logger_1.logger.error('Claude structure suggestion failed:', error);
            throw new errors_1.ExternalServiceError('Failed to suggest structure with Claude', 'Claude');
        }
    }
    async generate(prompt) {
        if (!this.client) {
            throw new errors_1.ExternalServiceError('Claude API key not configured', 'Claude');
        }
        try {
            const message = await this.client.messages.create({
                model: this.model,
                max_tokens: 4000,
                temperature: 0.7,
                messages: [{
                        role: 'user',
                        content: prompt,
                    }],
            });
            const response = message.content[0].type === 'text'
                ? message.content[0].text
                : '';
            const cost = this.calculateCost(message.usage?.input_tokens || 0, message.usage?.output_tokens || 0);
            return { data: response, cost };
        }
        catch (error) {
            logger_1.logger.error('Claude generation failed:', error);
            throw new errors_1.ExternalServiceError('Failed to generate with Claude', 'Claude');
        }
    }
}
exports.ClaudeClient = ClaudeClient;
exports.claude = new ClaudeClient();
//# sourceMappingURL=claude.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeAnalysisAgent = exports.CodeAnalysisAgent = void 0;
const base_agent_1 = require("./base-agent");
const router_1 = require("../../../llm/router");
const logger_1 = require("../../../utils/logger");
class CodeAnalysisAgent extends base_agent_1.BaseAgent {
    constructor() {
        const config = {
            name: 'Code Analysis Agent',
            type: 'code_analysis',
            version: '1.0.0',
            description: 'Specialized agent for code analysis, review, and improvement suggestions',
            capabilities: [
                {
                    name: 'code_analysis',
                    description: 'Analyze code quality, structure, and patterns',
                    inputTypes: ['javascript', 'typescript', 'python', 'java', 'cpp'],
                    outputTypes: ['analysis_report', 'suggestions'],
                    complexity: 'medium',
                    estimatedCost: 0.1
                },
                {
                    name: 'code_review',
                    description: 'Perform comprehensive code reviews',
                    inputTypes: ['code_diff', 'source_code'],
                    outputTypes: ['review_report', 'feedback'],
                    complexity: 'high',
                    estimatedCost: 0.2
                },
                {
                    name: 'bug_detection',
                    description: 'Identify potential bugs and security vulnerabilities',
                    inputTypes: ['source_code'],
                    outputTypes: ['bug_report', 'security_analysis'],
                    complexity: 'high',
                    estimatedCost: 0.15
                },
                {
                    name: 'code_optimization',
                    description: 'Suggest performance and efficiency improvements',
                    inputTypes: ['source_code'],
                    outputTypes: ['optimization_suggestions'],
                    complexity: 'medium',
                    estimatedCost: 0.12
                }
            ],
            configuration: {
                maxFileSize: 1024 * 1024,
                supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'],
                analysisDepth: 'comprehensive'
            }
        };
        super(config);
    }
    async processTask(task) {
        const { type, payload } = task;
        logger_1.logger.info('Processing code analysis task', {
            taskId: task.id,
            type,
            agentId: this.getId()
        });
        await this.updateProgress(20);
        switch (type) {
            case 'code_analysis':
                return await this.analyzeCode(payload);
            case 'code_review':
                return await this.reviewCode(payload);
            case 'bug_detection':
                return await this.detectBugs(payload);
            case 'code_optimization':
                return await this.optimizeCode(payload);
            default:
                throw new Error(`Unsupported task type: ${type}`);
        }
    }
    async analyzeCode(payload) {
        const { code, language, filename } = payload;
        if (!code) {
            throw new Error('Code content is required for analysis');
        }
        await this.updateProgress(40);
        const prompt = `
Please analyze the following ${language || 'code'} and provide a comprehensive analysis:

Filename: ${filename || 'unknown'}
Code:
\`\`\`${language || ''}
${code}
\`\`\`

Please provide analysis in JSON format:
{
  "quality": {
    "score": 0.85,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "complexity": {
    "cyclomaticComplexity": 5,
    "cognitiveComplexity": 3,
    "maintainabilityIndex": 78
  },
  "structure": {
    "functions": 3,
    "classes": 1,
    "linesOfCode": 150,
    "duplicateCode": false
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}
`;
        try {
            await this.updateProgress(60);
            const response = await router_1.llmRouter.generateResponse(prompt, {
                temperature: 0.3,
                maxTokens: 2000
            });
            await this.updateProgress(80);
            const analysis = this.parseAnalysisResponse(response);
            await this.updateProgress(90);
            return {
                analysis,
                metadata: {
                    agentId: this.getId(),
                    agentType: 'code_analysis',
                    timestamp: new Date().toISOString(),
                    language,
                    filename
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Code analysis failed', { error });
            throw new Error(`Code analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async reviewCode(payload) {
        const { code, context, guidelines } = payload;
        await this.updateProgress(40);
        const prompt = `
Please perform a thorough code review of the following code:

${context ? `Context: ${context}` : ''}
${guidelines ? `Guidelines: ${guidelines}` : ''}

Code:
\`\`\`
${code}
\`\`\`

Please provide a comprehensive review in JSON format:
{
  "overall": {
    "rating": "good",
    "summary": "Brief summary of the review"
  },
  "issues": [
    {
      "type": "bug|style|performance|security",
      "severity": "low|medium|high|critical",
      "line": 15,
      "description": "Issue description",
      "suggestion": "How to fix it"
    }
  ],
  "positives": [
    "Good practices found in the code"
  ],
  "suggestions": [
    "General improvement suggestions"
  ]
}
`;
        try {
            await this.updateProgress(60);
            const response = await router_1.llmRouter.generateResponse(prompt, {
                temperature: 0.2,
                maxTokens: 2500
            });
            await this.updateProgress(80);
            const review = this.parseAnalysisResponse(response);
            return {
                review,
                metadata: {
                    agentId: this.getId(),
                    agentType: 'code_review',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Code review failed', { error });
            throw new Error(`Code review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async detectBugs(payload) {
        const { code, language, securityFocus = true } = payload;
        await this.updateProgress(40);
        const prompt = `
Please analyze the following ${language || ''} code for bugs and security vulnerabilities:

Code:
\`\`\`${language || ''}
${code}
\`\`\`

Focus on:
- Logic errors
- Runtime exceptions
- Memory leaks
- Security vulnerabilities (SQL injection, XSS, etc.)
- Race conditions
- Input validation issues

Please provide results in JSON format:
{
  "bugs": [
    {
      "type": "logic|runtime|memory|security",
      "severity": "low|medium|high|critical",
      "line": 10,
      "description": "Bug description",
      "impact": "Potential impact",
      "fix": "How to fix it"
    }
  ],
  "securityIssues": [
    {
      "vulnerability": "SQL Injection",
      "severity": "high",
      "location": "line 25",
      "description": "Detailed description",
      "mitigation": "How to fix it"
    }
  ],
  "summary": {
    "totalIssues": 3,
    "criticalIssues": 1,
    "securityScore": 0.75
  }
}
`;
        try {
            await this.updateProgress(60);
            const response = await router_1.llmRouter.generateResponse(prompt, {
                temperature: 0.1,
                maxTokens: 3000
            });
            await this.updateProgress(80);
            const analysis = this.parseAnalysisResponse(response);
            return {
                bugAnalysis: analysis,
                metadata: {
                    agentId: this.getId(),
                    agentType: 'bug_detection',
                    timestamp: new Date().toISOString(),
                    language,
                    securityFocus
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Bug detection failed', { error });
            throw new Error(`Bug detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async optimizeCode(payload) {
        const { code, language, performanceFocus = true } = payload;
        await this.updateProgress(40);
        const prompt = `
Please analyze the following ${language || ''} code and suggest optimizations:

Code:
\`\`\`${language || ''}
${code}
\`\`\`

Focus on:
- Performance improvements
- Memory efficiency
- Algorithm optimization
- Code readability
- Best practices

Please provide suggestions in JSON format:
{
  "optimizations": [
    {
      "type": "performance|memory|readability|architecture",
      "priority": "low|medium|high",
      "location": "line 15-20",
      "current": "Current code snippet",
      "optimized": "Optimized code snippet",
      "explanation": "Why this is better",
      "impact": "Expected performance gain"
    }
  ],
  "metrics": {
    "estimatedSpeedImprovement": "20%",
    "memoryReduction": "15%",
    "maintainabilityScore": 0.85
  },
  "summary": "Overall optimization summary"
}
`;
        try {
            await this.updateProgress(60);
            const response = await router_1.llmRouter.generateResponse(prompt, {
                temperature: 0.2,
                maxTokens: 2500
            });
            await this.updateProgress(80);
            const optimizations = this.parseAnalysisResponse(response);
            return {
                optimizations,
                metadata: {
                    agentId: this.getId(),
                    agentType: 'code_optimization',
                    timestamp: new Date().toISOString(),
                    language,
                    performanceFocus
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Code optimization failed', { error });
            throw new Error(`Code optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    parseAnalysisResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return {
                rawResponse: response,
                parsed: false,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.logger.warn('Failed to parse analysis response', { error });
            return {
                rawResponse: response,
                parsed: false,
                error: error instanceof Error ? error.message : 'Unknown parsing error',
                timestamp: new Date().toISOString()
            };
        }
    }
}
exports.CodeAnalysisAgent = CodeAnalysisAgent;
exports.codeAnalysisAgent = new CodeAnalysisAgent();
//# sourceMappingURL=code-analysis-agent.js.map
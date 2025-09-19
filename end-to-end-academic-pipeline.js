#!/usr/bin/env node

/**
 * 🔄 END-TO-END ACADEMIC PIPELINE
 * 
 * Complete workflow integration: Consultation → Orchestration → Formatting → Grading
 * 
 * This ties together all the systems:
 * 1. CalCompare consultation (real APIs)
 * 2. Internal orchestration (Ollama)
 * 3. Academic formatting
 * 4. Cal grading system
 * 5. Data storage and packaging
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');

class EndToEndAcademicPipeline extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            outputDirectory: config.outputDirectory || './academic-output',
            enableZipPackaging: config.enableZipPackaging !== false,
            enableRealAPIs: config.enableRealAPIs !== false,
            studentId: config.studentId || 'anonymous-student',
            ...config
        };
        
        // Initialize components
        const RealAIAPIConnector = require('./real-ai-api-connector.js');
        const CalGradingSystem = require('./cal-grading-system.js');
        
        // NEW: Load vibecheck validation systems
        const CalCompareConsultationHub = require('./calcompare-consultation-hub.js');
        
        this.aiConnector = new RealAIAPIConnector();
        this.gradingSystem = new CalGradingSystem({
            graderPersonality: 'cal',
            gradingModel: 'claude-3-opus'
        });
        
        // NEW: Consultation hub with vibecheck mode
        this.consultationHub = new CalCompareConsultationHub({
            enableVibecheckMode: config.enableVibecheck !== false,
            vibecheckAggression: config.vibecheckAggression || 'moderate',
            enableGodFilter: config.enableGodFilter !== false,
            enableCringeproof: config.enableCringeproof !== false,
            enableDirectionCorrection: config.enableDirectionCorrection !== false
        });
        
        // Database connection
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/document_generator'
        });
        
        console.log('🔄 End-to-End Academic Pipeline initialized');
        console.log(`📁 Output directory: ${this.config.outputDirectory}`);
        console.log(`👤 Student ID: ${this.config.studentId}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Ensure output directory exists
        await fs.mkdir(this.config.outputDirectory, { recursive: true });
        
        console.log('✅ End-to-End Pipeline ready');
    }
    
    /**
     * Process complete academic workflow from query to graded output
     */
    async processQuery(query, options = {}) {
        console.log(`\n🔄 Starting complete academic pipeline for: "${query}"`);
        
        const workflowId = crypto.randomUUID();
        const startTime = Date.now();
        
        try {
            // Phase 1: CalCompare Vibecheck Consultation (NEW)
            console.log('\n🎮 Phase 1: CalCompare Vibecheck Consultation');
            const vibecheckConsultation = await this.performVibecheckConsultation(query, options);
            
            // Phase 2: Validation Results Processing (NEW)
            console.log('\n🔍 Phase 2: Validation Results Processing');
            const processedConsultation = await this.processValidationResults(vibecheckConsultation);
            
            // Phase 3: Internal Orchestration (Enhanced)
            console.log('\n🤖 Phase 3: Internal Orchestration (Ollama)');
            const orchestration = await this.performOrchestration(processedConsultation, options);
            
            // Phase 4: Academic Formatting
            console.log('\n📚 Phase 4: Academic Document Formatting');
            const document = await this.formatAcademicDocument(orchestration, options);
            
            // Phase 5: Cal Grading
            console.log('\n🎓 Phase 5: Cal Grading & Quality Assessment');
            const grading = await this.performGrading(document.id, options);
            
            // Phase 6: Output Packaging (Enhanced)
            console.log('\n📦 Phase 6: Final Output Packaging');
            const packagedOutput = await this.packageOutput(workflowId, {
                consultation: processedConsultation,
                vibecheckValidation: vibecheckConsultation.validationResults,
                orchestration,
                document,
                grading
            });
            
            const totalDuration = Date.now() - startTime;
            
            console.log(`\n✅ Complete academic pipeline finished (${totalDuration}ms)`);
            console.log(`📄 Document: ${document.title}`);
            console.log(`🎓 Grade: ${grading.grade} (${grading.passFail})`);
            console.log(`📦 Package: ${packagedOutput.packagePath}`);
            
            // Store workflow completion
            await this.recordWorkflowCompletion(workflowId, {
                query,
                consultation: processedConsultation,
                orchestration,
                document,
                grading,
                packagedOutput,
                duration: totalDuration
            });
            
            return {
                workflowId,
                query,
                document: {
                    id: document.id,
                    title: document.title,
                    type: document.type,
                    filePaths: document.filePaths
                },
                grading: {
                    grade: grading.grade,
                    numericGrade: grading.numericGrade,
                    passFail: grading.passFail,
                    feedback: grading.feedback
                },
                package: packagedOutput,
                metrics: {
                    totalDuration,
                    consultationCost: processedConsultation.totalCost,
                    gradingDuration: grading.duration,
                    overallQuality: orchestration.qualityScore
                }
            };
            
        } catch (error) {
            console.error(`❌ Pipeline failed: ${error.message}`);
            
            // Store failure for analysis
            await this.recordWorkflowFailure(workflowId, query, error);
            
            throw error;
        }
    }
    
    /**
     * Phase 1: Perform CalCompare consultation
     */
    async performConsultation(query, options) {
        const consultationPlan = [
            {
                service: 'anthropic',
                model: 'claude-3-opus',
                prompt: this.buildConsultationPrompt(query, 'comprehensive'),
                options: { maxTokens: 2048 }
            },
            {
                service: 'openai',
                model: 'gpt-4',
                prompt: this.buildConsultationPrompt(query, 'analytical'),
                options: { maxTokens: 2048 }
            },
            {
                service: 'perplexity',
                model: 'llama-3.1-sonar-large-128k-online',
                prompt: this.buildConsultationPrompt(query, 'research'),
                options: { maxTokens: 1024 }
            }
        ];
        
        // Add DeepSeek if available
        if (this.aiConnector.apiKeys.deepseek) {
            consultationPlan.push({
                service: 'deepseek',
                model: 'deepseek-chat',
                prompt: this.buildConsultationPrompt(query, 'technical'),
                options: { maxTokens: 1024 }
            });
        }
        
        const batchResult = await this.aiConnector.batchConsult(consultationPlan);
        
        // Aggregate responses
        const aggregated = this.aggregateConsultationResults(batchResult.successful);
        
        // Store consultation
        const consultationId = await this.storeConsultation(query, batchResult, aggregated);
        
        console.log(`✅ Consultation complete: ${batchResult.successful.length} models responded`);
        console.log(`💰 Cost: $${batchResult.totalCost.toFixed(4)}`);
        console.log(`📊 Confidence: ${(aggregated.confidence * 100).toFixed(1)}%`);
        
        return {
            id: consultationId,
            query,
            responses: batchResult.successful,
            aggregated,
            totalCost: batchResult.totalCost,
            duration: batchResult.totalDuration
        };
    }
    
    /**
     * NEW Phase 1: Perform vibecheck consultation with validation
     */
    async performVibecheckConsultation(query, options) {
        console.log('🎮 Using vibecheck consultation hub...');
        
        // Use the enhanced consultation hub with vibecheck
        const vibecheckResult = await this.consultationHub.vibecheckConsult(query, options);
        
        console.log(`✅ Vibecheck consultation complete: ${vibecheckResult.recommendation.action}`);
        console.log(`📊 Overall quality: ${(vibecheckResult.overallQuality * 100).toFixed(1)}%`);
        console.log(`💰 Total cost: $${vibecheckResult.totalCost.toFixed(4)}`);
        
        return vibecheckResult;
    }
    
    /**
     * NEW Phase 2: Process validation results and prepare for orchestration
     */
    async processValidationResults(vibecheckConsultation) {
        console.log('🔍 Processing validation results...');
        
        const validation = vibecheckConsultation.validationResults;
        
        // Determine best content to use for orchestration
        let contentForOrchestration;
        
        if (validation.directionCorrection?.finalContent) {
            // Use direction-corrected content if available
            contentForOrchestration = validation.directionCorrection.finalContent;
            console.log('  🧭 Using direction-corrected content');
        } else if (vibecheckConsultation.recommendation.action.includes('APPROVED')) {
            // Use original content if it passed validation
            contentForOrchestration = vibecheckConsultation.originalConsultation.aggregated?.content;
            console.log('  ✅ Using validated original content');
        } else {
            // Content failed validation but proceeding anyway (with warnings)
            contentForOrchestration = vibecheckConsultation.originalConsultation.aggregated?.content;
            console.log('  ⚠️  Using original content despite validation concerns');
        }
        
        // Create enhanced consultation object with validation metadata
        const processedConsultation = {
            id: vibecheckConsultation.originalConsultation.id,
            query: vibecheckConsultation.originalConsultation.query,
            responses: vibecheckConsultation.originalConsultation.responses,
            aggregated: {
                content: contentForOrchestration,
                sources: vibecheckConsultation.originalConsultation.aggregated?.sources || [],
                citations: vibecheckConsultation.originalConsultation.aggregated?.citations || [],
                confidence: vibecheckConsultation.overallQuality // Use vibecheck quality as confidence
            },
            totalCost: vibecheckConsultation.totalCost,
            duration: vibecheckConsultation.duration,
            // NEW: Validation metadata
            validationResults: validation,
            vibecheckScore: vibecheckConsultation.overallQuality,
            recommendation: vibecheckConsultation.recommendation,
            qualityAssured: vibecheckConsultation.recommendation.action.includes('APPROVED')
        };
        
        console.log(`✅ Processed consultation ready for orchestration`);
        console.log(`📊 Quality assurance: ${processedConsultation.qualityAssured ? 'PASSED' : 'WITH_CONCERNS'}`);
        console.log(`🎯 Final confidence: ${(processedConsultation.aggregated.confidence * 100).toFixed(1)}%`);
        
        return processedConsultation;
    }
    
    /**
     * Phase 3: Internal orchestration with Ollama (Enhanced with validation awareness)
     */
    async performOrchestration(consultation, options) {
        // Determine content type based on query
        const contentType = this.detectContentType(consultation.query);
        
        // Select appropriate pipeline
        const pipeline = this.getOrchestrationPipeline(contentType);
        
        console.log(`🔄 Running ${contentType} pipeline with ${pipeline.stages.length} stages`);
        
        const orchestrationResults = [];
        let currentContent = consultation.aggregated.content;
        
        // Process through each stage
        for (const [index, stage] of pipeline.stages.entries()) {
            console.log(`  Stage ${index + 1}: ${stage.task} (${stage.model})`);
            
            const stagePrompt = this.buildStagePrompt(stage, currentContent, consultation);
            
            const stageResult = await this.aiConnector.callOllama(
                stage.model,
                stagePrompt,
                { temperature: stage.temperature || 0.7 }
            );
            
            currentContent = stageResult.content;
            orchestrationResults.push({
                stage: stage.task,
                model: stage.model,
                input: stagePrompt.substring(0, 200) + '...',
                output: currentContent,
                duration: stageResult.duration
            });
            
            console.log(`    ✅ Completed (${stageResult.duration}ms)`);
        }
        
        // Calculate quality score
        const qualityScore = await this.assessOrchestrationQuality(currentContent, consultation);
        
        // Store orchestration
        const orchestrationId = await this.storeOrchestration(consultation.id, {
            contentType,
            pipeline: pipeline.name,
            stages: orchestrationResults,
            finalContent: currentContent,
            qualityScore
        });
        
        console.log(`✅ Orchestration complete with ${qualityScore.toFixed(1)}% quality`);
        
        return {
            id: orchestrationId,
            contentType,
            processedContent: currentContent,
            qualityScore,
            stages: orchestrationResults.length,
            duration: orchestrationResults.reduce((sum, r) => sum + r.duration, 0)
        };
    }
    
    /**
     * Phase 3: Format academic document
     */
    async formatAcademicDocument(orchestration, options) {
        const formatter = this.getDocumentFormatter(orchestration.contentType);
        
        const formattedDoc = await formatter.format(orchestration.processedContent, {
            citationStyle: options.citationStyle || 'apa',
            outputFormats: ['markdown', 'html'],
            includeTableOfContents: true,
            includeCitations: true
        });
        
        // Save to files
        const fileBaseName = this.generateFileName(formattedDoc.title);
        const filePaths = {
            markdown: path.join(this.config.outputDirectory, `${fileBaseName}.md`),
            html: path.join(this.config.outputDirectory, `${fileBaseName}.html`)
        };
        
        await fs.writeFile(filePaths.markdown, formattedDoc.markdown);
        await fs.writeFile(filePaths.html, formattedDoc.html);
        
        // Store document record
        const documentId = await this.storeAcademicDocument(orchestration.id, {
            title: formattedDoc.title,
            type: orchestration.contentType,
            citationStyle: options.citationStyle || 'apa',
            filePaths,
            wordCount: formattedDoc.wordCount,
            citationCount: formattedDoc.citations.length
        });
        
        console.log(`✅ Document formatted: "${formattedDoc.title}"`);
        console.log(`📝 Word count: ${formattedDoc.wordCount}`);
        console.log(`📖 Citations: ${formattedDoc.citations.length}`);
        
        return {
            id: documentId,
            title: formattedDoc.title,
            type: orchestration.contentType,
            filePaths,
            wordCount: formattedDoc.wordCount,
            citations: formattedDoc.citations
        };
    }
    
    /**
     * Phase 4: Cal grading
     */
    async performGrading(documentId, options) {
        return await this.gradingSystem.gradeDocument(documentId, {
            studentId: this.config.studentId,
            ...options
        });
    }
    
    /**
     * Phase 5: Package everything for output
     */
    async packageOutput(workflowId, components) {
        const packageData = {
            workflowId,
            timestamp: new Date().toISOString(),
            pipeline: 'end-to-end-academic',
            
            // Input
            originalQuery: components.consultation.query,
            
            // Consultation phase
            consultation: {
                id: components.consultation.id,
                modelsUsed: components.consultation.responses.length,
                totalCost: components.consultation.totalCost,
                confidence: components.consultation.aggregated.confidence,
                sources: components.consultation.aggregated.sources,
                citations: components.consultation.aggregated.citations
            },
            
            // Orchestration phase
            orchestration: {
                id: components.orchestration.id,
                contentType: components.orchestration.contentType,
                qualityScore: components.orchestration.qualityScore,
                stagesCompleted: components.orchestration.stages
            },
            
            // Document phase
            document: {
                id: components.document.id,
                title: components.document.title,
                type: components.document.type,
                wordCount: components.document.wordCount,
                citationCount: components.document.citations.length,
                filePaths: components.document.filePaths
            },
            
            // Grading phase
            grading: {
                grade: components.grading.grade,
                numericGrade: components.grading.numericGrade,
                passFail: components.grading.passFail,
                criteria: components.grading.criteria,
                feedback: components.grading.feedback
            },
            
            // Summary metrics
            metrics: {
                totalDuration: Date.now() - Date.parse(components.consultation.startTime || new Date()),
                totalCost: components.consultation.totalCost + (components.grading.gradingCost || 0),
                overallQuality: components.orchestration.qualityScore,
                studentProgress: await this.getStudentProgressSummary()
            }
        };
        
        // Save JSON package
        const packagePath = path.join(this.config.outputDirectory, `workflow-${workflowId}.json`);
        await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
        
        // Create ZIP if enabled
        let zipPath = null;
        if (this.config.enableZipPackaging) {
            zipPath = await this.createZipPackage(workflowId, packageData);
        }
        
        console.log(`📦 Package created: ${packagePath}`);
        if (zipPath) {
            console.log(`🗜️  ZIP archive: ${zipPath}`);
        }
        
        return {
            packagePath,
            zipPath,
            data: packageData
        };
    }
    
    /**
     * Build consultation prompt for specific model perspective
     */
    buildConsultationPrompt(query, perspective) {
        const perspectivePrompts = {
            comprehensive: `Provide a comprehensive, well-sourced analysis of: ${query}

Include:
- Detailed explanation with proper depth
- Multiple authoritative sources (government, academic, professional)
- Current best practices and guidelines
- Proper citations in academic format
- Key facts and supporting evidence`,

            analytical: `Analyze this query with critical thinking: ${query}

Focus on:
- Logical structure and reasoning
- Evidence evaluation
- Multiple perspectives
- Potential limitations or gaps
- Analytical conclusions`,

            research: `Research and provide current, factual information about: ${query}

Requirements:
- Use latest available data and sources
- Include government and institutional sources
- Fact-check information accuracy
- Provide proper citations
- Focus on verifiable information`,

            technical: `Provide technical analysis and insights for: ${query}

Include:
- Technical mechanisms and processes
- Implementation details
- Best practices and standards
- Technical accuracy and precision
- Expert-level depth`
        };
        
        return perspectivePrompts[perspective] || perspectivePrompts.comprehensive;
    }
    
    /**
     * Aggregate consultation results from multiple models
     */
    aggregateConsultationResults(responses) {
        // Extract all sources
        const allSources = responses.flatMap(r => r.sources || []);
        
        // Extract all citations
        const allCitations = responses.flatMap(r => r.citations || []);
        
        // Combine content intelligently
        const combinedContent = this.intelligentContentAggregation(responses);
        
        // Calculate confidence based on agreement
        const confidence = this.calculateConsensusConfidence(responses);
        
        return {
            content: combinedContent,
            sources: this.deduplicateSources(allSources),
            citations: this.deduplicateCitations(allCitations),
            confidence,
            modelCount: responses.length,
            consensusLevel: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low'
        };
    }
    
    /**
     * Intelligent content aggregation from multiple AI responses
     */
    intelligentContentAggregation(responses) {
        // For now, simple concatenation with model attribution
        let aggregated = '';
        
        for (const [index, response] of responses.entries()) {
            const modelName = `${response.service}/${response.model}`;
            aggregated += `\n## Perspective ${index + 1}: ${modelName}\n\n`;
            aggregated += response.response;
            aggregated += '\n\n---\n';
        }
        
        return aggregated;
    }
    
    /**
     * Calculate consensus confidence from multiple responses
     */
    calculateConsensusConfidence(responses) {
        if (responses.length < 2) return 0.5;
        
        // Simple similarity-based confidence (would be enhanced with actual similarity analysis)
        const avgLength = responses.reduce((sum, r) => sum + r.response.length, 0) / responses.length;
        const lengthVariance = responses.reduce((sum, r) => 
            sum + Math.pow(r.response.length - avgLength, 2), 0) / responses.length;
        
        // Lower variance = higher confidence
        const lengthConfidence = Math.max(0, 1 - (lengthVariance / (avgLength * avgLength)));
        
        // Source agreement confidence
        const uniqueSources = new Set(responses.flatMap(r => r.sources?.map(s => s.url) || []));
        const totalSources = responses.reduce((sum, r) => sum + (r.sources?.length || 0), 0);
        const sourceConfidence = totalSources > 0 ? uniqueSources.size / totalSources : 0.5;
        
        return (lengthConfidence * 0.7 + sourceConfidence * 0.3);
    }
    
    /**
     * Get orchestration pipeline for content type
     */
    getOrchestrationPipeline(contentType) {
        const pipelines = {
            medical_chapter: {
                name: 'Medical Chapter Pipeline',
                stages: [
                    { model: 'ollama/mistral', task: 'medical_analysis', temperature: 0.3 },
                    { model: 'ollama/llama2', task: 'academic_structuring', temperature: 0.5 },
                    { model: 'ollama/mistral', task: 'clarity_refinement', temperature: 0.4 }
                ]
            },
            research_paper: {
                name: 'Research Paper Pipeline',
                stages: [
                    { model: 'ollama/llama2', task: 'research_analysis', temperature: 0.4 },
                    { model: 'ollama/codellama', task: 'methodology_review', temperature: 0.3 },
                    { model: 'ollama/mistral', task: 'academic_polish', temperature: 0.5 }
                ]
            },
            technical_report: {
                name: 'Technical Report Pipeline',
                stages: [
                    { model: 'ollama/codellama', task: 'technical_analysis', temperature: 0.2 },
                    { model: 'ollama/mistral', task: 'technical_writing', temperature: 0.4 },
                    { model: 'ollama/llama2', task: 'documentation_standards', temperature: 0.5 }
                ]
            }
        };
        
        return pipelines[contentType] || pipelines.research_paper;
    }
    
    /**
     * Build stage-specific prompt for orchestration
     */
    buildStagePrompt(stage, content, consultation) {
        const basePrompt = `
TASK: ${stage.task}
ORIGINAL QUERY: "${consultation.query}"
CONSULTATION CONFIDENCE: ${(consultation.aggregated.confidence * 100).toFixed(1)}%

CONTENT TO PROCESS:
${content}

STAGE INSTRUCTIONS:
        `;
        
        const stageInstructions = {
            medical_analysis: `
Analyze this medical content for accuracy and completeness:
- Verify medical facts and terminology
- Ensure proper clinical context
- Add missing medical details if needed
- Structure for medical education
- Maintain clinical accuracy`,

            academic_structuring: `
Structure this content for academic presentation:
- Create proper section hierarchy
- Add academic transitions
- Ensure logical flow
- Format for readability
- Add topic sentences and conclusions`,

            clarity_refinement: `
Refine this content for maximum clarity:
- Simplify complex sentences
- Improve word choice
- Enhance readability
- Fix grammar and style
- Maintain academic tone`,

            research_analysis: `
Analyze this research content for academic rigor:
- Evaluate evidence quality
- Check logical reasoning
- Identify gaps or weaknesses
- Suggest improvements
- Ensure research standards`,

            technical_analysis: `
Review this technical content for accuracy:
- Verify technical details
- Check implementation feasibility
- Ensure best practices
- Add technical depth
- Maintain precision`
        };
        
        return basePrompt + (stageInstructions[stage.task] || stageInstructions.clarity_refinement);
    }
    
    /**
     * Detect content type from query
     */
    detectContentType(query) {
        const patterns = {
            medical_chapter: /medical|disease|treatment|pathophysiology|clinical|diagnosis/i,
            research_paper: /research|study|analysis|investigation|review/i,
            technical_report: /technical|system|implementation|architecture|design/i
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(query)) {
                return type;
            }
        }
        
        return 'research_paper'; // Default
    }
    
    /**
     * Get document formatter for content type
     */
    getDocumentFormatter(contentType) {
        // Simplified formatter - in real implementation would load actual formatter classes
        return {
            format: async (content, options) => {
                const title = this.extractTitleFromContent(content);
                
                // Basic academic document structure
                const markdown = this.formatAsAcademicMarkdown(content, title, options);
                const html = this.formatAsAcademicHTML(content, title, options);
                
                return {
                    title,
                    markdown,
                    html,
                    wordCount: content.split(/\s+/).length,
                    citations: this.extractCitationsFromContent(content)
                };
            }
        };
    }
    
    /**
     * Format content as academic markdown
     */
    formatAsAcademicMarkdown(content, title, options) {
        const citationStyle = options.citationStyle || 'apa';
        const date = new Date().toLocaleDateString();
        
        return `# ${title}

**Authors:** AI Academic System, CalCompare Consultation Engine
**Date:** ${date}
**Citation Style:** ${citationStyle.toUpperCase()}

## Abstract

This document presents a comprehensive analysis based on multi-model AI consultation and internal processing pipeline.

${content}

## References

${this.formatReferences(this.extractCitationsFromContent(content), citationStyle)}

---
*Generated by End-to-End Academic Pipeline*
*Consultation → Orchestration → Formatting → Grading*
        `;
    }
    
    /**
     * Format content as academic HTML
     */
    formatAsAcademicHTML(content, title, options) {
        const markdown = this.formatAsAcademicMarkdown(content, title, options);
        
        // Basic markdown to HTML conversion
        return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
        h2 { color: #34495e; margin-top: 30px; }
        p { line-height: 1.6; margin-bottom: 15px; }
        .abstract { font-style: italic; background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; }
        .references { margin-top: 40px; }
    </style>
</head>
<body>
    ${this.markdownToHTML(markdown)}
</body>
</html>`;
    }
    
    /**
     * Store consultation in database
     */
    async storeConsultation(query, batchResult, aggregated) {
        const query_sql = `
            INSERT INTO consultations (
                query, domain, models_consulted, raw_responses,
                aggregated_response, sources, citations, confidence,
                total_cost, duration_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `;
        
        const domain = this.detectDomain(query);
        const modelsUsed = batchResult.successful.map(r => `${r.service}/${r.model}`);
        const rawResponses = Object.fromEntries(
            batchResult.successful.map(r => [`${r.service}/${r.model}`, r.response])
        );
        
        const values = [
            query,
            domain,
            JSON.stringify(modelsUsed),
            JSON.stringify(rawResponses),
            JSON.stringify(aggregated),
            JSON.stringify(aggregated.sources),
            JSON.stringify(aggregated.citations),
            aggregated.confidence,
            batchResult.totalCost,
            batchResult.totalDuration
        ];
        
        const result = await this.db.query(query_sql, values);
        return result.rows[0].id;
    }
    
    /**
     * Store orchestration results
     */
    async storeOrchestration(consultationId, orchestrationData) {
        const query = `
            INSERT INTO orchestrations (
                consultation_id, content_type, pipeline_name,
                stages_completed, models_used, quality_score,
                meets_standards, processed_content, duration_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;
        
        const values = [
            consultationId,
            orchestrationData.contentType,
            orchestrationData.pipeline,
            JSON.stringify(orchestrationData.stages),
            JSON.stringify(orchestrationData.stages.map(s => s.model)),
            orchestrationData.qualityScore,
            orchestrationData.qualityScore >= 0.8,
            JSON.stringify({ content: orchestrationData.finalContent }),
            orchestrationData.duration || 0
        ];
        
        const result = await this.db.query(query, values);
        return result.rows[0].id;
    }
    
    /**
     * Store academic document
     */
    async storeAcademicDocument(orchestrationId, documentData) {
        const query = `
            INSERT INTO academic_documents (
                orchestration_id, title, authors, document_type,
                citation_style, word_count, citation_count,
                export_formats, file_paths
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;
        
        const values = [
            orchestrationId,
            documentData.title,
            JSON.stringify(['AI Academic System', 'CalCompare Engine']),
            documentData.type,
            documentData.citationStyle,
            documentData.wordCount,
            documentData.citationCount,
            JSON.stringify(['markdown', 'html']),
            JSON.stringify(documentData.filePaths)
        ];
        
        const result = await this.db.query(query, values);
        return result.rows[0].id;
    }
    
    /**
     * Create ZIP package with all outputs
     */
    async createZipPackage(workflowId, packageData) {
        const archiver = require('archiver');
        const zipPath = path.join(this.config.outputDirectory, `workflow-${workflowId}.zip`);
        
        return new Promise(async (resolve, reject) => {
            const output = require('fs').createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => {
                console.log(`🗜️  ZIP created: ${archive.pointer()} bytes`);
                resolve(zipPath);
            });
            
            archive.on('error', reject);
            archive.pipe(output);
            
            // Add all document files
            if (packageData.document.filePaths) {
                for (const [format, filePath] of Object.entries(packageData.document.filePaths)) {
                    const fileName = path.basename(filePath);
                    archive.file(filePath, { name: `documents/${fileName}` });
                }
            }
            
            // Add JSON metadata
            archive.append(JSON.stringify(packageData, null, 2), { name: 'workflow-metadata.json' });
            
            // Add grading report
            const gradingReport = await this.gradingSystem.generateGradingReport(packageData.document.id);
            archive.append(gradingReport, { name: 'grading-report.md' });
            
            archive.finalize();
        });
    }
    
    /**
     * Get student progress summary
     */
    async getStudentProgressSummary() {
        const query = `
            SELECT 
                COUNT(*) as total_submissions,
                AVG(cg.overall_grade) as avg_grade,
                COUNT(CASE WHEN cg.pass_fail = 'PASS' THEN 1 END) as passed,
                MAX(sp.streak_count) as best_streak
            FROM student_progress sp
            JOIN cal_gradings cg ON sp.grading_id = cg.id
            WHERE sp.student_id = $1
        `;
        
        const result = await this.db.query(query, [this.config.studentId]);
        const stats = result.rows[0];
        
        return {
            totalSubmissions: parseInt(stats.total_submissions) || 0,
            averageGrade: parseFloat(stats.avg_grade) || 0,
            passedCount: parseInt(stats.passed) || 0,
            bestStreak: parseInt(stats.best_streak) || 0,
            passRate: stats.total_submissions > 0 ? 
                (stats.passed / stats.total_submissions * 100).toFixed(1) + '%' : '0%'
        };
    }
    
    /**
     * Utility methods
     */
    detectDomain(query) {
        if (/medical|health|disease|treatment|clinical/i.test(query)) return 'medical';
        if (/technical|system|code|engineering/i.test(query)) return 'technical';
        if (/research|study|analysis/i.test(query)) return 'research';
        return 'general';
    }
    
    generateFileName(title) {
        return title
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }
    
    extractTitleFromContent(content) {
        const lines = content.split('\n');
        const firstLine = lines.find(line => line.trim().length > 0);
        
        if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
            return firstLine.replace(/^#+\s*/, '').trim();
        }
        
        return 'Academic Analysis Document';
    }
    
    extractCitationsFromContent(content) {
        // Basic citation extraction
        const citations = [];
        const citationPatterns = [
            /\([A-Za-z\s]+,\s*\d{4}\)/g,
            /\[[0-9]+\]/g,
            /[A-Za-z\s]+ et al\.,? \d{4}/g
        ];
        
        for (const pattern of citationPatterns) {
            const matches = content.match(pattern) || [];
            citations.push(...matches.map(m => ({ text: m, type: 'inline' })));
        }
        
        return citations;
    }
    
    markdownToHTML(markdown) {
        // Basic markdown to HTML (would use proper library in production)
        return markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '');
    }
    
    deduplicateSources(sources) {
        const seen = new Set();
        return sources.filter(source => {
            const key = source.url || source.title || JSON.stringify(source);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    
    deduplicateCitations(citations) {
        const seen = new Set();
        return citations.filter(citation => {
            const key = citation.text || JSON.stringify(citation);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    
    formatReferences(citations, style) {
        // Basic reference formatting
        return citations.map((citation, index) => {
            return `${index + 1}. ${citation.text}`;
        }).join('\n');
    }
    
    async assessOrchestrationQuality(content, consultation) {
        // Simple quality assessment (would be more sophisticated in production)
        const wordCount = content.split(/\s+/).length;
        const hasStructure = content.includes('##') || content.includes('#');
        const hasCitations = /\([A-Za-z\s]+,\s*\d{4}\)|\[[0-9]+\]/.test(content);
        
        let quality = 0.6; // Base quality
        
        if (wordCount > 500) quality += 0.1;
        if (wordCount > 1000) quality += 0.1;
        if (hasStructure) quality += 0.1;
        if (hasCitations) quality += 0.1;
        
        return Math.min(quality, 1.0);
    }
    
    async recordWorkflowCompletion(workflowId, data) {
        // Store workflow completion for analytics
        console.log(`📊 Recording workflow completion: ${workflowId}`);
    }
    
    async recordWorkflowFailure(workflowId, query, error) {
        // Store workflow failure for debugging
        console.log(`📊 Recording workflow failure: ${workflowId} - ${error.message}`);
    }
}

module.exports = EndToEndAcademicPipeline;

// CLI interface
if (require.main === module) {
    const pipeline = new EndToEndAcademicPipeline({
        outputDirectory: './academic-output',
        studentId: 'demo-student-001'
    });
    
    // Demo workflow
    setTimeout(async () => {
        console.log('\n🧪 Testing Complete Academic Pipeline\n');
        
        try {
            const testQuery = "Explain the pathophysiology of Type 2 diabetes mellitus";
            
            console.log(`🔄 Processing: "${testQuery}"`);
            
            const result = await pipeline.processQuery(testQuery, {
                citationStyle: 'ama' // Medical style for medical query
            });
            
            console.log('\n🎉 COMPLETE PIPELINE SUCCESS!');
            console.log('================================');
            console.log(`📄 Document: ${result.document.title}`);
            console.log(`🎓 Grade: ${result.grading.grade} (${result.grading.passFail})`);
            console.log(`💰 Total Cost: $${result.metrics.consultationCost.toFixed(4)}`);
            console.log(`⏱️  Duration: ${result.metrics.totalDuration}ms`);
            console.log(`📦 Package: ${result.package.packagePath}`);
            
            if (result.package.zipPath) {
                console.log(`🗜️  ZIP: ${result.package.zipPath}`);
            }
            
            console.log('\n📊 Quality Metrics:');
            console.log(`Consultation Confidence: ${(result.package.data.consultation.confidence * 100).toFixed(1)}%`);
            console.log(`Orchestration Quality: ${(result.metrics.overallQuality * 100).toFixed(1)}%`);
            console.log(`Cal's Grade: ${(result.grading.numericGrade * 100).toFixed(1)}%`);
            
            console.log('\n✨ The system is working exactly as you envisioned!');
            console.log('   CalCompare → Ollama → Academic Docs → Cal Grading → Database');
            
        } catch (error) {
            console.error('❌ Pipeline test failed:', error.message);
            console.log('\n💡 Common issues:');
            console.log('   - Make sure PostgreSQL is running');
            console.log('   - Add API keys to .env file');
            console.log('   - Start Ollama: ollama serve');
            console.log('   - Run: npm install archiver pg');
        }
        
    }, 1000);
}
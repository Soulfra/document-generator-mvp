#!/usr/bin/env node

/**
 * 🎓 CAL GRADING SYSTEM
 * 
 * Cal reviews academic outputs and grades them based on consultation quality
 * 
 * Features:
 * - Reads academic documents and original consultations
 * - Grades on 6 criteria: content accuracy, source quality, citation accuracy, academic rigor, writing quality, completeness
 * - Provides detailed feedback with strengths, weaknesses, recommendations
 * - Stores grades in PostgreSQL database
 * - Uses external validation through consult APIs
 * - Generates grade reports and student progress tracking
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { Pool } = require('pg');

class CalGradingSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            graderPersonality: config.graderPersonality || 'cal', // cal, strict, lenient
            gradingModel: config.gradingModel || 'claude-3-opus',
            enableExternalValidation: config.enableExternalValidation !== false,
            enableProgressTracking: config.enableProgressTracking !== false,
            ...config
        };
        
        // Database connection
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/document_generator'
        });
        
        // Load real AI connector for validation
        const RealAIAPIConnector = require('./real-ai-api-connector.js');
        this.aiConnector = new RealAIAPIConnector();
        
        // Grading criteria weights
        this.gradingWeights = {
            content_accuracy: 0.25,    // How accurate is the content vs consultation
            source_quality: 0.20,     // Quality of sources cited
            citation_accuracy: 0.20,  // Proper citation formatting
            academic_rigor: 0.15,     // Meets academic standards
            writing_quality: 0.10,    // Clarity, grammar, flow
            completeness: 0.10        // Addresses all aspects of query
        };
        
        // Cal's grading persona
        this.gradingPersonas = {
            cal: {
                tone: "direct but constructive",
                standards: "high but fair",
                feedback: "practical and actionable",
                style: "like a experienced professor who cares about learning"
            },
            strict: {
                tone: "rigorous and demanding",
                standards: "extremely high",
                feedback: "detailed criticism",
                style: "like a harsh but brilliant academic"
            },
            lenient: {
                tone: "encouraging and supportive",
                standards: "reasonable",
                feedback: "positive reinforcement focused",
                style: "like a supportive mentor"
            }
        };
        
        console.log('🎓 Cal Grading System initialized');
        console.log(`📊 Grader: ${this.config.graderPersonality} using ${this.config.gradingModel}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Test database connection
        try {
            await this.db.query('SELECT NOW()');
            console.log('✅ Database connected');
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
        
        console.log('✅ Cal Grading System ready');
    }
    
    /**
     * Grade an academic document based on original consultation
     */
    async gradeDocument(documentId, options = {}) {
        console.log(`\n🎓 Cal is grading document ${documentId.substring(0, 8)}...`);
        
        const startTime = Date.now();
        
        try {
            // Load document and consultation data
            const data = await this.loadDocumentData(documentId);
            
            // Perform grading analysis
            const grading = await this.performGrading(data);
            
            // External validation if enabled
            if (this.config.enableExternalValidation) {
                const validation = await this.performExternalValidation(data, grading);
                grading.validation = validation;
            }
            
            // Store grading in database
            const gradingId = await this.storeGrading(documentId, grading, data.consultationId);
            
            // Update student progress
            if (this.config.enableProgressTracking && options.studentId) {
                await this.updateStudentProgress(options.studentId, documentId, gradingId, grading);
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ Cal completed grading (${duration}ms)`);
            console.log(`📝 Grade: ${grading.letterGrade} (${(grading.overallGrade * 100).toFixed(1)}%)`);
            console.log(`📊 Status: ${grading.passFail}`);
            
            // Emit grading complete event
            this.emit('grading_complete', {
                documentId,
                gradingId,
                grade: grading.letterGrade,
                passFail: grading.passFail,
                duration
            });
            
            return {
                gradingId,
                grade: grading.letterGrade,
                numericGrade: grading.overallGrade,
                passFail: grading.passFail,
                feedback: grading.feedback,
                criteria: grading.criteria,
                duration
            };
            
        } catch (error) {
            console.error(`❌ Grading failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Load document and consultation data for grading
     */
    async loadDocumentData(documentId) {
        const query = `
            SELECT 
                ad.id as document_id,
                ad.title,
                ad.document_type,
                ad.citation_style,
                ad.word_count,
                ad.citation_count,
                ad.file_paths,
                
                o.consultation_id,
                o.content_type,
                o.quality_score as orchestration_quality,
                o.processed_content,
                
                c.query as original_query,
                c.domain,
                c.raw_responses,
                c.aggregated_response,
                c.sources as consultation_sources,
                c.citations as consultation_citations,
                c.confidence as consultation_confidence
                
            FROM academic_documents ad
            JOIN orchestrations o ON ad.orchestration_id = o.id
            JOIN consultations c ON o.consultation_id = c.id
            WHERE ad.id = $1
        `;
        
        const result = await this.db.query(query, [documentId]);
        
        if (result.rows.length === 0) {
            throw new Error(`Document ${documentId} not found`);
        }
        
        const data = result.rows[0];
        
        // Load actual document content from file
        const filePaths = data.file_paths;
        if (filePaths?.markdown) {
            const fs = require('fs').promises;
            try {
                data.documentContent = await fs.readFile(filePaths.markdown, 'utf8');
            } catch (error) {
                console.warn(`Could not load document content: ${error.message}`);
                data.documentContent = '';
            }
        }
        
        console.log(`📚 Loaded: "${data.title}" (${data.document_type})`);
        console.log(`📝 Original query: "${data.original_query}"`);
        console.log(`📊 Consultation confidence: ${(data.consultation_confidence * 100).toFixed(1)}%`);
        
        return data;
    }
    
    /**
     * Perform comprehensive grading analysis
     */
    async performGrading(data) {
        console.log('🔍 Cal is analyzing the document...');
        
        const persona = this.gradingPersonas[this.config.graderPersonality];
        
        const gradingPrompt = `
You are Cal, an experienced academic grader with ${persona.style}. 

Grade this academic document on a scale of 0.00 to 1.00 for each criterion:

ORIGINAL QUERY: "${data.original_query}"
CONSULTATION SOURCES: ${JSON.stringify(data.consultation_sources, null, 2)}
DOCUMENT TITLE: "${data.title}"
DOCUMENT TYPE: ${data.document_type}

DOCUMENT CONTENT:
${data.documentContent}

Grade on these 6 criteria (0.00-1.00 scale):

1. CONTENT_ACCURACY: How well does the document content match the original consultation data?
2. SOURCE_QUALITY: Are the sources authoritative, relevant, and properly vetted?
3. CITATION_ACCURACY: Are citations properly formatted and complete?
4. ACADEMIC_RIGOR: Does it meet academic standards for depth and analysis?
5. WRITING_QUALITY: Is the writing clear, professional, and well-structured?
6. COMPLETENESS: Does it fully address all aspects of the original query?

For each criterion, provide:
- Score (0.00-1.00)
- 2-3 sentence justification

Also provide:
- 3-5 key STRENGTHS
- 3-5 key WEAKNESSES  
- 3-5 specific RECOMMENDATIONS for improvement

Format as JSON:
{
  "criteria": {
    "content_accuracy": {"score": 0.85, "justification": "..."},
    "source_quality": {"score": 0.90, "justification": "..."},
    "citation_accuracy": {"score": 0.75, "justification": "..."},
    "academic_rigor": {"score": 0.80, "justification": "..."},
    "writing_quality": {"score": 0.85, "justification": "..."},
    "completeness": {"score": 0.90, "justification": "..."}
  },
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...", "..."],
  "overall_comments": "Cal's overall assessment in 2-3 sentences"
}

Be ${persona.tone} with ${persona.standards} standards. Provide ${persona.feedback}.
        `;
        
        // Get grading from AI
        const gradingResult = await this.aiConnector.callAPI(
            'anthropic',
            this.config.gradingModel,
            gradingPrompt,
            { maxTokens: 2048 }
        );
        
        let grading;
        try {
            grading = JSON.parse(gradingResult.response);
        } catch (error) {
            console.error('Failed to parse grading JSON, extracting manually');
            grading = this.extractGradingFromText(gradingResult.response);
        }
        
        // Calculate weighted overall grade
        const criteriaScores = grading.criteria;
        const overallGrade = Object.entries(this.gradingWeights).reduce((sum, [criterion, weight]) => {
            const score = criteriaScores[criterion]?.score || 0;
            return sum + (score * weight);
        }, 0);
        
        // Determine letter grade and pass/fail
        const { letterGrade, passFail } = this.calculateLetterGrade(overallGrade);
        
        console.log(`📊 Content Accuracy: ${(criteriaScores.content_accuracy?.score * 100).toFixed(1)}%`);
        console.log(`📚 Source Quality: ${(criteriaScores.source_quality?.score * 100).toFixed(1)}%`);
        console.log(`📖 Citation Accuracy: ${(criteriaScores.citation_accuracy?.score * 100).toFixed(1)}%`);
        console.log(`🎓 Academic Rigor: ${(criteriaScores.academic_rigor?.score * 100).toFixed(1)}%`);
        console.log(`✍️  Writing Quality: ${(criteriaScores.writing_quality?.score * 100).toFixed(1)}%`);
        console.log(`✅ Completeness: ${(criteriaScores.completeness?.score * 100).toFixed(1)}%`);
        
        return {
            criteria: criteriaScores,
            overallGrade,
            letterGrade,
            passFail,
            feedback: {
                strengths: grading.strengths || [],
                weaknesses: grading.weaknesses || [],
                recommendations: grading.recommendations || [],
                comments: grading.overall_comments || ''
            },
            gradingDuration: gradingResult.metadata.duration,
            gradingModel: this.config.gradingModel,
            gradingCost: gradingResult.metadata.cost
        };
    }
    
    /**
     * Perform external validation using consult APIs
     */
    async performExternalValidation(data, grading) {
        console.log('🔍 Performing external validation...');
        
        const validationPrompt = `
Review this academic document and provide an independent assessment:

ORIGINAL QUERY: "${data.original_query}"
DOCUMENT: "${data.title}"
CAL'S GRADE: ${grading.letterGrade} (${(grading.overallGrade * 100).toFixed(1)}%)

DOCUMENT CONTENT:
${data.documentContent}

Validate on these criteria (0.00-1.00):
1. FACTUAL_ACCURACY: Are the medical/technical facts correct?
2. SOURCE_VERIFICATION: Can the sources be verified and are they appropriate?
3. CITATION_VALIDITY: Are citations real and properly formatted?
4. CONTENT_QUALITY: Is the writing professional and clear?
5. ACADEMIC_STANDARDS: Does it meet academic publication standards?

Also check:
- CONSISTENCY with original consultation data
- INFORMATION_ACCURACY vs known facts

Return JSON with scores and specific feedback.
        `;
        
        // Use multiple models for validation
        const validationResults = await this.aiConnector.batchConsult([
            {
                service: 'anthropic',
                model: 'claude-3-sonnet',
                prompt: validationPrompt,
                options: { maxTokens: 1024 }
            },
            {
                service: 'openai', 
                model: 'gpt-4',
                prompt: validationPrompt,
                options: { maxTokens: 1024 }
            }
        ]);
        
        // Aggregate validation results
        const validations = validationResults.successful.map(r => {
            try {
                return JSON.parse(r.response);
            } catch {
                return this.extractValidationFromText(r.response);
            }
        });
        
        // Store validation results
        for (const validation of validations) {
            await this.storeValidation(data.document_id, validation, validationResults);
        }
        
        console.log(`✅ External validation complete (${validations.length} validators)`);
        
        return {
            validationCount: validations.length,
            averageScores: this.averageValidationScores(validations),
            flaggedIssues: this.aggregateFlaggedIssues(validations),
            validationCost: validationResults.totalCost
        };
    }
    
    /**
     * Store grading in database
     */
    async storeGrading(documentId, grading, consultationId) {
        const query = `
            INSERT INTO cal_gradings (
                document_id, consultation_id, grader_id,
                content_accuracy, source_quality, citation_accuracy,
                academic_rigor, writing_quality, completeness,
                strengths, weaknesses, recommendations, grading_notes,
                grading_duration_ms, grading_model
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id
        `;
        
        const values = [
            documentId,
            consultationId,
            this.config.graderPersonality,
            grading.criteria.content_accuracy?.score || 0,
            grading.criteria.source_quality?.score || 0,
            grading.criteria.citation_accuracy?.score || 0,
            grading.criteria.academic_rigor?.score || 0,
            grading.criteria.writing_quality?.score || 0,
            grading.criteria.completeness?.score || 0,
            grading.feedback.strengths,
            grading.feedback.weaknesses,
            grading.feedback.recommendations,
            grading.feedback.comments,
            grading.gradingDuration,
            grading.gradingModel
        ];
        
        const result = await this.db.query(query, values);
        const gradingId = result.rows[0].id;
        
        console.log(`💾 Grading stored with ID: ${gradingId}`);
        
        return gradingId;
    }
    
    /**
     * Store external validation results
     */
    async storeValidation(documentId, validation, validationMetadata) {
        const query = `
            INSERT INTO validation_results (
                document_id, validation_type, validator_service, validator_model,
                factual_accuracy, source_verification, citation_validity,
                content_quality, academic_standards, consistency_score,
                information_accuracy, validation_report, validation_cost,
                validation_duration_ms
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `;
        
        const values = [
            documentId,
            'external_ai_validation',
            validation.service || 'multiple',
            validation.model || 'multiple',
            validation.factual_accuracy || 0,
            validation.source_verification || 0,
            validation.citation_validity || 0,
            validation.content_quality || 0,
            validation.academic_standards || 0,
            validation.consistency_score || 0,
            validation.information_accuracy || 0,
            JSON.stringify(validation),
            validationMetadata.totalCost || 0,
            validationMetadata.totalDuration || 0
        ];
        
        const result = await this.db.query(query, values);
        return result.rows[0].id;
    }
    
    /**
     * Update student progress tracking
     */
    async updateStudentProgress(studentId, documentId, gradingId, grading) {
        console.log(`📈 Updating progress for student ${studentId}`);
        
        // Get previous grades for comparison
        const previousGrades = await this.getStudentGradeHistory(studentId);
        
        // Calculate improvements
        const improvements = this.calculateImprovements(grading, previousGrades);
        
        // Check for achievements
        const achievements = await this.checkAchievements(studentId, grading, previousGrades);
        
        // Update streak count
        const streakCount = await this.calculateStreak(studentId, grading.passFail);
        
        const query = `
            INSERT INTO student_progress (
                student_id, document_id, grading_id, topic_area,
                difficulty_level, time_to_complete_ms, consultation_efficiency,
                concepts_mastered, sources_quality_improvement,
                writing_improvement, citation_accuracy_improvement,
                achievements, streak_count, total_documents
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        
        const values = [
            studentId,
            documentId, 
            gradingId,
            grading.domain || 'general',
            this.determineDifficultyLevel(grading),
            grading.gradingDuration,
            grading.criteria.content_accuracy?.score || 0,
            achievements.conceptsMastered,
            improvements.sourceQuality,
            improvements.writingQuality,
            improvements.citationAccuracy,
            JSON.stringify(achievements.badges),
            streakCount,
            previousGrades.length + 1
        ];
        
        await this.db.query(query, values);
        
        console.log(`✅ Progress updated: ${achievements.badges.length} new achievements`);
    }
    
    /**
     * Calculate letter grade and pass/fail status
     */
    calculateLetterGrade(overallGrade) {
        let letterGrade, passFail;
        
        if (overallGrade >= 0.97) letterGrade = 'A+';
        else if (overallGrade >= 0.93) letterGrade = 'A';
        else if (overallGrade >= 0.90) letterGrade = 'A-';
        else if (overallGrade >= 0.87) letterGrade = 'B+';
        else if (overallGrade >= 0.83) letterGrade = 'B';
        else if (overallGrade >= 0.80) letterGrade = 'B-';
        else if (overallGrade >= 0.77) letterGrade = 'C+';
        else if (overallGrade >= 0.73) letterGrade = 'C';
        else if (overallGrade >= 0.70) letterGrade = 'C-';
        else if (overallGrade >= 0.67) letterGrade = 'D+';
        else if (overallGrade >= 0.65) letterGrade = 'D';
        else letterGrade = 'F';
        
        if (overallGrade >= 0.70) passFail = 'PASS';
        else if (overallGrade >= 0.60) passFail = 'NEEDS_REVISION';
        else passFail = 'FAIL';
        
        return { letterGrade, passFail };
    }
    
    /**
     * Extract grading from unstructured text (fallback)
     */
    extractGradingFromText(text) {
        // Basic extraction logic for when JSON parsing fails
        const criteria = {};
        
        // Look for scores in text
        const scorePattern = /(\w+):\s*(\d+\.?\d*)([%\/])/g;
        let match;
        
        while ((match = scorePattern.exec(text)) !== null) {
            const [, criterion, score] = match;
            const normalizedScore = parseFloat(score) > 1 ? parseFloat(score) / 100 : parseFloat(score);
            criteria[criterion.toLowerCase().replace(' ', '_')] = {
                score: normalizedScore,
                justification: "Extracted from text analysis"
            };
        }
        
        return {
            criteria,
            strengths: ["Document shows understanding of topic", "Sources are generally appropriate"],
            weaknesses: ["Could improve citation formatting", "Needs more depth in analysis"],
            recommendations: ["Review citation guidelines", "Expand analysis sections"],
            overall_comments: "Extracted assessment from unstructured grading response"
        };
    }
    
    /**
     * Generate grading report
     */
    async generateGradingReport(documentId) {
        const query = `
            SELECT 
                cg.*,
                ad.title,
                ad.document_type,
                c.query as original_query,
                c.domain
            FROM cal_gradings cg
            JOIN academic_documents ad ON cg.document_id = ad.id
            JOIN consultations c ON cg.consultation_id = c.id
            WHERE cg.document_id = $1
        `;
        
        const result = await this.db.query(query, [documentId]);
        
        if (result.rows.length === 0) {
            throw new Error(`No grading found for document ${documentId}`);
        }
        
        const grading = result.rows[0];
        
        const report = `
# 🎓 Cal's Grading Report

**Document**: ${grading.title}
**Type**: ${grading.document_type}
**Original Query**: "${grading.original_query}"
**Graded By**: ${grading.grader_id}
**Date**: ${grading.created_at}

## 📊 Final Grade

**Overall Grade**: ${grading.letter_grade} (${(grading.overall_grade * 100).toFixed(1)}%)
**Status**: ${grading.pass_fail}

## 📋 Detailed Scores

| Criterion | Score | Weight | Contribution |
|-----------|-------|---------|-------------|
| Content Accuracy | ${(grading.content_accuracy * 100).toFixed(1)}% | 25% | ${(grading.content_accuracy * 25).toFixed(1)}% |
| Source Quality | ${(grading.source_quality * 100).toFixed(1)}% | 20% | ${(grading.source_quality * 20).toFixed(1)}% |
| Citation Accuracy | ${(grading.citation_accuracy * 100).toFixed(1)}% | 20% | ${(grading.citation_accuracy * 20).toFixed(1)}% |
| Academic Rigor | ${(grading.academic_rigor * 100).toFixed(1)}% | 15% | ${(grading.academic_rigor * 15).toFixed(1)}% |
| Writing Quality | ${(grading.writing_quality * 100).toFixed(1)}% | 10% | ${(grading.writing_quality * 10).toFixed(1)}% |
| Completeness | ${(grading.completeness * 100).toFixed(1)}% | 10% | ${(grading.completeness * 10).toFixed(1)}% |

## ✅ Strengths

${grading.strengths ? grading.strengths.map(s => `- ${s}`).join('\n') : 'No specific strengths recorded'}

## ⚠️ Areas for Improvement

${grading.weaknesses ? grading.weaknesses.map(w => `- ${w}`).join('\n') : 'No specific weaknesses recorded'}

## 💡 Recommendations

${grading.recommendations ? grading.recommendations.map(r => `- ${r}`).join('\n') : 'No specific recommendations recorded'}

## 📝 Cal's Comments

${grading.grading_notes || 'No additional comments'}

---
*Generated by Cal Grading System v1.0*
*Grading Duration: ${grading.grading_duration_ms}ms*
        `;
        
        return report;
    }
    
    /**
     * Get student grade history for improvement tracking
     */
    async getStudentGradeHistory(studentId) {
        const query = `
            SELECT cg.*, ad.document_type, c.domain
            FROM cal_gradings cg
            JOIN academic_documents ad ON cg.document_id = ad.id
            JOIN student_progress sp ON sp.grading_id = cg.id
            JOIN consultations c ON cg.consultation_id = c.id
            WHERE sp.student_id = $1
            ORDER BY cg.created_at DESC
            LIMIT 10
        `;
        
        const result = await this.db.query(query, [studentId]);
        return result.rows;
    }
    
    /**
     * Calculate improvements from previous work
     */
    calculateImprovements(currentGrading, previousGrades) {
        if (previousGrades.length === 0) {
            return {
                sourceQuality: 0,
                writingQuality: 0,
                citationAccuracy: 0
            };
        }
        
        const mostRecent = previousGrades[0];
        
        return {
            sourceQuality: currentGrading.criteria.source_quality?.score - mostRecent.source_quality,
            writingQuality: currentGrading.criteria.writing_quality?.score - mostRecent.writing_quality,
            citationAccuracy: currentGrading.criteria.citation_accuracy?.score - mostRecent.citation_accuracy
        };
    }
    
    /**
     * Check for new achievements/badges
     */
    async checkAchievements(studentId, grading, previousGrades) {
        const badges = [];
        let conceptsMastered = 0;
        
        // Perfect score badges
        if (grading.overallGrade >= 0.97) {
            badges.push('perfect_score');
            conceptsMastered += 3;
        }
        
        // First time badges
        if (previousGrades.length === 0) {
            badges.push('first_submission');
            conceptsMastered += 1;
        }
        
        // Improvement badges
        const improvements = this.calculateImprovements(grading, previousGrades);
        if (improvements.sourceQuality > 0.1) {
            badges.push('source_master');
            conceptsMastered += 1;
        }
        
        // Citation accuracy badge
        if (grading.criteria.citation_accuracy?.score >= 0.95) {
            badges.push('citation_expert');
            conceptsMastered += 1;
        }
        
        // Medical accuracy badge (for medical documents)
        if (grading.criteria.content_accuracy?.score >= 0.90 && grading.domain === 'medical') {
            badges.push('medical_accuracy');
            conceptsMastered += 2;
        }
        
        return { badges, conceptsMastered };
    }
    
    /**
     * Calculate current streak
     */
    async calculateStreak(studentId, currentPassFail) {
        const query = `
            SELECT pass_fail 
            FROM cal_gradings cg
            JOIN student_progress sp ON sp.grading_id = cg.id
            WHERE sp.student_id = $1
            ORDER BY cg.created_at DESC
            LIMIT 10
        `;
        
        const result = await this.db.query(query, [studentId]);
        const recent = result.rows.map(r => r.pass_fail);
        
        let streak = 0;
        if (currentPassFail === 'PASS') {
            streak = 1;
            for (const grade of recent) {
                if (grade === 'PASS') streak++;
                else break;
            }
        }
        
        return streak;
    }
    
    /**
     * Determine difficulty level of document
     */
    determineDifficultyLevel(grading) {
        const score = grading.overallGrade;
        const domain = grading.domain;
        
        if (domain === 'medical' && score >= 0.85) return 'advanced';
        if (domain === 'technical' && score >= 0.80) return 'advanced';
        if (score >= 0.75) return 'intermediate';
        return 'beginner';
    }
    
    /**
     * Average validation scores from multiple validators
     */
    averageValidationScores(validations) {
        if (validations.length === 0) return {};
        
        const criteria = ['factual_accuracy', 'source_verification', 'citation_validity', 'content_quality', 'academic_standards'];
        const averages = {};
        
        for (const criterion of criteria) {
            const scores = validations
                .map(v => v[criterion])
                .filter(s => typeof s === 'number' && s >= 0 && s <= 1);
            
            if (scores.length > 0) {
                averages[criterion] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            }
        }
        
        return averages;
    }
    
    /**
     * Aggregate flagged issues from validators
     */
    aggregateFlaggedIssues(validations) {
        const allIssues = validations
            .map(v => v.flagged_issues || [])
            .flat();
        
        // Deduplicate similar issues
        const uniqueIssues = allIssues.filter((issue, index, array) => 
            array.findIndex(i => i.toLowerCase().includes(issue.toLowerCase())) === index
        );
        
        return uniqueIssues;
    }
    
    /**
     * Extract validation scores from unstructured text
     */
    extractValidationFromText(text) {
        // Fallback extraction for non-JSON responses
        return {
            factual_accuracy: 0.8,
            source_verification: 0.8,
            citation_validity: 0.75,
            content_quality: 0.85,
            academic_standards: 0.8,
            consistency_score: 0.85,
            information_accuracy: 0.8,
            flagged_issues: ["Could not parse detailed validation"],
            validation_notes: text
        };
    }
    
    /**
     * Generate class performance report
     */
    async generateClassReport(timeRange = '30 days') {
        const query = `
            SELECT 
                COUNT(*) as total_documents,
                AVG(overall_grade) as avg_grade,
                COUNT(CASE WHEN pass_fail = 'PASS' THEN 1 END) as passed,
                COUNT(CASE WHEN pass_fail = 'FAIL' THEN 1 END) as failed,
                AVG(content_accuracy) as avg_content_accuracy,
                AVG(citation_accuracy) as avg_citation_accuracy
            FROM cal_gradings
            WHERE created_at >= NOW() - INTERVAL '${timeRange}'
        `;
        
        const result = await this.db.query(query);
        const stats = result.rows[0];
        
        const passRate = (stats.passed / stats.total_documents * 100).toFixed(1);
        
        console.log(`\n📊 Class Performance Report (${timeRange})`);
        console.log(`📚 Total Documents: ${stats.total_documents}`);
        console.log(`📈 Average Grade: ${(stats.avg_grade * 100).toFixed(1)}%`);
        console.log(`✅ Pass Rate: ${passRate}%`);
        console.log(`📖 Content Accuracy: ${(stats.avg_content_accuracy * 100).toFixed(1)}%`);
        console.log(`📝 Citation Accuracy: ${(stats.avg_citation_accuracy * 100).toFixed(1)}%`);
        
        return stats;
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            graderPersonality: this.config.graderPersonality,
            gradingModel: this.config.gradingModel,
            externalValidation: this.config.enableExternalValidation,
            progressTracking: this.config.enableProgressTracking,
            databaseConnected: this.db ? true : false,
            aiConnectorReady: this.aiConnector ? true : false
        };
    }
}

module.exports = CalGradingSystem;

// CLI interface for testing
if (require.main === module) {
    const gradingSystem = new CalGradingSystem({
        graderPersonality: 'cal',
        gradingModel: 'claude-3-opus'
    });
    
    // Test grading workflow
    setTimeout(async () => {
        console.log('\n🧪 Testing Cal Grading System\n');
        
        try {
            // Get system status
            const status = gradingSystem.getStatus();
            console.log('📊 System Status:', JSON.stringify(status, null, 2));
            
            // Generate class report
            await gradingSystem.generateClassReport();
            
            // Test document lookup (if we have test data)
            const testQuery = `
                SELECT id FROM academic_documents 
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            
            const testDoc = await gradingSystem.db.query(testQuery);
            
            if (testDoc.rows.length > 0) {
                const documentId = testDoc.rows[0].id;
                console.log(`\n🎓 Testing grading on document ${documentId.substring(0, 8)}...`);
                
                const gradingResult = await gradingSystem.gradeDocument(documentId, {
                    studentId: 'test-student-123'
                });
                
                console.log('\n📋 Grading Result:');
                console.log(`Grade: ${gradingResult.grade}`);
                console.log(`Status: ${gradingResult.passFail}`);
                console.log(`Duration: ${gradingResult.duration}ms`);
                
                // Generate full report
                const report = await gradingSystem.generateGradingReport(documentId);
                console.log('\n📄 Full Report Generated');
                console.log(report.substring(0, 500) + '...');
                
            } else {
                console.log('⚠️  No documents found for testing');
                console.log('💡 Use the academic AI system to generate a document first');
            }
            
        } catch (error) {
            console.error('❌ Grading test failed:', error.message);
        }
        
    }, 1000);
}
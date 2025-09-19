#!/usr/bin/env node

/**
 * 📋 ARCHITECTURE DECISION RECORD (ADR) GENERATOR
 * 
 * Generates formal Architecture Decision Records from platform validation
 * forum discussions, debates, and binary decisions. Transforms community
 * wisdom into structured documentation.
 * 
 * Features:
 * - Multiple ADR formats (Y-statement, MADR, Nygard)
 * - Automatic extraction from forum debates
 * - Binary decision integration
 * - Consequence tracking
 * - Alternative analysis
 * - Version control integration
 * 
 * "Every decision has a story, every story needs documentation"
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ADRGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // ADR format settings
            format: options.format || 'y-statement', // y-statement, madr, nygard, custom
            includeMetadata: options.includeMetadata !== false,
            includeVotingData: options.includeVotingData !== false,
            includeDebateExcerpts: options.includeDebateExcerpts !== false,
            
            // File generation
            outputDirectory: options.outputDirectory || './decisions',
            fileFormat: options.fileFormat || 'markdown', // markdown, json, yaml
            autoNumber: options.autoNumber !== false,
            
            // Content settings
            includeAlternatives: options.includeAlternatives !== false,
            includeProsAndCons: options.includeProsAndCons !== false,
            includeImplementationNotes: options.includeImplementationNotes !== false,
            maxAlternatives: options.maxAlternatives || 5,
            
            // Binary decision integration
            highlightBinaryDecision: options.highlightBinaryDecision !== false,
            includeFloorDivisionExplanation: options.includeFloorDivisionExplanation !== false,
            
            ...options
        };
        
        // ADR templates for different formats
        this.templates = {
            'y-statement': {
                name: 'Y-Statement Format',
                sections: [
                    'title',
                    'status',
                    'context',
                    'decision',
                    'consequences'
                ],
                template: this.yStatementTemplate
            },
            'madr': {
                name: 'Markdown Architectural Decision Records',
                sections: [
                    'title',
                    'status',
                    'context',
                    'considered_options',
                    'decision_outcome',
                    'pros_and_cons',
                    'links'
                ],
                template: this.madrTemplate
            },
            'nygard': {
                name: 'Michael Nygard Format',
                sections: [
                    'title',
                    'date',
                    'status',
                    'context',
                    'decision',
                    'consequences'
                ],
                template: this.nygardTemplate
            },
            'custom': {
                name: 'Custom Extended Format',
                sections: [
                    'title',
                    'metadata',
                    'executive_summary',
                    'context',
                    'problem_statement',
                    'decision_drivers',
                    'considered_alternatives',
                    'decision_outcome',
                    'binary_decision',
                    'consequences',
                    'implementation_notes',
                    'validation_data',
                    'references'
                ],
                template: this.customTemplate
            }
        };
        
        // Decision status mappings
        this.statusMappings = {
            'APPROVED': 'accepted',
            'REJECTED': 'rejected',
            'CONDITIONAL': 'proposed',
            'NO_QUORUM': 'draft',
            'pending': 'draft',
            'active': 'proposed',
            'completed': 'accepted'
        };
        
        // ADR counter for numbering
        this.adrCounter = 0;
        
        // Generated ADRs storage
        this.generatedADRs = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('📋 ADR Generator initializing...');
        
        // Setup output directory
        await this.setupOutputDirectory();
        
        // Load existing ADR count if auto-numbering
        if (this.config.autoNumber) {
            await this.loadADRCounter();
        }
        
        console.log('✅ ADR Generator ready');
        console.log(`📄 Format: ${this.config.format}`);
        console.log(`📁 Output: ${this.config.outputDirectory}`);
        console.log(`🔢 Current ADR number: ${this.adrCounter}`);
    }
    
    async setupOutputDirectory() {
        try {
            await fs.mkdir(this.config.outputDirectory, { recursive: true });
            
            // Create subdirectories for organization
            const subdirs = ['accepted', 'rejected', 'proposed', 'draft', 'superseded'];
            for (const subdir of subdirs) {
                await fs.mkdir(path.join(this.config.outputDirectory, subdir), { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create output directory:', error);
        }
    }
    
    async loadADRCounter() {
        try {
            const files = await fs.readdir(this.config.outputDirectory);
            const adrFiles = files.filter(f => f.match(/^\d{4}-/));
            
            if (adrFiles.length > 0) {
                const numbers = adrFiles.map(f => parseInt(f.split('-')[0]));
                this.adrCounter = Math.max(...numbers);
            }
        } catch (error) {
            console.warn('Could not load ADR counter:', error.message);
        }
    }
    
    /**
     * Generate ADR from forum review data
     */
    async generateFromReview(reviewData, options = {}) {
        try {
            console.log(`📋 Generating ADR for: ${reviewData.platformName}`);
            
            // Increment counter if auto-numbering
            if (this.config.autoNumber) {
                this.adrCounter++;
            }
            
            // Prepare ADR data
            const adrData = {
                id: crypto.randomUUID(),
                number: this.adrCounter,
                title: this.generateTitle(reviewData),
                status: this.mapStatus(reviewData.decision?.decision || reviewData.status),
                date: new Date(),
                review: reviewData,
                format: options.format || this.config.format
            };
            
            // Generate content based on format
            const template = this.templates[adrData.format];
            if (!template) {
                throw new Error(`Unknown ADR format: ${adrData.format}`);
            }
            
            const content = await template.template.call(this, adrData);
            adrData.content = content;
            
            // Generate filename
            const filename = this.generateFilename(adrData);
            adrData.filename = filename;
            
            // Write to file
            const filePath = await this.writeADR(adrData);
            adrData.filePath = filePath;
            
            // Store generated ADR
            this.generatedADRs.set(adrData.id, adrData);
            
            console.log(`✅ ADR generated: ${filename}`);
            console.log(`📁 Location: ${filePath}`);
            
            this.emit('adr_generated', {
                adr: adrData,
                timestamp: new Date()
            });
            
            return adrData;
            
        } catch (error) {
            console.error('❌ ADR generation failed:', error);
            this.emit('adr_error', { reviewData, error });
            throw error;
        }
    }
    
    /**
     * Y-Statement template
     */
    async yStatementTemplate(adrData) {
        const review = adrData.review;
        const decision = review.decision || {};
        
        const content = `# ${adrData.number}. ${adrData.title}

Date: ${adrData.date.toISOString().split('T')[0]}

## Status

${adrData.status.toUpperCase()}

## Context

${this.extractContext(review)}

## Decision

${this.extractDecision(review, decision)}

## Consequences

${this.extractConsequences(review, decision)}
`;

        return content;
    }
    
    /**
     * MADR template
     */
    async madrTemplate(adrData) {
        const review = adrData.review;
        const decision = review.decision || {};
        
        const content = `# ${adrData.title}

* Status: ${adrData.status}
* Deciders: ${this.extractDeciders(review)}
* Date: ${adrData.date.toISOString().split('T')[0]}

## Context and Problem Statement

${this.extractProblemStatement(review)}

## Decision Drivers

${this.extractDecisionDrivers(review)}

## Considered Options

${this.extractConsideredOptions(review)}

## Decision Outcome

Chosen option: "${this.extractChosenOption(review, decision)}", because ${this.extractDecisionRationale(review, decision)}

${this.config.includeVotingData ? this.formatVotingData(decision) : ''}

### Positive Consequences

${this.extractPositiveConsequences(review, decision)}

### Negative Consequences

${this.extractNegativeConsequences(review, decision)}

## Pros and Cons of the Options

${this.extractProsAndCons(review)}

## Links

${this.extractLinks(review)}
`;

        return content;
    }
    
    /**
     * Nygard template
     */
    async nygardTemplate(adrData) {
        const review = adrData.review;
        const decision = review.decision || {};
        
        const content = `# ADR ${adrData.number}: ${adrData.title}

## Date

${adrData.date.toISOString().split('T')[0]}

## Status

${adrData.status}

## Context

${this.extractContext(review)}

## Decision

${this.extractDecision(review, decision)}

## Consequences

${this.extractConsequences(review, decision)}
`;

        return content;
    }
    
    /**
     * Custom extended template
     */
    async customTemplate(adrData) {
        const review = adrData.review;
        const decision = review.decision || {};
        
        const content = `# Architecture Decision Record: ${adrData.title}

## Metadata

- **ADR Number**: ${adrData.number}
- **Status**: ${adrData.status}
- **Date**: ${adrData.date.toISOString()}
- **Platform**: ${review.platformName}
- **Type**: ${review.platformType || 'General'}
- **Review ID**: ${review.reviewId || review.id}

## Executive Summary

${this.generateExecutiveSummary(review, decision)}

## Context

${this.extractDetailedContext(review)}

## Problem Statement

${this.extractProblemStatement(review)}

## Decision Drivers

${this.extractDecisionDrivers(review)}

## Considered Alternatives

${this.extractDetailedAlternatives(review)}

## Decision Outcome

${this.extractDetailedDecision(review, decision)}

## Binary Decision Analysis

${this.formatBinaryDecision(decision)}

${this.config.includeFloorDivisionExplanation ? this.explainFloorDivision(decision) : ''}

## Consequences

### Positive Consequences

${this.extractPositiveConsequences(review, decision)}

### Negative Consequences

${this.extractNegativeConsequences(review, decision)}

### Risks and Mitigations

${this.extractRisksAndMitigations(review)}

## Implementation Notes

${this.config.includeImplementationNotes ? this.extractImplementationNotes(review) : 'Not included'}

## Validation Data

${this.config.includeVotingData ? this.formatDetailedVotingData(review, decision) : 'Not included'}

${this.config.includeDebateExcerpts ? this.formatDebateExcerpts(review) : ''}

## References

${this.extractReferences(review)}

---

*Generated by ADR Generator v1.0.0*
`;

        return content;
    }
    
    /**
     * Content extraction methods
     */
    extractContext(review) {
        const contexts = [];
        
        // Platform context
        contexts.push(`The platform "${review.platformName}" was submitted for architectural review as a ${review.platformType || 'general'} solution.`);
        
        // Review context
        if (review.description) {
            contexts.push(review.description);
        }
        
        // Technical context from debates
        if (review.debates?.technical) {
            const techContext = this.extractFromDebate(review.debates.technical, 'context');
            if (techContext) contexts.push(techContext);
        }
        
        return contexts.join('\n\n');
    }
    
    extractDecision(review, decision) {
        const decisionText = [];
        
        // Primary decision
        if (decision.decision) {
            decisionText.push(`The community has decided to **${decision.decision}** this platform architecture.`);
        }
        
        // Score and rationale
        if (decision.score !== undefined) {
            decisionText.push(`This decision was reached with ${(decision.score * 100).toFixed(1)}% consensus.`);
        }
        
        // Binary value
        if (decision.binary !== undefined) {
            const binaryText = decision.binary === 1 ? 'POSITIVE (1)' : 
                              decision.binary === -1 ? 'NEGATIVE (-1)' : 
                              'NEUTRAL (0)';
            decisionText.push(`Binary decision value: ${binaryText}`);
        }
        
        // Key factors
        const keyFactors = this.extractKeyDecisionFactors(review);
        if (keyFactors.length > 0) {
            decisionText.push('\nKey factors in this decision:');
            decisionText.push(...keyFactors.map(f => `- ${f}`));
        }
        
        return decisionText.join('\n\n');
    }
    
    extractConsequences(review, decision) {
        const consequences = [];
        
        // Decision-based consequences
        if (decision.decision === 'APPROVED') {
            consequences.push('**Positive:**');
            consequences.push('- Platform architecture is validated for production use');
            consequences.push('- Team can proceed with implementation');
            consequences.push('- Architecture patterns can be reused in future projects');
            consequences.push('');
            consequences.push('**Negative:**');
            consequences.push('- Team is committed to maintaining this architecture');
            consequences.push('- Future changes will require new ADRs');
        } else if (decision.decision === 'REJECTED') {
            consequences.push('**Positive:**');
            consequences.push('- Avoided potential technical debt');
            consequences.push('- Opportunity to redesign with community feedback');
            consequences.push('');
            consequences.push('**Negative:**');
            consequences.push('- Development effort needs to be redirected');
            consequences.push('- Time investment in current design is lost');
        } else if (decision.decision === 'CONDITIONAL') {
            consequences.push('**Positive:**');
            consequences.push('- Clear path forward with specific improvements');
            consequences.push('- Partial validation reduces rework');
            consequences.push('');
            consequences.push('**Negative:**');
            consequences.push('- Additional work required before full approval');
            consequences.push('- Uncertainty about final acceptance');
        }
        
        // Extract consequences from debates
        if (review.debates) {
            const debateConsequences = this.extractConsequencesFromDebates(review.debates);
            if (debateConsequences.length > 0) {
                consequences.push('');
                consequences.push('**From community discussion:**');
                consequences.push(...debateConsequences);
            }
        }
        
        return consequences.join('\n');
    }
    
    extractProblemStatement(review) {
        // Try to extract from review metadata
        if (review.problemStatement) {
            return review.problemStatement;
        }
        
        // Generate from context
        return `How should the architecture for "${review.platformName}" be designed to meet the requirements of a ${review.platformType || 'general'} platform while ensuring scalability, maintainability, and user satisfaction?`;
    }
    
    extractDecisionDrivers(review) {
        const drivers = [];
        
        // Standard drivers
        drivers.push('- Technical feasibility and implementation complexity');
        drivers.push('- Scalability and performance requirements');
        drivers.push('- Security and compliance needs');
        drivers.push('- Development team expertise');
        drivers.push('- Time to market constraints');
        drivers.push('- Cost and resource availability');
        
        // Extract from debates
        if (review.debates?.business) {
            const businessDrivers = this.extractFromDebate(review.debates.business, 'drivers');
            if (businessDrivers) {
                drivers.push('- ' + businessDrivers);
            }
        }
        
        return drivers.join('\n');
    }
    
    extractConsideredOptions(review) {
        const options = [];
        
        // Primary option (submitted platform)
        options.push(`1. **${review.platformName}** - The proposed architecture`);
        
        // Extract alternatives from debates
        if (review.debates) {
            const alternatives = this.extractAlternativesFromDebates(review.debates);
            alternatives.forEach((alt, index) => {
                options.push(`${index + 2}. **${alt.name}** - ${alt.description}`);
            });
        }
        
        // Default alternatives if none found
        if (options.length === 1) {
            options.push('2. **Traditional Monolithic** - Single application architecture');
            options.push('3. **Serverless** - Function-based architecture');
            options.push('4. **No Action** - Maintain status quo');
        }
        
        return options.join('\n');
    }
    
    extractChosenOption(review, decision) {
        if (decision.decision === 'APPROVED') {
            return review.platformName;
        } else if (decision.decision === 'REJECTED') {
            return 'None (architecture rejected)';
        } else {
            return `${review.platformName} (with modifications)`;
        }
    }
    
    extractDecisionRationale(review, decision) {
        const rationales = [];
        
        if (decision.score > 0.9) {
            rationales.push('it received overwhelming community support');
        } else if (decision.score > 0.75) {
            rationales.push('it achieved strong consensus');
        } else if (decision.score > 0.5) {
            rationales.push('it received majority approval');
        } else {
            rationales.push('community concerns need to be addressed');
        }
        
        // Add specific reasons from debates
        const topReasons = this.extractTopReasonsFromDebates(review.debates);
        if (topReasons.length > 0) {
            rationales.push(`and ${topReasons.join(', ')}`);
        }
        
        return rationales.join(' ');
    }
    
    formatVotingData(decision) {
        if (!decision.votes) return '';
        
        const { positive, negative, abstain } = decision.votes;
        const total = positive + negative + abstain;
        
        return `
### Voting Results

- **Total Votes**: ${total}
- **Positive**: ${positive} (${((positive/total) * 100).toFixed(1)}%)
- **Negative**: ${negative} (${((negative/total) * 100).toFixed(1)}%)
- **Abstain**: ${abstain} (${((abstain/total) * 100).toFixed(1)}%)
- **Decision Score**: ${(decision.score * 100).toFixed(1)}%
`;
    }
    
    formatBinaryDecision(decision) {
        const sections = [];
        
        sections.push(`### Binary Decision Value: ${decision.binary !== undefined ? decision.binary : 'N/A'}`);
        sections.push('');
        
        if (decision.binary === 1) {
            sections.push('The platform architecture receives a **POSITIVE (1)** binary decision, indicating full approval.');
        } else if (decision.binary === -1) {
            sections.push('The platform architecture receives a **NEGATIVE (-1)** binary decision, indicating rejection.');
        } else if (decision.binary === 0) {
            sections.push('The platform architecture receives a **NEUTRAL (0)** binary decision, indicating conditional status.');
        }
        
        sections.push('');
        sections.push(`This binary value was calculated using the floor division method with a score of ${(decision.score * 100).toFixed(2)}%.`);
        
        return sections.join('\n');
    }
    
    explainFloorDivision(decision) {
        return `
### Floor Division Method Explanation

The binary decision was calculated using the floor division method:

1. **Positive Votes**: ${decision.votes?.positive || 0}
2. **Negative Votes**: ${decision.votes?.negative || 0}
3. **Total Valid Votes**: ${(decision.votes?.positive || 0) + (decision.votes?.negative || 0)}
4. **Ratio**: ${decision.votes?.positive || 0} ÷ ${(decision.votes?.positive || 0) + (decision.votes?.negative || 0)} = ${decision.score?.toFixed(4) || 'N/A'}
5. **Floor Result**: floor(${decision.score?.toFixed(4) || 0} × 100) ÷ 100 = ${decision.score?.toFixed(2) || 'N/A'}

**Decision Thresholds**:
- Approval: ≥ 0.75 (75%)
- Rejection: ≤ 0.35 (35%)
- Conditional: 0.35 < score < 0.75

**Result**: Score of ${(decision.score * 100).toFixed(1)}% results in **${decision.decision}**
`;
    }
    
    extractDetailedAlternatives(review) {
        const alternatives = [];
        const maxAlternatives = this.config.maxAlternatives;
        
        // Extract from debates
        if (review.debates) {
            const debateAlternatives = this.extractAlternativesFromDebates(review.debates);
            
            debateAlternatives.slice(0, maxAlternatives).forEach((alt, index) => {
                alternatives.push(`### Option ${index + 1}: ${alt.name}`);
                alternatives.push('');
                alternatives.push(`**Description**: ${alt.description}`);
                alternatives.push('');
                
                if (alt.pros) {
                    alternatives.push('**Pros**:');
                    alternatives.push(...alt.pros.map(p => `- ${p}`));
                    alternatives.push('');
                }
                
                if (alt.cons) {
                    alternatives.push('**Cons**:');
                    alternatives.push(...alt.cons.map(c => `- ${c}`));
                    alternatives.push('');
                }
                
                if (alt.proposedBy) {
                    alternatives.push(`*Proposed by: ${alt.proposedBy}*`);
                    alternatives.push('');
                }
            });
        }
        
        if (alternatives.length === 0) {
            alternatives.push('No specific alternatives were proposed during the review.');
        }
        
        return alternatives.join('\n');
    }
    
    formatDebateExcerpts(review) {
        const excerpts = [];
        
        excerpts.push('### Key Discussion Points');
        excerpts.push('');
        
        // Extract key arguments from each debate type
        const debateTypes = ['technical', 'business', 'ux'];
        
        for (const debateType of debateTypes) {
            const debate = review.debates?.[debateType];
            if (!debate) continue;
            
            excerpts.push(`#### ${debateType.charAt(0).toUpperCase() + debateType.slice(1)} Review`);
            excerpts.push('');
            
            // Get top arguments
            const topArguments = this.getTopArguments(debate, 3);
            
            topArguments.forEach(arg => {
                excerpts.push(`> **${arg.author}** (${arg.position}): "${arg.excerpt}"`);
                excerpts.push('');
            });
        }
        
        return excerpts.join('\n');
    }
    
    /**
     * Helper methods
     */
    generateTitle(reviewData) {
        return reviewData.platformName || `Platform Review ${reviewData.reviewId || reviewData.id}`;
    }
    
    mapStatus(status) {
        return this.statusMappings[status] || 'draft';
    }
    
    generateFilename(adrData) {
        const number = String(adrData.number).padStart(4, '0');
        const title = adrData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        const extension = this.config.fileFormat === 'markdown' ? 'md' : 
                         this.config.fileFormat === 'json' ? 'json' : 
                         this.config.fileFormat === 'yaml' ? 'yml' : 'txt';
        
        return `${number}-${title}.${extension}`;
    }
    
    async writeADR(adrData) {
        // Determine subdirectory based on status
        const subdir = adrData.status;
        const dirPath = path.join(this.config.outputDirectory, subdir);
        const filePath = path.join(dirPath, adrData.filename);
        
        // Format content based on file format
        let fileContent = adrData.content;
        
        if (this.config.fileFormat === 'json') {
            fileContent = JSON.stringify({
                ...adrData,
                content: undefined,
                formattedContent: adrData.content
            }, null, 2);
        } else if (this.config.fileFormat === 'yaml') {
            // Simple YAML formatting
            fileContent = this.toYAML(adrData);
        }
        
        // Write file
        await fs.writeFile(filePath, fileContent, 'utf8');
        
        // Also write to root directory for easy access
        const rootPath = path.join(this.config.outputDirectory, adrData.filename);
        await fs.writeFile(rootPath, fileContent, 'utf8');
        
        return filePath;
    }
    
    toYAML(obj) {
        // Simple YAML converter (for basic use)
        const lines = [];
        
        const addValue = (key, value, indent = 0) => {
            const spacing = '  '.repeat(indent);
            
            if (typeof value === 'object' && value !== null) {
                lines.push(`${spacing}${key}:`);
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (typeof item === 'object') {
                            lines.push(`${spacing}- `);
                            Object.entries(item).forEach(([k, v]) => {
                                addValue(k, v, indent + 2);
                            });
                        } else {
                            lines.push(`${spacing}- ${item}`);
                        }
                    });
                } else {
                    Object.entries(value).forEach(([k, v]) => {
                        addValue(k, v, indent + 1);
                    });
                }
            } else {
                lines.push(`${spacing}${key}: ${value}`);
            }
        };
        
        Object.entries(obj).forEach(([key, value]) => {
            addValue(key, value);
        });
        
        return lines.join('\n');
    }
    
    extractFromDebate(debate, type) {
        // Extract specific information from debate structure
        if (!debate || !debate.arguments) return null;
        
        const allArguments = [
            ...debate.arguments.pro,
            ...debate.arguments.con,
            ...debate.arguments.neutral
        ];
        
        // Find relevant content based on type
        const relevant = allArguments
            .filter(arg => arg.content.toLowerCase().includes(type))
            .map(arg => arg.content);
        
        return relevant.length > 0 ? relevant[0] : null;
    }
    
    extractAlternativesFromDebates(debates) {
        const alternatives = [];
        
        for (const [debateType, debate] of Object.entries(debates || {})) {
            if (!debate.arguments) continue;
            
            // Look for alternatives in con and neutral arguments
            const altArguments = [...debate.arguments.con, ...debate.arguments.neutral];
            
            altArguments.forEach(arg => {
                if (arg.content.match(/instead|alternative|consider|rather than/i)) {
                    alternatives.push({
                        name: `Alternative from ${arg.author}`,
                        description: this.extractAlternativeDescription(arg.content),
                        proposedBy: arg.author,
                        debateType
                    });
                }
            });
        }
        
        return alternatives;
    }
    
    extractAlternativeDescription(content) {
        // Extract the alternative suggestion from argument content
        const patterns = [
            /instead(?:\s+of\s+this)?,?\s+(.+?)(?:\.|$)/i,
            /alternative(?:\s+would\s+be)?\s+(.+?)(?:\.|$)/i,
            /consider\s+(.+?)(?:\.|$)/i,
            /rather\s+than\s+.+?,\s+(.+?)(?:\.|$)/i
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return content.slice(0, 100) + '...';
    }
    
    extractKeyDecisionFactors(review) {
        const factors = [];
        
        // Extract from debate summaries
        if (review.debateSummary) {
            Object.entries(review.debateSummary).forEach(([type, summary]) => {
                if (summary.keyPoints) {
                    factors.push(...summary.keyPoints);
                }
            });
        }
        
        // Default factors if none found
        if (factors.length === 0) {
            factors.push('Technical feasibility confirmed');
            factors.push('Alignment with business objectives');
            factors.push('Community consensus achieved');
        }
        
        return factors;
    }
    
    extractConsequencesFromDebates(debates) {
        const consequences = [];
        
        for (const debate of Object.values(debates || {})) {
            if (!debate.arguments) continue;
            
            // Look for consequence mentions in arguments
            const allArguments = [
                ...debate.arguments.pro,
                ...debate.arguments.con,
                ...debate.arguments.neutral
            ];
            
            allArguments.forEach(arg => {
                if (arg.content.match(/consequence|result|lead to|impact/i)) {
                    const consequence = this.extractConsequenceFromArgument(arg.content);
                    if (consequence) {
                        consequences.push(`- ${consequence} (noted by ${arg.author})`);
                    }
                }
            });
        }
        
        return consequences;
    }
    
    extractConsequenceFromArgument(content) {
        const patterns = [
            /(?:consequence|result)(?:\s+would\s+be)?\s+(.+?)(?:\.|$)/i,
            /(?:this\s+)?(?:would|will|could|might)\s+lead\s+to\s+(.+?)(?:\.|$)/i,
            /impact(?:\s+would\s+be)?\s+(.+?)(?:\.|$)/i
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    getTopArguments(debate, count = 3) {
        const allArguments = [
            ...debate.arguments.pro,
            ...debate.arguments.con,
            ...debate.arguments.neutral
        ];
        
        // Sort by votes or importance
        const sorted = allArguments.sort((a, b) => {
            const aScore = (a.votes?.agree || 0) - (a.votes?.disagree || 0);
            const bScore = (b.votes?.agree || 0) - (b.votes?.disagree || 0);
            return bScore - aScore;
        });
        
        return sorted.slice(0, count).map(arg => ({
            author: arg.author,
            position: arg.position,
            excerpt: arg.content.slice(0, 150) + (arg.content.length > 150 ? '...' : '')
        }));
    }
    
    extractTopReasonsFromDebates(debates) {
        const reasons = [];
        
        // Extract positive reasons from pro arguments
        if (debates?.technical?.arguments?.pro) {
            const techReasons = debates.technical.arguments.pro
                .slice(0, 2)
                .map(arg => this.summarizeArgument(arg.content));
            reasons.push(...techReasons);
        }
        
        return reasons.slice(0, 3);
    }
    
    summarizeArgument(content) {
        // Extract key point from argument
        const firstSentence = content.split('.')[0];
        return firstSentence.toLowerCase().replace(/^(this|the|it)\s+/, '');
    }
    
    extractDeciders(review) {
        if (review.participants) {
            return Array.from(review.participants).join(', ');
        }
        return 'Community participants';
    }
    
    extractDetailedContext(review) {
        const contexts = [
            this.extractContext(review),
            '',
            '### Technical Context',
            review.technicalContext || 'The platform requires modern architecture patterns suitable for production deployment.',
            '',
            '### Business Context', 
            review.businessContext || 'The solution must align with market needs and provide sustainable value.',
            '',
            '### Organizational Context',
            review.organizationalContext || 'The development team has the necessary skills and resources for implementation.'
        ];
        
        return contexts.join('\n');
    }
    
    extractDetailedDecision(review, decision) {
        const sections = [
            `The community has reached a **${decision.decision}** decision regarding the ${review.platformName} architecture.`,
            '',
            '### Decision Details',
            '',
            this.extractDecision(review, decision),
            '',
            '### Rationale',
            '',
            this.extractDecisionRationale(review, decision),
            '',
            '### Conditions',
            ''
        ];
        
        if (decision.decision === 'CONDITIONAL') {
            sections.push('The following conditions must be met:');
            sections.push(...this.extractConditions(review).map(c => `- ${c}`));
        } else {
            sections.push('No additional conditions apply.');
        }
        
        return sections.join('\n');
    }
    
    extractConditions(review) {
        // Extract conditions from debates or use defaults
        const conditions = [];
        
        if (review.conditions) {
            conditions.push(...review.conditions);
        } else {
            conditions.push('Address security concerns raised in review');
            conditions.push('Improve documentation completeness');
            conditions.push('Demonstrate scalability through testing');
        }
        
        return conditions;
    }
    
    extractPositiveConsequences(review, decision) {
        const consequences = [];
        
        if (decision.decision === 'APPROVED') {
            consequences.push('- Architecture validated by community experts');
            consequences.push('- Clear path to production deployment');
            consequences.push('- Established patterns for future reference');
            consequences.push('- Team confidence in technical decisions');
        } else if (decision.decision === 'CONDITIONAL') {
            consequences.push('- Specific improvement areas identified');
            consequences.push('- Partial validation reduces risk');
            consequences.push('- Community support available');
        }
        
        // Add custom positive consequences
        const customPositive = this.extractCustomConsequences(review, 'positive');
        consequences.push(...customPositive);
        
        return consequences.join('\n');
    }
    
    extractNegativeConsequences(review, decision) {
        const consequences = [];
        
        if (decision.decision === 'APPROVED') {
            consequences.push('- Architecture decisions are now locked in');
            consequences.push('- Changes require new review process');
            consequences.push('- Team accountable for implementation');
        } else if (decision.decision === 'REJECTED') {
            consequences.push('- Significant rework required');
            consequences.push('- Timeline impact on project');
            consequences.push('- Team morale considerations');
        }
        
        // Add custom negative consequences
        const customNegative = this.extractCustomConsequences(review, 'negative');
        consequences.push(...customNegative);
        
        return consequences.join('\n');
    }
    
    extractCustomConsequences(review, type) {
        const consequences = [];
        
        // Extract from review metadata
        if (review.consequences?.[type]) {
            consequences.push(...review.consequences[type].map(c => `- ${c}`));
        }
        
        return consequences;
    }
    
    extractRisksAndMitigations(review) {
        const risks = [];
        
        risks.push('| Risk | Impact | Mitigation |');
        risks.push('|------|--------|------------|');
        
        // Default risks
        const defaultRisks = [
            {
                risk: 'Technical complexity',
                impact: 'Medium',
                mitigation: 'Incremental implementation with regular reviews'
            },
            {
                risk: 'Scalability concerns',
                impact: 'High',
                mitigation: 'Performance testing at each milestone'
            },
            {
                risk: 'Team expertise gaps',
                impact: 'Medium',
                mitigation: 'Training and documentation focus'
            }
        ];
        
        // Add custom risks if available
        const customRisks = review.risks || defaultRisks;
        
        customRisks.forEach(r => {
            risks.push(`| ${r.risk} | ${r.impact} | ${r.mitigation} |`);
        });
        
        return risks.join('\n');
    }
    
    extractImplementationNotes(review) {
        const notes = [];
        
        notes.push('### Implementation Recommendations');
        notes.push('');
        
        // Extract from review
        if (review.implementationNotes) {
            notes.push(...review.implementationNotes);
        } else {
            // Default recommendations
            notes.push('1. **Phase 1**: Core infrastructure and authentication');
            notes.push('2. **Phase 2**: Primary features and API');
            notes.push('3. **Phase 3**: UI/UX implementation');
            notes.push('4. **Phase 4**: Testing and optimization');
            notes.push('5. **Phase 5**: Deployment and monitoring');
        }
        
        notes.push('');
        notes.push('### Technical Guidelines');
        notes.push('');
        notes.push('- Follow established coding standards');
        notes.push('- Implement comprehensive testing');
        notes.push('- Document all architectural decisions');
        notes.push('- Regular code reviews with team');
        
        return notes.join('\n');
    }
    
    formatDetailedVotingData(review, decision) {
        const sections = [];
        
        sections.push('### Participation Metrics');
        sections.push('');
        sections.push(`- **Total Participants**: ${review.participants?.size || 0}`);
        sections.push(`- **Unique Voters**: ${decision.totalVotes || 0}`);
        sections.push(`- **Debate Contributors**: ${this.countDebateContributors(review.debates)}`);
        sections.push('');
        
        sections.push(this.formatVotingData(decision));
        
        sections.push('### Voting Timeline');
        sections.push('');
        sections.push('```');
        sections.push(this.generateVotingTimeline(review));
        sections.push('```');
        
        return sections.join('\n');
    }
    
    countDebateContributors(debates) {
        const contributors = new Set();
        
        for (const debate of Object.values(debates || {})) {
            if (debate.participants) {
                debate.participants.forEach(p => contributors.add(p));
            }
        }
        
        return contributors.size;
    }
    
    generateVotingTimeline(review) {
        // Generate ASCII timeline of voting
        return `
Start: ${review.createdAt || 'Unknown'}
  |
  +-- Initial arguments posted
  |
  +-- Debate period (${review.debateDuration || '7 days'})
  |
  +-- Final votes cast
  |
End: ${review.closedAt || 'Ongoing'}
        `.trim();
    }
    
    extractReferences(review) {
        const references = [];
        
        references.push(`- Platform Documentation: ${review.platformUrl || 'Not available'}`);
        references.push(`- Review Thread: ${review.forumUrl || `/forum/review/${review.reviewId || review.id}`}`);
        
        if (review.references) {
            references.push(...review.references);
        }
        
        return references.join('\n');
    }
    
    generateExecutiveSummary(review, decision) {
        return `The ${review.platformName} platform architecture was submitted for community review on ${review.createdAt || 'unknown date'}. After ${review.participants?.size || 'multiple'} participants engaged in structured debates across technical, business, and user experience dimensions, the community reached a ${decision.decision} decision with ${(decision.score * 100).toFixed(1)}% consensus. This ADR documents the rationale, alternatives considered, and consequences of this architectural decision.`;
    }
    
    extractProsAndCons(review) {
        const sections = [];
        
        // For each alternative option
        const alternatives = this.extractAlternativesFromDebates(review.debates);
        
        alternatives.forEach((alt, index) => {
            sections.push(`### Option ${index + 1}: ${alt.name}`);
            sections.push('');
            sections.push('**Pros:**');
            sections.push(...(alt.pros || ['- To be determined']).map(p => `- ${p}`));
            sections.push('');
            sections.push('**Cons:**');
            sections.push(...(alt.cons || ['- To be determined']).map(c => `- ${c}`));
            sections.push('');
        });
        
        return sections.join('\n');
    }
    
    extractLinks(review) {
        const links = [];
        
        if (review.relatedADRs) {
            links.push('- Related ADRs:');
            links.push(...review.relatedADRs.map(adr => `  - ${adr}`));
        }
        
        if (review.externalLinks) {
            links.push('- External Resources:');
            links.push(...review.externalLinks.map(link => `  - ${link}`));
        }
        
        if (links.length === 0) {
            links.push('- No additional links');
        }
        
        return links.join('\n');
    }
    
    /**
     * Bulk generation methods
     */
    async generateBulkFromReviews(reviews, options = {}) {
        const results = [];
        
        console.log(`📋 Generating ${reviews.length} ADRs...`);
        
        for (const review of reviews) {
            try {
                const adr = await this.generateFromReview(review, options);
                results.push({ success: true, adr });
            } catch (error) {
                results.push({ success: false, error: error.message, review });
            }
        }
        
        const successful = results.filter(r => r.success).length;
        console.log(`✅ Generated ${successful}/${reviews.length} ADRs successfully`);
        
        return results;
    }
    
    /**
     * Get ADR statistics
     */
    getStatistics() {
        const stats = {
            totalGenerated: this.generatedADRs.size,
            byStatus: {},
            byFormat: {},
            averageSize: 0
        };
        
        let totalSize = 0;
        
        for (const adr of this.generatedADRs.values()) {
            // Count by status
            stats.byStatus[adr.status] = (stats.byStatus[adr.status] || 0) + 1;
            
            // Count by format
            stats.byFormat[adr.format] = (stats.byFormat[adr.format] || 0) + 1;
            
            // Track size
            totalSize += adr.content.length;
        }
        
        stats.averageSize = this.generatedADRs.size > 0 ? 
            Math.round(totalSize / this.generatedADRs.size) : 0;
        
        return stats;
    }
}

module.exports = ADRGenerator;

// CLI execution
if (require.main === module) {
    const generator = new ADRGenerator({
        format: process.argv.includes('--madr') ? 'madr' : 
                process.argv.includes('--nygard') ? 'nygard' : 
                process.argv.includes('--custom') ? 'custom' : 'y-statement',
        outputDirectory: process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1] || './decisions',
        includeVotingData: !process.argv.includes('--no-voting'),
        includeDebateExcerpts: process.argv.includes('--include-debates')
    });
    
    console.log('📋 ADR Generator ready');
    console.log('📊 Statistics:', JSON.stringify(generator.getStatistics(), null, 2));
    
    // Demo generation
    if (process.argv.includes('--demo')) {
        const demoReview = {
            id: 'demo_review_1',
            reviewId: 'demo_review_1',
            platformName: 'RoughSparks Newsletter Platform',
            platformType: 'educational',
            description: 'AI-powered multi-generational newsletter system',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            closedAt: new Date(),
            participants: new Set(['aria', 'rex', 'sage', 'nova', 'pixel']),
            decision: {
                decision: 'APPROVED',
                binary: 1,
                score: 0.82,
                votes: {
                    positive: 18,
                    negative: 4, 
                    abstain: 2
                }
            },
            debates: {
                technical: {
                    arguments: {
                        pro: [
                            {
                                author: 'rex',
                                content: 'The microservice architecture enables independent scaling of content processing and delivery systems.',
                                position: 'pro'
                            }
                        ],
                        con: [
                            {
                                author: 'zen',
                                content: 'Instead of microservices, consider a modular monolith for simpler deployment.',
                                position: 'con'
                            }
                        ],
                        neutral: []
                    }
                }
            }
        };
        
        generator.generateFromReview(demoReview).then(adr => {
            console.log('\n📄 Demo ADR generated:');
            console.log('Title:', adr.title);
            console.log('Status:', adr.status);
            console.log('File:', adr.filename);
            console.log('\nContent preview:');
            console.log(adr.content.slice(0, 500) + '...');
        });
    }
}
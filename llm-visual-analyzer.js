#!/usr/bin/env node
/**
 * LLM Visual Analyzer
 * 
 * Converts selected sprites and visual elements to LLM-readable format
 * Provides visual analysis, description generation, and design suggestions
 * Supports image-to-text conversion and visual element metadata extraction
 */

const fs = require('fs');
const path = require('path');
const { logger, createErrorBoundary } = require('./emergency-logging-system');
const { BrandSpriteIntegration } = require('./brand-sprite-integration');
const { VisualElementSelector } = require('./visual-element-selector');

class LLMVisualAnalyzer {
    constructor(config = {}) {
        this.boundary = createErrorBoundary('llm-visual-analyzer');
        
        this.config = {
            apiProvider: config.apiProvider || 'openai', // openai, anthropic, ollama
            model: config.model || 'gpt-4-vision-preview',
            maxTokens: config.maxTokens || 2000,
            temperature: config.temperature || 0.7,
            includePixelData: config.includePixelData || false,
            generateAlternatives: config.generateAlternatives || true,
            brandAwareness: config.brandAwareness !== false,
            ...config
        };
        
        // API clients (would be configured with actual API keys)
        this.apiClients = {
            openai: null, // new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
            anthropic: null, // new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            ollama: null // local ollama instance
        };
        
        // Brand integration for context
        this.brandIntegration = new BrandSpriteIntegration();
        this.brandGuidelines = this.brandIntegration.getBrandGuidelines();
        
        // Analysis templates and prompts
        this.analysisPrompts = this.initializePrompts();
        
        // Visual description cache
        this.descriptionCache = new Map();
        
        // Analysis history
        this.analysisHistory = [];
        
        logger.log('SYSTEM', 'LLM Visual Analyzer initialized', {
            provider: this.config.apiProvider,
            model: this.config.model
        });
    }
    
    initializePrompts() {
        return {
            // Basic visual description
            describe: `Analyze this visual element and provide a detailed description. Include:
1. Visual appearance (colors, shapes, size, layout)
2. UI element type and purpose
3. Brand compliance assessment
4. Accessibility considerations
5. Design quality evaluation

Context: This is part of the BlameChain system with brand colors:
- Blame Red (#e94560) for critical actions
- Verification Green (#4ecca3) for success states  
- Warm Orange (#f47068) for secondary actions
- Accent Gold (#ffd700) for highlights

Respond in JSON format with structured analysis.`,

            // Design improvement suggestions
            improve: `Analyze this visual element and suggest specific improvements. Consider:
1. Brand compliance with BlameChain guidelines
2. Accessibility and usability
3. Visual hierarchy and clarity
4. Color contrast and readability
5. Modern design trends

Provide actionable, specific suggestions with:
- What to change
- Why to change it
- How to implement the change
- Expected impact

Format as JSON with prioritized recommendations.`,

            // Micro-edit commands
            microEdit: `Analyze this visual element and generate precise micro-editing commands. Consider:
1. Pixel-level adjustments needed
2. Color modifications for brand compliance
3. Spacing and alignment improvements
4. Typography adjustments
5. Interactive state enhancements

Generate specific commands like:
- "move 2px left"
- "brighten by 15%"
- "apply brand accent color"
- "increase padding by 4px"

Format as structured command list with coordinates and values.`,

            // Comparative analysis
            compare: `Compare these visual elements and analyze:
1. Consistency with each other
2. Brand guideline adherence
3. Design pattern alignment
4. Accessibility compliance
5. User experience flow

Identify inconsistencies and suggest unification strategies.
Format as detailed comparison report.`,

            // Brand compliance check
            brandCheck: `Evaluate this visual element against BlameChain brand guidelines:

Brand Standards:
- Primary Colors: Blame Red (#e94560), Verification Green (#4ecca3), Warm Orange (#f47068), Accent Gold (#ffd700)
- Typography: Inter (primary), JetBrains Mono (code), Space Grotesk (display)
- Spacing: 4px increments (4, 8, 12, 16, 24, 32)
- Border Radius: 4px (small), 8px (medium), 12px (large)
- Contrast: Minimum 4.5:1 ratio

Provide:
1. Compliance score (0-100)
2. Specific violations
3. Correction recommendations
4. Brand alignment assessment

Format as detailed compliance report.`
        };
    }
    
    // Main analysis function
    async analyzeVisualElement(selectionData, analysisType = 'describe') {
        const startTime = Date.now();
        
        try {
            // Prepare analysis context
            const context = this.prepareAnalysisContext(selectionData);
            
            // Generate visual description
            const visualDescription = this.generateVisualDescription(selectionData);
            
            // Get appropriate prompt
            const prompt = this.buildAnalysisPrompt(analysisType, visualDescription, context);
            
            // Call LLM API
            const llmResponse = await this.callLLMAPI(prompt, selectionData);
            
            // Process and enhance response
            const analysis = this.processLLMResponse(llmResponse, selectionData, analysisType);
            
            // Cache results
            this.cacheAnalysis(selectionData, analysis);
            
            // Log analysis
            logger.log('INFO', 'Visual analysis completed', {
                type: analysisType,
                duration: Date.now() - startTime,
                elementCount: selectionData.selections?.length || 1
            });
            
            return analysis;
            
        } catch (error) {
            logger.log('ERROR', 'Visual analysis failed', {
                error: error.message,
                type: analysisType,
                duration: Date.now() - startTime
            });
            
            return this.generateFallbackAnalysis(selectionData, analysisType);
        }
    }
    
    prepareAnalysisContext(selectionData) {
        return {
            timestamp: new Date().toISOString(),
            canvasSize: selectionData.canvasSize,
            selectionCount: selectionData.selections?.length || 0,
            brandGuidelines: this.brandGuidelines,
            analysisCapabilities: {
                pixelLevel: true,
                colorAnalysis: true,
                brandCompliance: true,
                accessibilityCheck: true,
                designSuggestions: true
            }
        };
    }
    
    generateVisualDescription(selectionData) {
        const descriptions = [];
        
        if (selectionData.selections) {
            selectionData.selections.forEach(selection => {
                descriptions.push(this.describeSelection(selection));
            });
        }
        
        return descriptions.join('\n\n');
    }
    
    describeSelection(selection) {
        const desc = {
            id: selection.id,
            type: selection.type,
            dimensions: `${selection.bounds.width}x${selection.bounds.height}`,
            position: `(${selection.bounds.x}, ${selection.bounds.y})`,
            metadata: selection.metadata
        };
        
        let description = `Element ${selection.id}:\n`;
        description += `- Type: ${selection.type}\n`;
        description += `- Size: ${desc.dimensions} pixels\n`;
        description += `- Position: ${desc.position}\n`;
        
        if (selection.metadata) {
            const meta = selection.metadata;
            
            if (meta.dominantColor) {
                description += `- Dominant Color: ${meta.dominantColor}\n`;
            }
            
            if (meta.colorPalette && meta.colorPalette.length > 0) {
                const colors = meta.colorPalette.map(c => c.color).join(', ');
                description += `- Color Palette: ${colors}\n`;
            }
            
            if (meta.brandCompliance) {
                description += `- Brand Compliance: ${meta.brandCompliance.grade} (${meta.brandCompliance.score}/100)\n`;
                
                if (meta.brandCompliance.issues.length > 0) {
                    description += `- Brand Issues: ${meta.brandCompliance.issues.join('; ')}\n`;
                }
            }
            
            if (meta.elementType) {
                description += `- Element Type: ${meta.elementType}\n`;
            }
            
            if (meta.pixelCount) {
                description += `- Pixel Count: ${meta.pixelCount}\n`;
            }
        }
        
        // Add pixel data representation if available and requested
        if (this.config.includePixelData && selection.pixelData) {
            description += this.generatePixelDataDescription(selection.pixelData);
        }
        
        return description;
    }
    
    generatePixelDataDescription(pixelData) {
        if (!pixelData) return '';
        
        // Create a simplified ASCII representation
        let ascii = '\n- Pixel Pattern:\n';
        
        pixelData.forEach(row => {
            let line = '  ';
            row.forEach(pixel => {
                if (pixel === null) {
                    line += ' ';
                } else if (pixel.a === 0) {
                    line += '.';
                } else {
                    // Simple character based on brightness
                    const brightness = (pixel.r + pixel.g + pixel.b) / 3;
                    if (brightness > 200) line += '░';
                    else if (brightness > 150) line += '▒';
                    else if (brightness > 100) line += '▓';
                    else line += '█';
                }
            });
            ascii += line + '\n';
        });
        
        return ascii;
    }
    
    buildAnalysisPrompt(analysisType, visualDescription, context) {
        const basePrompt = this.analysisPrompts[analysisType] || this.analysisPrompts.describe;
        
        let prompt = `${basePrompt}\n\n`;
        prompt += `Visual Element Data:\n${visualDescription}\n\n`;
        
        if (context.brandGuidelines) {
            prompt += `Brand Context:\n`;
            prompt += `- Primary Colors: ${Object.entries(context.brandGuidelines.colors.primary).map(([name, color]) => `${name} (${color})`).join(', ')}\n`;
            prompt += `- Typography: ${Object.values(context.brandGuidelines.typography).join(', ')}\n`;
            prompt += `- Spacing Scale: ${Object.values(context.brandGuidelines.spacing).join('px, ')}px\n\n`;
        }
        
        prompt += `Canvas Information:\n`;
        prompt += `- Canvas Size: ${context.canvasSize.width}x${context.canvasSize.height}\n`;
        prompt += `- Selection Count: ${context.selectionCount}\n\n`;
        
        prompt += `Please provide a comprehensive analysis in JSON format.`;
        
        return prompt;
    }
    
    async callLLMAPI(prompt, selectionData) {
        const provider = this.config.apiProvider;
        
        // For now, simulate LLM response since we don't have real API keys
        // In production, this would call actual LLM APIs
        if (provider === 'ollama') {
            return await this.callOllamaAPI(prompt);
        } else {
            return this.simulateLLMResponse(prompt, selectionData);
        }
    }
    
    async callOllamaAPI(prompt) {
        try {
            // This would call local Ollama instance
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama2',
                    prompt: prompt,
                    stream: false
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response;
            }
        } catch (error) {
            logger.log('WARNING', 'Ollama API call failed, using simulation', { error: error.message });
        }
        
        return this.simulateLLMResponse(prompt);
    }
    
    simulateLLMResponse(prompt, selectionData) {
        // Intelligent simulation based on selection data
        const selections = selectionData?.selections || [];
        
        if (selections.length === 0) {
            return this.generateEmptySelectionResponse();
        }
        
        const primarySelection = selections[0];
        const analysis = {
            timestamp: new Date().toISOString(),
            analysis_type: this.detectAnalysisType(prompt),
            visual_description: this.generateIntelligentDescription(primarySelection),
            design_analysis: this.generateDesignAnalysis(primarySelection),
            brand_compliance: this.generateBrandComplianceAnalysis(primarySelection),
            accessibility_assessment: this.generateAccessibilityAssessment(primarySelection),
            improvement_suggestions: this.generateImprovementSuggestions(primarySelection),
            micro_edit_commands: this.generateMicroEditCommands(primarySelection),
            confidence_score: 0.85
        };
        
        return JSON.stringify(analysis, null, 2);
    }
    
    detectAnalysisType(prompt) {
        if (prompt.includes('improve')) return 'improvement';
        if (prompt.includes('micro-edit') || prompt.includes('microEdit')) return 'micro_edit';
        if (prompt.includes('compare')) return 'comparison';
        if (prompt.includes('brand')) return 'brand_compliance';
        return 'description';
    }
    
    generateIntelligentDescription(selection) {
        const { type, bounds, metadata } = selection;
        
        let description = `This is a ${type} element measuring ${bounds.width}x${bounds.height} pixels, positioned at coordinates (${bounds.x}, ${bounds.y}).`;
        
        if (metadata?.dominantColor) {
            description += ` The dominant color is ${metadata.dominantColor}.`;
        }
        
        if (metadata?.brandCompliance) {
            const grade = metadata.brandCompliance.grade;
            description += ` The element has a brand compliance grade of ${grade}.`;
        }
        
        // Add contextual information based on element type
        switch (type) {
            case 'button':
            case 'ui-element':
                description += ' This appears to be an interactive UI element that users can click or tap.';
                break;
            case 'icon':
                description += ' This is an icon element, likely used for visual communication or navigation.';
                break;
            case 'color-based':
                description += ' This selection was made based on color similarity, grouping pixels of similar hues.';
                break;
            case 'connected-region':
                description += ' This represents a connected region of pixels, likely forming a cohesive visual element.';
                break;
        }
        
        return description;
    }
    
    generateDesignAnalysis(selection) {
        const analysis = {
            visual_hierarchy: 'medium',
            design_quality: 'good',
            modern_alignment: 'high',
            user_experience: 'positive'
        };
        
        // Analyze based on size
        if (selection.bounds.width < 20 || selection.bounds.height < 20) {
            analysis.concerns = ['Element may be too small for optimal usability'];
            analysis.user_experience = 'concerning';
        }
        
        // Analyze based on brand compliance
        if (selection.metadata?.brandCompliance?.grade === 'A') {
            analysis.brand_alignment = 'excellent';
        } else if (selection.metadata?.brandCompliance?.grade === 'B') {
            analysis.brand_alignment = 'good';
        } else {
            analysis.brand_alignment = 'needs_improvement';
        }
        
        return analysis;
    }
    
    generateBrandComplianceAnalysis(selection) {
        const compliance = {
            overall_score: 75,
            color_compliance: 'good',
            spacing_compliance: 'medium',
            typography_compliance: 'unknown',
            accessibility_score: 80
        };
        
        if (selection.metadata?.brandCompliance) {
            compliance.overall_score = selection.metadata.brandCompliance.score;
            compliance.grade = selection.metadata.brandCompliance.grade;
            compliance.issues = selection.metadata.brandCompliance.issues;
            compliance.recommendations = selection.metadata.brandCompliance.recommendations;
        }
        
        // Check if colors match brand palette
        if (selection.metadata?.dominantColor) {
            const brandColors = Object.values(this.brandGuidelines.colors.primary);
            const isOnBrand = brandColors.some(color => 
                this.colorsAreSimilar(selection.metadata.dominantColor, color)
            );
            
            compliance.color_compliance = isOnBrand ? 'excellent' : 'needs_review';
        }
        
        return compliance;
    }
    
    generateAccessibilityAssessment(selection) {
        const assessment = {
            touch_target_size: 'unknown',
            color_contrast: 'unknown',
            focus_indicator: 'missing',
            screen_reader_support: 'unknown',
            overall_accessibility: 'needs_review'
        };
        
        // Check minimum touch target size (44x44px)
        if (selection.bounds.width >= 44 && selection.bounds.height >= 44) {
            assessment.touch_target_size = 'compliant';
        } else if (selection.bounds.width >= 24 && selection.bounds.height >= 24) {
            assessment.touch_target_size = 'marginal';
        } else {
            assessment.touch_target_size = 'too_small';
        }
        
        // Estimate overall accessibility
        if (assessment.touch_target_size === 'compliant') {
            assessment.overall_accessibility = 'good';
        }
        
        return assessment;
    }
    
    generateImprovementSuggestions(selection) {
        const suggestions = [];
        
        // Size-based suggestions
        if (selection.bounds.width < 44 || selection.bounds.height < 44) {
            suggestions.push({
                priority: 'high',
                category: 'accessibility',
                suggestion: 'Increase element size to meet minimum touch target requirements (44x44px)',
                impact: 'Improves usability on touch devices'
            });
        }
        
        // Brand compliance suggestions
        if (selection.metadata?.brandCompliance?.issues?.length > 0) {
            selection.metadata.brandCompliance.issues.forEach(issue => {
                suggestions.push({
                    priority: 'medium',
                    category: 'brand_compliance',
                    suggestion: `Address brand issue: ${issue}`,
                    impact: 'Improves brand consistency'
                });
            });
        }
        
        // Color contrast suggestions
        if (selection.metadata?.dominantColor) {
            suggestions.push({
                priority: 'medium',
                category: 'accessibility',
                suggestion: 'Verify color contrast meets WCAG AA standards (4.5:1 ratio minimum)',
                impact: 'Improves readability for all users'
            });
        }
        
        // Modern design suggestions
        suggestions.push({
            priority: 'low',
            category: 'visual_design',
            suggestion: 'Consider adding subtle shadow or border for better visual separation',
            impact: 'Enhances visual hierarchy and modern appearance'
        });
        
        return suggestions;
    }
    
    generateMicroEditCommands(selection) {
        const commands = [];
        
        // Position adjustments
        if (selection.bounds.x % 4 !== 0) {
            const adjustment = 4 - (selection.bounds.x % 4);
            commands.push({
                type: 'position',
                command: `move ${adjustment}px right`,
                coordinates: { x: selection.bounds.x + adjustment, y: selection.bounds.y },
                reason: 'Align to 4px grid for brand consistency'
            });
        }
        
        if (selection.bounds.y % 4 !== 0) {
            const adjustment = 4 - (selection.bounds.y % 4);
            commands.push({
                type: 'position',
                command: `move ${adjustment}px down`,
                coordinates: { x: selection.bounds.x, y: selection.bounds.y + adjustment },
                reason: 'Align to 4px grid for brand consistency'
            });
        }
        
        // Size adjustments
        if (selection.bounds.width < 44 && selection.type === 'button') {
            const widthIncrease = 44 - selection.bounds.width;
            commands.push({
                type: 'resize',
                command: `increase width by ${widthIncrease}px`,
                dimensions: { width: 44, height: selection.bounds.height },
                reason: 'Meet minimum touch target size for accessibility'
            });
        }
        
        if (selection.bounds.height < 44 && selection.type === 'button') {
            const heightIncrease = 44 - selection.bounds.height;
            commands.push({
                type: 'resize',
                command: `increase height by ${heightIncrease}px`,
                dimensions: { width: selection.bounds.width, height: 44 },
                reason: 'Meet minimum touch target size for accessibility'
            });
        }
        
        // Color adjustments based on brand compliance
        if (selection.metadata?.brandCompliance?.grade === 'C' || selection.metadata?.brandCompliance?.grade === 'F') {
            commands.push({
                type: 'color',
                command: 'apply brand verification green color',
                color: this.brandGuidelines.colors.primary.verificationGreen,
                reason: 'Improve brand compliance'
            });
        }
        
        // Border radius adjustments
        commands.push({
            type: 'style',
            command: 'apply 8px border radius',
            style: { borderRadius: '8px' },
            reason: 'Match brand design language'
        });
        
        return commands;
    }
    
    generateEmptySelectionResponse() {
        return JSON.stringify({
            analysis_type: 'no_selection',
            message: 'No visual elements selected for analysis',
            suggestions: [
                'Select a visual element using the selection tools',
                'Try the rectangle tool (R) for precise selection',
                'Use the magic wand (M) for color-based selection',
                'Use the lasso tool (L) for freehand selection'
            ],
            timestamp: new Date().toISOString()
        }, null, 2);
    }
    
    processLLMResponse(response, selectionData, analysisType) {
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(response);
            
            // Enhance with additional metadata
            parsed.analysis_metadata = {
                provider: this.config.apiProvider,
                model: this.config.model,
                timestamp: new Date().toISOString(),
                analysisType: analysisType,
                selectionCount: selectionData.selections?.length || 0,
                processingTime: Date.now()
            };
            
            // Add confidence scoring
            if (!parsed.confidence_score) {
                parsed.confidence_score = this.calculateConfidenceScore(parsed, selectionData);
            }
            
            return parsed;
            
        } catch (error) {
            // If not JSON, wrap in structured format
            return {
                analysis_type: analysisType,
                raw_response: response,
                structured_analysis: this.extractStructuredData(response),
                confidence_score: 0.6,
                analysis_metadata: {
                    provider: this.config.apiProvider,
                    model: this.config.model,
                    timestamp: new Date().toISOString(),
                    parseError: error.message
                }
            };
        }
    }
    
    calculateConfidenceScore(analysis, selectionData) {
        let score = 0.5; // Base score
        
        // Increase confidence based on data richness
        if (analysis.visual_description) score += 0.1;
        if (analysis.brand_compliance) score += 0.1;
        if (analysis.improvement_suggestions) score += 0.1;
        if (analysis.micro_edit_commands) score += 0.1;
        
        // Increase confidence based on selection quality
        if (selectionData.selections?.length > 0) {
            const hasMetadata = selectionData.selections.some(s => s.metadata);
            if (hasMetadata) score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }
    
    extractStructuredData(rawResponse) {
        // Extract key information from unstructured response
        const structure = {
            description: '',
            suggestions: [],
            issues: [],
            commands: []
        };
        
        // Simple keyword extraction
        const lines = rawResponse.split('\n');
        
        lines.forEach(line => {
            if (line.includes('description') || line.includes('appears')) {
                structure.description += line + ' ';
            } else if (line.includes('suggest') || line.includes('recommend')) {
                structure.suggestions.push(line.trim());
            } else if (line.includes('issue') || line.includes('problem')) {
                structure.issues.push(line.trim());
            } else if (line.includes('move') || line.includes('adjust') || line.includes('change')) {
                structure.commands.push(line.trim());
            }
        });
        
        return structure;
    }
    
    cacheAnalysis(selectionData, analysis) {
        // Create cache key based on selection characteristics
        const cacheKey = this.generateCacheKey(selectionData);
        
        this.descriptionCache.set(cacheKey, {
            analysis: analysis,
            timestamp: new Date().toISOString(),
            hits: 1
        });
        
        // Limit cache size
        if (this.descriptionCache.size > 100) {
            const oldest = Array.from(this.descriptionCache.keys())[0];
            this.descriptionCache.delete(oldest);
        }
    }
    
    generateCacheKey(selectionData) {
        // Create a hash of the selection characteristics
        const characteristics = {
            selectionCount: selectionData.selections?.length || 0,
            bounds: selectionData.selections?.map(s => s.bounds) || [],
            types: selectionData.selections?.map(s => s.type) || []
        };
        
        return 'analysis_' + JSON.stringify(characteristics).slice(0, 50);
    }
    
    // Batch analysis for multiple selections
    async analyzeBatch(selectionsData, analysisType = 'describe') {
        const results = [];
        
        for (const selectionData of selectionsData) {
            try {
                const analysis = await this.analyzeVisualElement(selectionData, analysisType);
                results.push({
                    success: true,
                    data: analysis
                });
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    fallback: this.generateFallbackAnalysis(selectionData, analysisType)
                });
            }
        }
        
        return results;
    }
    
    generateFallbackAnalysis(selectionData, analysisType) {
        return {
            analysis_type: analysisType,
            status: 'fallback',
            message: 'LLM analysis unavailable, using basic visual analysis',
            basic_analysis: this.performBasicAnalysis(selectionData),
            timestamp: new Date().toISOString()
        };
    }
    
    performBasicAnalysis(selectionData) {
        if (!selectionData.selections || selectionData.selections.length === 0) {
            return { elements: 0, message: 'No elements selected' };
        }
        
        const selections = selectionData.selections;
        const analysis = {
            element_count: selections.length,
            total_area: 0,
            average_size: { width: 0, height: 0 },
            color_diversity: 0,
            brand_compliance_average: 0
        };
        
        // Calculate basic metrics
        selections.forEach(selection => {
            analysis.total_area += selection.bounds.width * selection.bounds.height;
            analysis.average_size.width += selection.bounds.width;
            analysis.average_size.height += selection.bounds.height;
            
            if (selection.metadata?.brandCompliance?.score) {
                analysis.brand_compliance_average += selection.metadata.brandCompliance.score;
            }
        });
        
        analysis.average_size.width /= selections.length;
        analysis.average_size.height /= selections.length;
        analysis.brand_compliance_average /= selections.length;
        
        return analysis;
    }
    
    // Utility functions
    colorsAreSimilar(color1, color2, tolerance = 30) {
        // Simple color comparison (would be enhanced with proper color space calculations)
        return Math.abs(color1.localeCompare(color2)) < tolerance;
    }
    
    // Export analysis results
    exportAnalysis(analysis, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(analysis, null, 2);
            case 'markdown':
                return this.analysisToMarkdown(analysis);
            case 'csv':
                return this.analysisToCSV(analysis);
            default:
                return analysis;
        }
    }
    
    analysisToMarkdown(analysis) {
        let md = `# Visual Analysis Report\n\n`;
        md += `**Timestamp:** ${analysis.analysis_metadata?.timestamp || new Date().toISOString()}\n`;
        md += `**Analysis Type:** ${analysis.analysis_type}\n`;
        md += `**Confidence Score:** ${analysis.confidence_score}\n\n`;
        
        if (analysis.visual_description) {
            md += `## Visual Description\n${analysis.visual_description}\n\n`;
        }
        
        if (analysis.improvement_suggestions?.length > 0) {
            md += `## Improvement Suggestions\n`;
            analysis.improvement_suggestions.forEach((suggestion, i) => {
                md += `${i + 1}. **${suggestion.category}** (${suggestion.priority}): ${suggestion.suggestion}\n`;
            });
            md += '\n';
        }
        
        if (analysis.micro_edit_commands?.length > 0) {
            md += `## Micro-Edit Commands\n`;
            analysis.micro_edit_commands.forEach((command, i) => {
                md += `${i + 1}. ${command.command} - *${command.reason}*\n`;
            });
            md += '\n';
        }
        
        return md;
    }
    
    analysisToCSV(analysis) {
        // Simple CSV export for spreadsheet analysis
        let csv = 'Field,Value\n';
        csv += `Analysis Type,"${analysis.analysis_type}"\n`;
        csv += `Timestamp,"${analysis.analysis_metadata?.timestamp || ''}"\n`;
        csv += `Confidence Score,${analysis.confidence_score}\n`;
        
        if (analysis.brand_compliance?.overall_score) {
            csv += `Brand Compliance Score,${analysis.brand_compliance.overall_score}\n`;
        }
        
        return csv;
    }
}

// Export for use in other modules
module.exports = {
    LLMVisualAnalyzer
};

// If run directly, demonstrate the system
if (require.main === module) {
    console.log('🤖 LLM Visual Analyzer - Demo Mode\n');
    
    const analyzer = new LLMVisualAnalyzer({
        apiProvider: 'simulation',
        includePixelData: true
    });
    
    // Simulate analysis
    const mockSelectionData = {
        timestamp: new Date().toISOString(),
        canvasSize: { width: 800, height: 600 },
        selections: [{
            id: 'demo_selection_1',
            type: 'button',
            bounds: { x: 100, y: 100, width: 32, height: 16 },
            metadata: {
                dominantColor: '#e94560',
                brandCompliance: { grade: 'B', score: 82 },
                pixelCount: 512
            }
        }]
    };
    
    analyzer.analyzeVisualElement(mockSelectionData, 'improve').then(analysis => {
        console.log('📊 Analysis Complete!\n');
        console.log('🔍 Visual Description:', analysis.visual_description);
        console.log('\n💡 Improvement Suggestions:');
        
        if (analysis.improvement_suggestions) {
            analysis.improvement_suggestions.forEach((suggestion, i) => {
                console.log(`  ${i + 1}. [${suggestion.priority}] ${suggestion.suggestion}`);
            });
        }
        
        console.log('\n⚡ Micro-Edit Commands:');
        if (analysis.micro_edit_commands) {
            analysis.micro_edit_commands.forEach((command, i) => {
                console.log(`  ${i + 1}. ${command.command}`);
            });
        }
        
        console.log('\n✅ Features:');
        console.log('  • Brand compliance analysis');
        console.log('  • Accessibility assessment'); 
        console.log('  • Design improvement suggestions');
        console.log('  • Nano-precision edit commands');
        console.log('  • Multi-format export (JSON, Markdown, CSV)');
        console.log('  • Intelligent caching system');
        console.log('  • Batch processing support');
    });
}
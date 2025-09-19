#!/usr/bin/env node
// VISUAL-UX-COMPILER.js - Parse emojis/comments as UX directives for compilation
// Solves: "technically right but visually wrong" by embedding UX rules in code

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class VisualUXCompiler {
    constructor() {
        this.port = 7000; // Visual UX compiler port
        this.basePath = __dirname;
        
        // EMOJI → UX DIRECTIVE MAPPINGS
        this.emojiDirectives = {
            // Visual Design Emojis
            '🎨': { directive: 'visual_priority', weight: 0.9, description: 'Prioritize visual design' },
            '✨': { directive: 'polish_required', weight: 0.8, description: 'Needs visual polish' },
            '🌈': { directive: 'colorful_design', weight: 0.7, description: 'Use vibrant colors' },
            '🎭': { directive: 'dramatic_styling', weight: 0.6, description: 'Bold visual style' },
            '💫': { directive: 'magical_effects', weight: 0.8, description: 'Add visual effects' },
            
            // User Experience Emojis  
            '👥': { directive: 'user_focused', weight: 0.9, description: 'User-centric design' },
            '🚀': { directive: 'performance_critical', weight: 0.95, description: 'Optimize for speed' },
            '📱': { directive: 'mobile_first', weight: 0.85, description: 'Mobile-optimized' },
            '🎯': { directive: 'conversion_focused', weight: 0.8, description: 'Drive user actions' },
            '🔥': { directive: 'engagement_boost', weight: 0.8, description: 'Maximize engagement' },
            
            // Accessibility & Usability
            '♿': { directive: 'accessibility_required', weight: 0.95, description: 'Full accessibility compliance' },
            '👀': { directive: 'visibility_important', weight: 0.8, description: 'Ensure high visibility' },
            '🔍': { directive: 'searchable_content', weight: 0.7, description: 'SEO optimized' },
            '📖': { directive: 'readable_text', weight: 0.8, description: 'Focus on readability' },
            '⚡': { directive: 'instant_feedback', weight: 0.9, description: 'Immediate user feedback' },
            
            // Brand & Monetization
            '💰': { directive: 'monetization_focused', weight: 0.8, description: 'Revenue-generating design' },
            '🏆': { directive: 'premium_quality', weight: 0.9, description: 'High-quality finish' },
            '💎': { directive: 'luxury_feel', weight: 0.8, description: 'Premium aesthetic' },
            '🎪': { directive: 'fun_engaging', weight: 0.7, description: 'Playful design' },
            '🛡️': { directive: 'trust_building', weight: 0.8, description: 'Build user trust' },
            
            // Error & Warning States
            '⚠️': { directive: 'warning_prominent', weight: 0.9, description: 'Make warnings visible' },
            '❌': { directive: 'error_clear', weight: 0.95, description: 'Clear error messaging' },
            '✅': { directive: 'success_celebrated', weight: 0.8, description: 'Celebrate success states' },
            '🚨': { directive: 'urgent_attention', weight: 0.95, description: 'Requires immediate attention' },
            '🔧': { directive: 'fix_available', weight: 0.7, description: 'Show fix options' }
        };
        
        // COMMENT PATTERN → UX DIRECTIVE MAPPINGS
        this.commentDirectives = {
            // UX-specific comments
            '// UX': { directive: 'ux_consideration', weight: 0.9, description: 'UX design consideration' },
            '// UI': { directive: 'interface_design', weight: 0.8, description: 'Interface design rule' },
            '// VISUAL': { directive: 'visual_requirement', weight: 0.8, description: 'Visual design requirement' },
            '// BRAND': { directive: 'brand_compliance', weight: 0.85, description: 'Brand guideline compliance' },
            '// A11Y': { directive: 'accessibility_note', weight: 0.95, description: 'Accessibility requirement' },
            
            // Performance comments
            '// PERF': { directive: 'performance_critical', weight: 0.9, description: 'Performance optimization' },
            '// SPEED': { directive: 'speed_optimization', weight: 0.85, description: 'Speed-critical code' },
            '// MOBILE': { directive: 'mobile_optimization', weight: 0.8, description: 'Mobile-specific optimization' },
            
            // User feedback comments
            '// FEEDBACK': { directive: 'user_feedback', weight: 0.8, description: 'Based on user feedback' },
            '// TESTED': { directive: 'user_tested', weight: 0.9, description: 'User-tested design' },
            '// POPULAR': { directive: 'user_preferred', weight: 0.8, description: 'User-preferred option' },
            
            // Design system comments
            '// DESIGN_SYSTEM': { directive: 'design_system_compliance', weight: 0.85, description: 'Follow design system' },
            '// TYPOGRAPHY': { directive: 'typography_rule', weight: 0.7, description: 'Typography guideline' },
            '// COLOR': { directive: 'color_scheme', weight: 0.7, description: 'Color scheme rule' },
            '// SPACING': { directive: 'spacing_rule', weight: 0.7, description: 'Spacing guideline' },
            
            // Error handling comments
            '// USER_ERROR': { directive: 'user_error_handling', weight: 0.9, description: 'User error prevention' },
            '// VALIDATION': { directive: 'input_validation', weight: 0.85, description: 'Input validation UX' },
            '// LOADING': { directive: 'loading_state', weight: 0.8, description: 'Loading state design' }
        };
        
        // UX COMPILATION RULES - How to apply directives
        this.compilationRules = {
            'visual_priority': {
                css_additions: ['box-shadow', 'border-radius', 'gradient', 'animation'],
                html_attributes: ['class="featured"', 'style="z-index: 10"'],
                js_enhancements: ['addVisualEffects()', 'highlightElement()'],
                performance_cost: 0.3
            },
            
            'performance_critical': {
                optimizations: ['lazy-loading', 'minification', 'caching', 'cdn'],
                html_attributes: ['loading="lazy"', 'decoding="async"'],
                js_enhancements: ['debounce()', 'throttle()', 'memoize()'],
                performance_cost: -0.5 // Actually improves performance
            },
            
            'accessibility_required': {
                html_attributes: ['aria-label', 'role', 'tabindex', 'alt'],
                css_additions: ['focus-visible', 'high-contrast', 'screen-reader-only'],
                js_enhancements: ['addKeyboardNavigation()', 'announceChanges()'],
                performance_cost: 0.1
            },
            
            'mobile_first': {
                css_additions: ['@media (max-width: 768px)', 'touch-action', 'viewport-fit'],
                html_attributes: ['data-mobile-optimized="true"'],
                js_enhancements: ['detectTouch()', 'adaptToScreenSize()'],
                performance_cost: 0.2
            },
            
            'user_focused': {
                css_additions: ['user-select', 'cursor: pointer', 'transition'],
                html_attributes: ['data-user-action="true"'],
                js_enhancements: ['trackUserInteraction()', 'improveUX()'],
                performance_cost: 0.15
            }
        };
        
        // BRAND GUIDELINES - Ensure visual consistency
        this.brandGuidelines = {
            colors: {
                primary: '#00ff00',      // Matrix green
                secondary: '#ffff00',    // Warning yellow  
                accent: '#ff6600',       // RuneScape orange
                background: '#1a1a1a',   // Dark base
                text: '#ffffff',         // White text
                error: '#ff0000',        // Error red
                success: '#00ff00',      // Success green
                warning: '#ffff00'       // Warning yellow
            },
            
            typography: {
                primary: "'Courier New', monospace",
                sizes: ['0.8em', '1em', '1.2em', '1.5em', '2em', '3em'],
                weights: ['normal', 'bold'],
                line_heights: ['1.2', '1.4', '1.6']
            },
            
            spacing: {
                base_unit: '8px',
                scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
                margins: ['8px', '16px', '24px', '32px'],
                paddings: ['8px', '16px', '24px', '32px']
            },
            
            effects: {
                shadows: ['0 2px 4px rgba(0,0,0,0.2)', '0 4px 8px rgba(0,0,0,0.3)'],
                borders: ['1px solid #333', '2px solid #00ff00'],
                radius: ['3px', '5px', '10px', '50%'],
                transitions: ['all 0.3s ease', 'transform 0.2s ease']
            }
        };
        
        console.log('🎨 VISUAL UX COMPILER');
        console.log('=====================');
        console.log('🎯 Parse emojis/comments as UX directives');
        console.log('✨ Compile with visual design priorities');
        console.log('🎪 Ensure brand consistency');
    }
    
    // MAIN COMPILATION FUNCTION - Parse and apply UX directives
    async compileWithUXDirectives(fileContent, filePath = '') {
        console.log('\n🎨 COMPILING WITH UX DIRECTIVES');
        console.log('===============================');
        
        // Step 1: Extract emojis and comments
        const emojis = this.extractEmojis(fileContent);
        const comments = this.extractComments(fileContent);
        
        console.log(`🔍 Found ${emojis.length} emojis, ${comments.length} comments`);
        
        // Step 2: Parse directives
        const emojiDirectives = this.parseEmojiDirectives(emojis);
        const commentDirectives = this.parseCommentDirectives(comments);
        
        const allDirectives = [...emojiDirectives, ...commentDirectives];
        console.log(`📋 Parsed ${allDirectives.length} UX directives`);
        
        // Step 3: Apply compilation rules
        const compiledResult = await this.applyUXCompilation(fileContent, allDirectives, filePath);
        
        // Step 4: Validate brand compliance
        const brandCompliance = this.validateBrandCompliance(compiledResult);
        
        console.log('✅ UX compilation complete');
        
        return {
            original: fileContent,
            compiled: compiledResult.content,
            directives_applied: allDirectives,
            brand_compliance: brandCompliance,
            performance_impact: compiledResult.performance_impact,
            ux_score: this.calculateUXScore(allDirectives),
            suggestions: this.generateUXSuggestions(allDirectives, brandCompliance)
        };
    }
    
    extractEmojis(content) {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const matches = content.match(emojiRegex) || [];
        
        return matches.map(emoji => ({
            emoji,
            position: content.indexOf(emoji),
            context: this.getEmojiContext(content, emoji)
        }));
    }
    
    getEmojiContext(content, emoji) {
        const index = content.indexOf(emoji);
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(content.length, index + 50);
        return content.substring(contextStart, contextEnd).trim();
    }
    
    extractComments(content) {
        const comments = [];
        
        // JavaScript/CSS style comments
        const jsComments = content.match(//.*$/gm) || [];
        comments.push(...jsComments.map(comment => ({
            comment: comment.trim(),
            type: 'line',
            position: content.indexOf(comment)
        })));
        
        // Multi-line comments
        const multiComments = content.match(/\/\*[\s\S]*?\*\//g) || [];
        comments.push(...multiComments.map(comment => ({
            comment: comment.trim(),
            type: 'block',
            position: content.indexOf(comment)
        })));
        
        // HTML comments
        const htmlComments = content.match(/<!--[\s\S]*?-->/g) || [];
        comments.push(...htmlComments.map(comment => ({
            comment: comment.trim(),
            type: 'html',
            position: content.indexOf(comment)
        })));
        
        return comments;
    }
    
    parseEmojiDirectives(emojis) {
        const directives = [];
        
        for (const emojiData of emojis) {
            const directive = this.emojiDirectives[emojiData.emoji];
            if (directive) {
                directives.push({
                    type: 'emoji',
                    source: emojiData.emoji,
                    directive: directive.directive,
                    weight: directive.weight,
                    description: directive.description,
                    context: emojiData.context,
                    position: emojiData.position
                });
            }
        }
        
        return directives;
    }
    
    parseCommentDirectives(comments) {
        const directives = [];
        
        for (const commentData of comments) {
            // Check each comment pattern
            for (const [pattern, directive] of Object.entries(this.commentDirectives)) {
                if (commentData.comment.toUpperCase().includes(pattern)) {
                    directives.push({
                        type: 'comment',
                        source: commentData.comment,
                        directive: directive.directive,
                        weight: directive.weight,
                        description: directive.description,
                        comment_type: commentData.type,
                        position: commentData.position
                    });
                }
            }
        }
        
        return directives;
    }
    
    async applyUXCompilation(content, directives, filePath) {
        let compiledContent = content;
        let performanceImpact = 0;
        const appliedRules = [];
        
        // Group directives by type for efficient processing
        const directiveGroups = this.groupDirectives(directives);
        
        // Apply each directive group
        for (const [directiveType, directiveList] of Object.entries(directiveGroups)) {
            const rule = this.compilationRules[directiveType];
            if (rule) {
                const result = await this.applyCompilationRule(compiledContent, rule, directiveList, filePath);
                compiledContent = result.content;
                performanceImpact += result.performance_impact;
                appliedRules.push({
                    directive: directiveType,
                    count: directiveList.length,
                    changes: result.changes
                });
            }
        }
        
        return {
            content: compiledContent,
            performance_impact: performanceImpact,
            applied_rules: appliedRules
        };
    }
    
    groupDirectives(directives) {
        const groups = {};
        
        for (const directive of directives) {
            if (!groups[directive.directive]) {
                groups[directive.directive] = [];
            }
            groups[directive.directive].push(directive);
        }
        
        return groups;
    }
    
    async applyCompilationRule(content, rule, directives, filePath) {
        let modifiedContent = content;
        const changes = [];
        let performanceImpact = rule.performance_cost || 0;
        
        // Determine file type for appropriate modifications
        const fileExtension = path.extname(filePath).toLowerCase();
        
        // Apply CSS additions for appropriate files
        if ((fileExtension === '.html' || fileExtension === '.css') && rule.css_additions) {
            const cssResult = this.applyCSSEnhancements(modifiedContent, rule.css_additions, fileExtension);
            modifiedContent = cssResult.content;
            changes.push(...cssResult.changes);
        }
        
        // Apply HTML attributes for HTML files
        if (fileExtension === '.html' && rule.html_attributes) {
            const htmlResult = this.applyHTMLEnhancements(modifiedContent, rule.html_attributes);
            modifiedContent = htmlResult.content;
            changes.push(...htmlResult.changes);
        }
        
        // Apply JavaScript enhancements for JS files
        if ((fileExtension === '.js' || fileExtension === '.html') && rule.js_enhancements) {
            const jsResult = this.applyJSEnhancements(modifiedContent, rule.js_enhancements, fileExtension);
            modifiedContent = jsResult.content;
            changes.push(...jsResult.changes);
        }
        
        // Apply optimizations
        if (rule.optimizations) {
            const optResult = this.applyOptimizations(modifiedContent, rule.optimizations, fileExtension);
            modifiedContent = optResult.content;
            changes.push(...optResult.changes);
            performanceImpact += optResult.performance_improvement;
        }
        
        return {
            content: modifiedContent,
            performance_impact: performanceImpact * directives.length, // Scale by directive count
            changes
        };
    }
    
    applyCSSEnhancements(content, enhancements, fileType) {
        const changes = [];
        let modifiedContent = content;
        
        for (const enhancement of enhancements) {
            switch (enhancement) {
                case 'box-shadow':
                    if (!content.includes('box-shadow') && fileType === '.css') {
                        modifiedContent += `\n/* UX Enhancement: Visual depth */\n.ux-enhanced { box-shadow: ${this.brandGuidelines.effects.shadows[0]}; }`;
                        changes.push('Added box-shadow for visual depth');
                    } else if (fileType === '.html' && !content.includes('box-shadow')) {
                        modifiedContent = modifiedContent.replace(/<style>/gi, 
                            `<style>\n.ux-enhanced { box-shadow: ${this.brandGuidelines.effects.shadows[0]}; }`);
                        changes.push('Added inline box-shadow styles');
                    }
                    break;
                    
                case 'border-radius':
                    if (!content.includes('border-radius')) {
                        const radiusRule = `border-radius: ${this.brandGuidelines.effects.radius[1]};`;
                        if (fileType === '.css') {
                            modifiedContent += `\n/* UX Enhancement: Rounded corners */\n.ux-rounded { ${radiusRule} }`;
                        } else if (fileType === '.html') {
                            modifiedContent = modifiedContent.replace(/<style>/gi, 
                                `<style>\n.ux-rounded { ${radiusRule} }`);
                        }
                        changes.push('Added border-radius for modern look');
                    }
                    break;
                    
                case 'animation':
                    if (!content.includes('transition') && !content.includes('animation')) {
                        const transitionRule = `transition: ${this.brandGuidelines.effects.transitions[0]};`;
                        if (fileType === '.css') {
                            modifiedContent += `\n/* UX Enhancement: Smooth transitions */\n.ux-animated { ${transitionRule} }`;
                        }
                        changes.push('Added smooth transitions for better UX');
                    }
                    break;
            }
        }
        
        return { content: modifiedContent, changes };
    }
    
    applyHTMLEnhancements(content, enhancements) {
        const changes = [];
        let modifiedContent = content;
        
        for (const enhancement of enhancements) {
            if (enhancement.includes('aria-label') && !content.includes('aria-label')) {
                // Add aria-label to buttons and interactive elements
                modifiedContent = modifiedContent.replace(
                    /<button(?![^>]*aria-label)/gi,
                    '<button aria-label="Interactive button"'
                );
                changes.push('Added aria-label attributes for accessibility');
            }
            
            if (enhancement.includes('loading="lazy"') && !content.includes('loading=')) {
                // Add lazy loading to images
                modifiedContent = modifiedContent.replace(
                    /<img(?![^>]*loading=)/gi,
                    '<img loading="lazy"'
                );
                changes.push('Added lazy loading to images for performance');
            }
            
            if (enhancement.includes('data-mobile-optimized')) {
                // Add mobile optimization flag
                modifiedContent = modifiedContent.replace(
                    /<body/gi,
                    '<body data-mobile-optimized="true"'
                );
                changes.push('Added mobile optimization flag');
            }
        }
        
        return { content: modifiedContent, changes };
    }
    
    applyJSEnhancements(content, enhancements, fileType) {
        const changes = [];
        let modifiedContent = content;
        
        // Add UX enhancement functions
        const uxFunctions = {
            'addVisualEffects()': `
// UX Enhancement: Visual effects
function addVisualEffects(element) {
    element.style.transition = '${this.brandGuidelines.effects.transitions[0]}';
    element.addEventListener('mouseenter', () => {
        element.style.transform = 'scale(1.05)';
    });
    element.addEventListener('mouseleave', () => {
        element.style.transform = 'scale(1)';
    });
}`,
            
            'debounce()': `
// UX Enhancement: Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}`,
            
            'addKeyboardNavigation()': `
// UX Enhancement: Accessibility
function addKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
}`
        };
        
        for (const enhancement of enhancements) {
            if (uxFunctions[enhancement] && !content.includes(enhancement.replace('()', ''))) {
                if (fileType === '.js') {
                    modifiedContent += '\n' + uxFunctions[enhancement];
                } else if (fileType === '.html' && content.includes('<script>')) {
                    modifiedContent = modifiedContent.replace(
                        '<script>',
                        '<script>' + uxFunctions[enhancement]
                    );
                }
                changes.push(`Added UX enhancement function: ${enhancement}`);
            }
        }
        
        return { content: modifiedContent, changes };
    }
    
    applyOptimizations(content, optimizations, fileType) {
        const changes = [];
        let modifiedContent = content;
        let performanceImprovement = 0;
        
        for (const optimization of optimizations) {
            switch (optimization) {
                case 'lazy-loading':
                    if (fileType === '.html' && content.includes('<img') && !content.includes('loading=')) {
                        modifiedContent = modifiedContent.replace(/<img/gi, '<img loading="lazy"');
                        changes.push('Added lazy loading to images');
                        performanceImprovement += 0.2;
                    }
                    break;
                    
                case 'minification':
                    // Simulate minification by removing extra whitespace
                    if (fileType === '.css' || (fileType === '.html' && content.includes('<style>'))) {
                        const originalLength = modifiedContent.length;
                        modifiedContent = modifiedContent.replace(/\s+/g, ' ').trim();
                        const savings = (originalLength - modifiedContent.length) / originalLength;
                        changes.push(`Minified content (${(savings * 100).toFixed(1)}% reduction)`);
                        performanceImprovement += savings * 0.3;
                    }
                    break;
                    
                case 'caching':
                    if (fileType === '.html') {
                        modifiedContent = modifiedContent.replace(
                            '<head>',
                            '<head>\n<meta http-equiv="Cache-Control" content="public, max-age=31536000">'
                        );
                        changes.push('Added caching headers');
                        performanceImprovement += 0.1;
                    }
                    break;
            }
        }
        
        return { content: modifiedContent, changes, performance_improvement: performanceImprovement };
    }
    
    validateBrandCompliance(result) {
        const compliance = {
            colors: { score: 0.8, issues: [] }, // Assume good by default
            typography: { score: 0.8, issues: [] },
            spacing: { score: 0.8, issues: [] },
            overall: 0.8
        };
        
        // Check for brand color usage
        const brandColors = Object.values(this.brandGuidelines.colors);
        const hasSystemColors = brandColors.some(color => result.content.includes(color));
        
        if (!hasSystemColors) {
            compliance.colors.score = 0.5;
            compliance.colors.issues.push('No brand colors detected');
        }
        
        // Check for typography compliance
        if (!result.content.includes(this.brandGuidelines.typography.primary)) {
            compliance.typography.score = 0.6;
            compliance.typography.issues.push('Brand typography not used');
        }
        
        // Calculate overall compliance
        compliance.overall = (compliance.colors.score + compliance.typography.score + compliance.spacing.score) / 3;
        
        return compliance;
    }
    
    calculateUXScore(directives) {
        if (directives.length === 0) return 0.5; // Neutral score
        
        const totalWeight = directives.reduce((sum, directive) => sum + directive.weight, 0);
        const avgWeight = totalWeight / directives.length;
        
        // Bonus for directive diversity
        const uniqueDirectives = new Set(directives.map(d => d.directive)).size;
        const diversityBonus = Math.min(uniqueDirectives * 0.1, 0.3);
        
        return Math.min(avgWeight + diversityBonus, 1.0);
    }
    
    generateUXSuggestions(directives, brandCompliance) {
        const suggestions = [];
        
        // Suggest missing UX directives
        const presentDirectives = new Set(directives.map(d => d.directive));
        
        if (!presentDirectives.has('accessibility_required')) {
            suggestions.push({
                type: 'accessibility',
                priority: 'high',
                suggestion: 'Add ♿ emoji or // A11Y comment to improve accessibility',
                impact: 'Improves usability for all users'
            });
        }
        
        if (!presentDirectives.has('performance_critical') && directives.length > 5) {
            suggestions.push({
                type: 'performance',
                priority: 'medium',
                suggestion: 'Add 🚀 emoji or // PERF comment for performance optimization',
                impact: 'Faster loading and better user experience'
            });
        }
        
        if (!presentDirectives.has('mobile_first') && !presentDirectives.has('mobile_optimization')) {
            suggestions.push({
                type: 'mobile',
                priority: 'high',
                suggestion: 'Add 📱 emoji or // MOBILE comment for mobile optimization',
                impact: 'Better experience on mobile devices'
            });
        }
        
        // Brand compliance suggestions
        if (brandCompliance.overall < 0.7) {
            suggestions.push({
                type: 'branding',
                priority: 'medium',
                suggestion: 'Use brand colors and typography for consistency',
                impact: 'Stronger brand recognition and professional appearance'
            });
        }
        
        return suggestions;
    }
    
    // BATCH COMPILE - Process multiple files
    async batchCompile(directory) {
        console.log('\n🏭 BATCH UX COMPILATION');
        console.log('=======================');
        
        const results = [];
        const files = this.scanDirectory(directory);
        
        console.log(`📁 Processing ${files.length} files...`);
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const result = await this.compileWithUXDirectives(content, file);
                
                results.push({
                    file: path.relative(directory, file),
                    ux_score: result.ux_score,
                    directives_count: result.directives_applied.length,
                    brand_compliance: result.brand_compliance.overall,
                    performance_impact: result.performance_impact,
                    suggestions_count: result.suggestions.length
                });
                
                console.log(`✅ ${path.basename(file)} - UX Score: ${result.ux_score.toFixed(2)}`);
            } catch (error) {
                console.warn(`⚠️ Failed to process ${file}: ${error.message}`);
            }
        }
        
        return this.generateBatchReport(results);
    }
    
    scanDirectory(dir, extensions = ['.html', '.css', '.js', '.md']) {
        const files = [];
        
        const scanRecursive = (currentDir) => {
            if (!fs.existsSync(currentDir)) return;
            
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanRecursive(fullPath);
                } else if (stat.isFile() && extensions.includes(path.extname(item))) {
                    files.push(fullPath);
                }
            }
        };
        
        scanRecursive(dir);
        return files;
    }
    
    generateBatchReport(results) {
        const report = {
            summary: {
                total_files: results.length,
                avg_ux_score: results.reduce((sum, r) => sum + r.ux_score, 0) / results.length,
                avg_brand_compliance: results.reduce((sum, r) => sum + r.brand_compliance, 0) / results.length,
                total_directives: results.reduce((sum, r) => sum + r.directives_count, 0),
                files_needing_attention: results.filter(r => r.ux_score < 0.6).length
            },
            top_performers: results.sort((a, b) => b.ux_score - a.ux_score).slice(0, 5),
            needs_improvement: results.filter(r => r.ux_score < 0.6),
            performance_impact: results.reduce((sum, r) => sum + r.performance_impact, 0),
            overall_grade: this.calculateOverallGrade(results)
        };
        
        return report;
    }
    
    calculateOverallGrade(results) {
        const avgScore = results.reduce((sum, r) => sum + r.ux_score, 0) / results.length;
        
        if (avgScore >= 0.9) return 'A+';
        if (avgScore >= 0.8) return 'A';
        if (avgScore >= 0.7) return 'B';
        if (avgScore >= 0.6) return 'C';
        if (avgScore >= 0.5) return 'D';
        return 'F';
    }
    
    // START SERVER for UX compilation interface
    start() {
        const http = require('http');
        
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                await this.serveInterface(res);
            } else if (req.url === '/api/compile' && req.method === 'POST') {
                await this.handleCompileRequest(req, res);
            } else if (req.url === '/api/batch-compile' && req.method === 'POST') {
                await this.handleBatchCompileRequest(req, res);
            } else if (req.url === '/api/directives') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    emoji_directives: this.emojiDirectives,
                    comment_directives: this.commentDirectives,
                    brand_guidelines: this.brandGuidelines
                }, null, 2));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port);
        console.log(`\n🎨 Visual UX Compiler: http://localhost:${this.port}`);
        console.log('🎯 Parse emojis/comments as UX compilation directives');
        console.log('✨ Ensure brand consistency and visual quality');
    }
    
    async handleCompileRequest(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { content, filePath } = JSON.parse(body);
                const result = await this.compileWithUXDirectives(content, filePath || 'untitled.html');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, result }, null, 2));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async handleBatchCompileRequest(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { directory } = JSON.parse(body);
                const report = await this.batchCompile(directory || this.basePath);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, report }, null, 2));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async serveInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🎨 Visual UX Compiler</title>
    <style>
        body {
            font-family: ${this.brandGuidelines.typography.primary};
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            color: ${this.brandGuidelines.colors.text};
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            font-size: 3em;
            color: ${this.brandGuidelines.colors.primary};
            text-shadow: 0 0 20px ${this.brandGuidelines.colors.primary};
            margin-bottom: 30px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .compiler-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        
        .compiler-section {
            background: rgba(0, 0, 0, 0.6);
            border: 2px solid ${this.brandGuidelines.colors.primary};
            border-radius: ${this.brandGuidelines.effects.radius[2]};
            padding: 20px;
        }
        
        .section-title {
            font-size: 1.5em;
            color: ${this.brandGuidelines.colors.secondary};
            margin-bottom: 15px;
            text-shadow: 2px 2px 0 #000;
        }
        
        textarea {
            width: 100%;
            height: 300px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid ${this.brandGuidelines.colors.primary};
            border-radius: ${this.brandGuidelines.effects.radius[0]};
            padding: 15px;
            color: ${this.brandGuidelines.colors.text};
            font-family: ${this.brandGuidelines.typography.primary};
            font-size: 0.9em;
            resize: vertical;
        }
        
        button {
            background: linear-gradient(135deg, ${this.brandGuidelines.colors.primary} 0%, #00cc00 100%);
            color: #000000;
            border: none;
            padding: 15px 30px;
            border-radius: ${this.brandGuidelines.effects.radius[0]};
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 5px;
            transition: ${this.brandGuidelines.effects.transitions[0]};
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: ${this.brandGuidelines.effects.shadows[1]};
        }
        
        .directive-guide {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid ${this.brandGuidelines.colors.secondary};
            border-radius: ${this.brandGuidelines.effects.radius[1]};
            padding: 20px;
            margin: 20px 0;
        }
        
        .directive-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .directive-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #333;
            border-radius: ${this.brandGuidelines.effects.radius[0]};
            padding: 10px;
            text-align: center;
        }
        
        .emoji-large {
            font-size: 2em;
            display: block;
            margin-bottom: 5px;
        }
        
        .results-section {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid ${this.brandGuidelines.colors.accent};
            border-radius: ${this.brandGuidelines.effects.radius[1]};
            padding: 20px;
            margin: 20px 0;
            display: none;
        }
        
        .ux-score {
            font-size: 2em;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            border-radius: ${this.brandGuidelines.effects.radius[1]};
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(255, 255, 0, 0.2) 100%);
        }
        
        .suggestions-list {
            list-style: none;
            padding: 0;
        }
        
        .suggestion-item {
            background: rgba(255, 165, 0, 0.1);
            border-left: 4px solid ${this.brandGuidelines.colors.accent};
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 ${this.brandGuidelines.effects.radius[0]} ${this.brandGuidelines.effects.radius[0]} 0;
        }
        
        .performance-meter {
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: ${this.brandGuidelines.effects.radius[2]};
            overflow: hidden;
            margin: 10px 0;
        }
        
        .performance-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff0000 0%, #ffff00 50%, #00ff00 100%);
            border-radius: ${this.brandGuidelines.effects.radius[2]};
            transition: width 0.5s ease;
        }
        
        pre {
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #333;
            border-radius: ${this.brandGuidelines.effects.radius[0]};
            padding: 15px;
            overflow-x: auto;
            font-size: 0.85em;
            white-space: pre-wrap;
        }
        
        .brand-compliance {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 15px 0;
        }
        
        .compliance-item {
            text-align: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: ${this.brandGuidelines.effects.radius[0]};
        }
    </style>
</head>
<body>
    <div class="header">
        🎨 VISUAL UX COMPILER
    </div>
    
    <div class="container">
        <div class="directive-guide">
            <div class="section-title">📋 UX Directive Guide</div>
            <p style="color: #cccccc;">Use emojis and comments to guide UX compilation:</p>
            
            <div class="directive-grid">
                <div class="directive-item">
                    <span class="emoji-large">🎨</span>
                    <div style="color: ${this.brandGuidelines.colors.secondary};">Visual Priority</div>
                    <div style="font-size: 0.8em; color: #999;">Prioritize visual design</div>
                </div>
                <div class="directive-item">
                    <span class="emoji-large">🚀</span>
                    <div style="color: ${this.brandGuidelines.colors.secondary};">Performance</div>
                    <div style="font-size: 0.8em; color: #999;">Optimize for speed</div>
                </div>
                <div class="directive-item">
                    <span class="emoji-large">📱</span>
                    <div style="color: ${this.brandGuidelines.colors.secondary};">Mobile First</div>
                    <div style="font-size: 0.8em; color: #999;">Mobile optimized</div>
                </div>
                <div class="directive-item">
                    <span class="emoji-large">♿</span>
                    <div style="color: ${this.brandGuidelines.colors.secondary};">Accessibility</div>
                    <div style="font-size: 0.8em; color: #999;">Full a11y compliance</div>
                </div>
                <div class="directive-item">
                    <span class="emoji-large">💰</span>
                    <div style="color: ${this.brandGuidelines.colors.secondary};">Monetization</div>
                    <div style="font-size: 0.8em; color: #999;">Revenue focused</div>
                </div>
                <div class="directive-item">
                    <span style="font-size: 1.2em; color: ${this.brandGuidelines.colors.primary};">// UX</span>
                    <div style="color: ${this.brandGuidelines.colors.secondary};">UX Comment</div>
                    <div style="font-size: 0.8em; color: #999;">UX consideration</div>
                </div>
            </div>
        </div>
        
        <div class="compiler-grid">
            <div class="compiler-section">
                <div class="section-title">📝 Input Code</div>
                <textarea id="inputCode" placeholder="Paste your HTML, CSS, or JavaScript code here...
Example with UX directives:

<!-- 🎨 This section needs visual priority -->
<div class='hero-section'>
  <h1>Welcome</h1> <!-- 🚀 Performance critical title -->
  <button>Get Started</button> <!-- ♿ Accessibility required -->
</div>

<style>
/* // UX: Make buttons more engaging */
.btn { 
  background: #007bff; 
  /* 💰 Conversion-focused styling */
}
</style>"></textarea>
                
                <div style="margin-top: 15px;">
                    <button onclick="compileCode()">🎨 COMPILE WITH UX</button>
                    <button onclick="showDirectives()">📋 SHOW DIRECTIVES</button>
                </div>
            </div>
            
            <div class="compiler-section">
                <div class="section-title">✨ Compiled Output</div>
                <textarea id="outputCode" readonly placeholder="UX-compiled code will appear here..."></textarea>
                
                <div style="margin-top: 15px;">
                    <button onclick="copyOutput()">📋 COPY OUTPUT</button>
                    <button onclick="downloadOutput()">💾 DOWNLOAD</button>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <button onclick="batchCompile()">🏭 BATCH COMPILE DIRECTORY</button>
            <button onclick="showBrandGuidelines()">🎪 BRAND GUIDELINES</button>
        </div>
        
        <div id="results" class="results-section">
            <h3 style="color: ${this.brandGuidelines.colors.secondary}; margin-top: 0;">UX Compilation Results</h3>
            <div id="resultsContent"></div>
        </div>
    </div>
    
    <script>
        let compilationResult = null;
        
        async function compileCode() {
            const inputCode = document.getElementById('inputCode').value;
            if (!inputCode.trim()) {
                alert('Please enter some code to compile');
                return;
            }
            
            try {
                const response = await fetch('/api/compile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        content: inputCode,
                        filePath: 'example.html'
                    })
                });
                
                const result = await response.json();
                compilationResult = result.result;
                
                // Update output
                document.getElementById('outputCode').value = compilationResult.compiled;
                
                // Show results
                showCompilationResults();
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        function showCompilationResults() {
            if (!compilationResult) return;
            
            const resultsDiv = document.getElementById('results');
            const contentDiv = document.getElementById('resultsContent');
            
            let html = '';
            
            // UX Score
            html += '<div class="ux-score">';
            html += '<div style="color: ${this.brandGuidelines.colors.primary};">UX SCORE</div>';
            html += '<div style="color: ' + getScoreColor(compilationResult.ux_score) + ';">';
            html += (compilationResult.ux_score * 100).toFixed(0) + '%</div>';
            html += '</div>';
            
            // Brand Compliance
            html += '<h4 style="color: ${this.brandGuidelines.colors.secondary};">🎪 Brand Compliance</h4>';
            html += '<div class="brand-compliance">';
            html += '<div class="compliance-item">';
            html += '<div>Colors</div>';
            html += '<div style="color: ' + getScoreColor(compilationResult.brand_compliance.colors.score) + ';">';
            html += (compilationResult.brand_compliance.colors.score * 100).toFixed(0) + '%</div>';
            html += '</div>';
            html += '<div class="compliance-item">';
            html += '<div>Typography</div>';
            html += '<div style="color: ' + getScoreColor(compilationResult.brand_compliance.typography.score) + ';">';
            html += (compilationResult.brand_compliance.typography.score * 100).toFixed(0) + '%</div>';
            html += '</div>';
            html += '<div class="compliance-item">';
            html += '<div>Overall</div>';
            html += '<div style="color: ' + getScoreColor(compilationResult.brand_compliance.overall) + ';">';
            html += (compilationResult.brand_compliance.overall * 100).toFixed(0) + '%</div>';
            html += '</div>';
            html += '</div>';
            
            // Performance Impact
            html += '<h4 style="color: ${this.brandGuidelines.colors.secondary};">⚡ Performance Impact</h4>';
            html += '<div class="performance-meter">';
            const perfPercent = Math.max(0, Math.min(100, 50 + (compilationResult.performance_impact * 50)));
            html += '<div class="performance-fill" style="width: ' + perfPercent + '%"></div>';
            html += '</div>';
            html += '<div>Impact: ' + (compilationResult.performance_impact > 0 ? '+' : '') + 
                (compilationResult.performance_impact * 100).toFixed(1) + '%</div>';
            
            // Directives Applied
            html += '<h4 style="color: ${this.brandGuidelines.colors.secondary};">🎯 Directives Applied</h4>';
            html += '<div>' + compilationResult.directives_applied.length + ' UX directives found and applied</div>';
            
            // Suggestions
            if (compilationResult.suggestions.length > 0) {
                html += '<h4 style="color: ${this.brandGuidelines.colors.secondary};">💡 Suggestions</h4>';
                html += '<ul class="suggestions-list">';
                for (const suggestion of compilationResult.suggestions) {
                    html += '<li class="suggestion-item">';
                    html += '<div style="font-weight: bold; color: ${this.brandGuidelines.colors.accent};">';
                    html += suggestion.type.toUpperCase() + ' (' + suggestion.priority + ' priority)</div>';
                    html += '<div>' + suggestion.suggestion + '</div>';
                    html += '<div style="font-size: 0.9em; color: #999; margin-top: 5px;">';
                    html += suggestion.impact + '</div>';
                    html += '</li>';
                }
                html += '</ul>';
            }
            
            contentDiv.innerHTML = html;
            resultsDiv.style.display = 'block';
        }
        
        function getScoreColor(score) {
            if (score >= 0.8) return '${this.brandGuidelines.colors.success}';
            if (score >= 0.6) return '${this.brandGuidelines.colors.warning}';
            return '${this.brandGuidelines.colors.error}';
        }
        
        async function showDirectives() {
            const response = await fetch('/api/directives');
            const directives = await response.json();
            
            document.getElementById('results').style.display = 'block';
            document.getElementById('resultsContent').innerHTML = 
                '<pre>' + JSON.stringify(directives, null, 2) + '</pre>';
        }
        
        async function batchCompile() {
            const directory = prompt('Enter directory path (leave empty for current directory):');
            
            const resultsDiv = document.getElementById('results');
            const contentDiv = document.getElementById('resultsContent');
            
            resultsDiv.style.display = 'block';
            contentDiv.innerHTML = '<div style="color: ${this.brandGuidelines.colors.warning};">🏭 Running batch compilation...</div>';
            
            try {
                const response = await fetch('/api/batch-compile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ directory: directory || '' })
                });
                
                const result = await response.json();
                
                let html = '<h4 style="color: ${this.brandGuidelines.colors.primary};">📊 Batch Compilation Report</h4>';
                html += '<div>Files processed: ' + result.report.summary.total_files + '</div>';
                html += '<div>Average UX Score: ' + (result.report.summary.avg_ux_score * 100).toFixed(1) + '%</div>';
                html += '<div>Overall Grade: <span style="color: ' + 
                    getScoreColor(result.report.summary.avg_ux_score) + ';">' + 
                    result.report.overall_grade + '</span></div>';
                html += '<pre>' + JSON.stringify(result.report, null, 2) + '</pre>';
                
                contentDiv.innerHTML = html;
                
            } catch (error) {
                contentDiv.innerHTML = '<div style="color: ${this.brandGuidelines.colors.error};">❌ Error: ' + error.message + '</div>';
            }
        }
        
        function copyOutput() {
            const output = document.getElementById('outputCode');
            output.select();
            document.execCommand('copy');
            
            // Visual feedback
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✅ COPIED';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1000);
        }
        
        function downloadOutput() {
            const output = document.getElementById('outputCode').value;
            if (!output) {
                alert('No compiled output to download');
                return;
            }
            
            const blob = new Blob([output], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ux-compiled-output.html';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function showBrandGuidelines() {
            fetch('/api/directives')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('results').style.display = 'block';
                    document.getElementById('resultsContent').innerHTML = 
                        '<h4 style="color: ${this.brandGuidelines.colors.primary};">🎪 Brand Guidelines</h4>' +
                        '<pre>' + JSON.stringify(data.brand_guidelines, null, 2) + '</pre>';
                });
        }
        
        // Set example code on load
        window.onload = function() {
            document.getElementById('inputCode').value = \`<!-- 🎨 Hero section with visual priority -->
<div class="hero-section">
  <h1>Welcome to Our Platform</h1> <!-- 🚀 Performance critical title -->
  <p>Transform your business with our solutions</p> <!-- 📱 Mobile-first content -->
  <button class="cta-button">Get Started</button> <!-- ♿💰 Accessible and conversion-focused -->
</div>

<style>
/* // UX: Make the hero section engaging */
.hero-section {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 60px 20px;
  text-align: center;
  /* // BRAND: Use brand colors */
}

/* // PERF: Optimize button interactions */
.cta-button {
  background: #00ff00;
  color: #000;
  padding: 15px 30px;
  border: none;
  border-radius: 5px;
  font-size: 1.2em;
  cursor: pointer;
  /* // A11Y: Ensure good contrast */
}

/* // MOBILE: Responsive design */
@media (max-width: 768px) {
  .hero-section {
    padding: 40px 15px;
  }
}
</style>\`;
        };
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// START THE VISUAL UX COMPILER
if (require.main === module) {
    console.log('🎨 STARTING VISUAL UX COMPILER');
    console.log('===============================');
    console.log('🎯 Parse emojis/comments as UX compilation directives');
    console.log('✨ Apply visual design and performance optimizations');
    console.log('🎪 Ensure brand consistency and accessibility');
    console.log('📊 Generate UX scores and improvement suggestions');
    console.log('');
    
    const compiler = new VisualUXCompiler();
    compiler.start();
}

module.exports = VisualUXCompiler;
#!/usr/bin/env node

/**
 * MESSAGE CONTENT VALIDATOR
 * Validates and sanitizes message content to prevent empty message errors
 * Provides intelligent defaults based on message context
 */

class MessageContentValidator {
    constructor() {
        // Validation rules
        this.rules = {
            minLength: 0,  // Allow empty for special cases
            maxLength: 10000,
            allowEmpty: false,  // Default: don't allow empty
            stripHtml: true,
            normalizeWhitespace: true
        };
        
        // Special symbol patterns that can exist without text
        this.symbolPatterns = {
            pureSymbol: /^[@#!?]+$/,
            command: /^![a-zA-Z]+(?:\([^)]*\))?$/,
            mention: /^@[a-zA-Z0-9_]+$/,
            tag: /^#[a-zA-Z0-9_]+$/,
            query: /^\?[a-zA-Z0-9_]+$/,
            specialCommand: /^(!{2,}|@{2,}|#{2,}|\?{2,})$/
        };
        
        // Default content for different scenarios
        this.defaults = {
            empty: '[empty message]',
            symbolOnly: '[symbol command]',
            actionOnly: '[action]',
            mentionOnly: '[mention]',
            errorFallback: '[invalid content]'
        };
        
        // Content transformers
        this.transformers = {
            // Convert common empty indicators to actual empty
            emptyIndicators: (content) => {
                const emptyPatterns = [
                    /^\.+$/,  // Just dots
                    /^-+$/,   // Just dashes
                    /^_+$/,   // Just underscores
                    /^\s+$/,  // Just whitespace
                    /^null$/i,
                    /^undefined$/i,
                    /^none$/i,
                    /^n\/a$/i
                ];
                
                for (const pattern of emptyPatterns) {
                    if (pattern.test(content)) {
                        return '';
                    }
                }
                return content;
            },
            
            // Normalize whitespace
            normalizeWhitespace: (content) => {
                return content
                    .replace(/\s+/g, ' ')  // Multiple spaces to single
                    .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
                    .trim();
            },
            
            // Strip HTML if needed
            stripHtml: (content) => {
                return content.replace(/<[^>]*>/g, '');
            }
        };
        
        console.log('📝 Message Content Validator initialized');
    }
    
    /**
     * Validate and sanitize message content
     */
    validate(content, options = {}) {
        // Merge options with defaults
        const rules = { ...this.rules, ...options };
        
        // Start with original content
        let validatedContent = content || '';
        
        // Apply transformers
        if (rules.stripHtml) {
            validatedContent = this.transformers.stripHtml(validatedContent);
        }
        
        if (rules.normalizeWhitespace) {
            validatedContent = this.transformers.normalizeWhitespace(validatedContent);
        }
        
        // Check for empty indicators
        validatedContent = this.transformers.emptyIndicators(validatedContent);
        
        // Handle empty content
        if (!validatedContent || validatedContent.trim() === '') {
            if (rules.allowEmpty) {
                return {
                    valid: true,
                    content: '',
                    type: 'empty',
                    original: content
                };
            } else {
                // Check if original had symbols
                const symbolMatch = this.detectSymbolCommand(content || '');
                if (symbolMatch) {
                    return {
                        valid: true,
                        content: symbolMatch.content,
                        type: symbolMatch.type,
                        original: content,
                        transformed: true
                    };
                }
                
                // Use default for empty
                return {
                    valid: true,
                    content: this.defaults.empty,
                    type: 'empty_default',
                    original: content,
                    transformed: true
                };
            }
        }
        
        // Check length constraints
        if (validatedContent.length < rules.minLength) {
            return {
                valid: false,
                error: `Content too short (min: ${rules.minLength})`,
                content: validatedContent,
                original: content
            };
        }
        
        if (validatedContent.length > rules.maxLength) {
            return {
                valid: false,
                error: `Content too long (max: ${rules.maxLength})`,
                content: validatedContent.substring(0, rules.maxLength),
                original: content,
                truncated: true
            };
        }
        
        // Check for special patterns
        const specialType = this.detectSpecialContent(validatedContent);
        
        return {
            valid: true,
            content: validatedContent,
            type: specialType || 'normal',
            original: content,
            transformed: content !== validatedContent
        };
    }
    
    /**
     * Detect if content is a pure symbol command
     */
    detectSymbolCommand(content) {
        // Check each symbol pattern
        for (const [type, pattern] of Object.entries(this.symbolPatterns)) {
            if (pattern.test(content)) {
                return {
                    type: `symbol_${type}`,
                    content: content || this.defaults.symbolOnly,
                    isSymbolCommand: true
                };
            }
        }
        
        // Check if it's just symbols without specific pattern
        if (this.symbolPatterns.pureSymbol.test(content)) {
            return {
                type: 'symbol_pure',
                content: content || this.defaults.symbolOnly,
                isSymbolCommand: true
            };
        }
        
        return null;
    }
    
    /**
     * Detect special content types
     */
    detectSpecialContent(content) {
        // Check for code blocks
        if (content.includes('```') || /^```[\s\S]*```$/.test(content)) {
            return 'code_block';
        }
        
        // Check for URLs
        if (/https?:\/\/[^\s]+/.test(content)) {
            return 'contains_url';
        }
        
        // Check for emoji-only
        if (/^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(content)) {
            return 'emoji_only';
        }
        
        // Check for mentions/tags heavy content
        const mentionCount = (content.match(/@\w+/g) || []).length;
        const tagCount = (content.match(/#\w+/g) || []).length;
        const wordCount = content.split(/\s+/).length;
        
        if (mentionCount > wordCount / 2) {
            return 'mention_heavy';
        }
        
        if (tagCount > wordCount / 2) {
            return 'tag_heavy';
        }
        
        return null;
    }
    
    /**
     * Sanitize content for database storage
     */
    sanitizeForDatabase(content) {
        const validation = this.validate(content, {
            stripHtml: true,
            normalizeWhitespace: true,
            allowEmpty: false
        });
        
        if (!validation.valid && validation.error) {
            console.warn('Content validation warning:', validation.error);
        }
        
        return validation.content;
    }
    
    /**
     * Extract metadata from content
     */
    extractMetadata(content) {
        const validation = this.validate(content);
        
        return {
            length: validation.content.length,
            type: validation.type,
            wordCount: validation.content.split(/\s+/).filter(w => w).length,
            lineCount: validation.content.split('\n').length,
            hasSymbols: /[@#!?]/.test(validation.content),
            hasMentions: /@\w+/.test(validation.content),
            hasTags: /#\w+/.test(validation.content),
            hasActions: /!\w+/.test(validation.content),
            hasQueries: /\?\w+/.test(validation.content),
            transformed: validation.transformed || false
        };
    }
    
    /**
     * Validate bulk messages
     */
    validateBulk(messages, options = {}) {
        return messages.map(message => {
            const validation = this.validate(message.content || message, options);
            return {
                ...message,
                validation,
                validatedContent: validation.content
            };
        });
    }
    
    /**
     * Create validation middleware for Express/WebSocket
     */
    createMiddleware(options = {}) {
        return (data, next) => {
            if (data.content !== undefined) {
                const validation = this.validate(data.content, options);
                
                if (!validation.valid && !options.allowInvalid) {
                    return next(new Error(validation.error));
                }
                
                // Replace content with validated version
                data.content = validation.content;
                data._validation = validation;
            }
            
            next();
        };
    }
    
    /**
     * Get validation stats
     */
    getStats() {
        // In a real implementation, this would track validation metrics
        return {
            totalValidations: 0,
            emptyContentHandled: 0,
            transformations: 0,
            errors: 0
        };
    }
}

// Export for use in other modules
module.exports = MessageContentValidator;

// CLI usage
if (require.main === module) {
    const validator = new MessageContentValidator();
    
    // Test various content
    const testCases = [
        '',
        '   ',
        null,
        undefined,
        'Hello world',
        '@username',
        '#tag',
        '!action',
        '?query',
        '!!!',
        '@@@@',
        '<script>alert("test")</script>',
        'Normal message with @mention and #tag',
        '...',
        'null',
        'undefined'
    ];
    
    console.log('\n📝 Message Content Validator Test Results:\n');
    
    testCases.forEach(testCase => {
        const result = validator.validate(testCase);
        console.log(`Input: ${JSON.stringify(testCase)}`);
        console.log(`Result:`, result);
        console.log('---');
    });
}
#!/usr/bin/env node

/**
 * UNIFIED COLOR SYSTEM
 * 
 * Centralizes all color representations across the platform
 * Separates visual indicators from color encoding
 * Provides consistent APIs for different output formats
 */

// Try to load chalk if available, fallback to ANSI codes
let chalk;
try {
    chalk = require('chalk');
} catch (e) {
    // Chalk not available, we'll use ANSI codes directly
    chalk = null;
}

class UnifiedColorSystem {
    constructor() {
        // Core color definitions (non-emoji)
        this.colors = {
            // Status colors
            success: {
                name: 'success',
                hex: '#00ff88',
                rgb: [0, 255, 136],
                hsl: [152, 100, 50],
                ansi: '\x1b[92m',
                chalkMethod: 'greenBright',
                meaning: 'Operation successful, test passed, positive state'
            },
            error: {
                name: 'error',
                hex: '#ff4444',
                rgb: [255, 68, 68],
                hsl: [0, 100, 63],
                ansi: '\x1b[91m',
                chalkMethod: 'redBright',
                meaning: 'Error occurred, test failed, negative state'
            },
            warning: {
                name: 'warning',
                hex: '#ffaa00',
                rgb: [255, 170, 0],
                hsl: [40, 100, 50],
                ansi: '\x1b[93m',
                chalkMethod: 'yellowBright',
                meaning: 'Warning, caution needed, degraded state'
            },
            info: {
                name: 'info',
                hex: '#00aaff',
                rgb: [0, 170, 255],
                hsl: [200, 100, 50],
                ansi: '\x1b[94m',
                chalkMethod: 'cyanBright',
                meaning: 'Information, neutral state, notification'
            },
            pending: {
                name: 'pending',
                hex: '#888888',
                rgb: [136, 136, 136],
                hsl: [0, 0, 53],
                ansi: '\x1b[90m',
                chalkMethod: 'gray',
                meaning: 'Processing, waiting, indeterminate state'
            },
            
            // Game-specific colors
            champion: {
                name: 'champion',
                hex: '#9400d3',
                rgb: [148, 0, 211],
                hsl: [282, 100, 41],
                ansi: '\x1b[35m',
                chalkMethod: 'magentaBright',
                meaning: 'Player champion, hero unit, special character'
            },
            loot: {
                name: 'loot',
                hex: '#ffd700',
                rgb: [255, 215, 0],
                hsl: [51, 100, 50],
                ansi: '\x1b[33m',
                chalkMethod: 'yellow',
                meaning: 'Collectible item, treasure, reward'
            },
            enemy: {
                name: 'enemy',
                hex: '#8b0000',
                rgb: [139, 0, 0],
                hsl: [0, 100, 27],
                ansi: '\x1b[31m',
                chalkMethod: 'red',
                meaning: 'Enemy unit, hostile entity, danger'
            }
        };
        
        // Status indicators (NOT colors, but symbols)
        this.statusIndicators = {
            success: {
                terminal: '✓',
                ascii: '[OK]',
                symbol: '√',
                description: 'Checkmark for success'
            },
            error: {
                terminal: '✗',
                ascii: '[FAIL]', 
                symbol: '×',
                description: 'X mark for failure'
            },
            warning: {
                terminal: '⚠',
                ascii: '[WARN]',
                symbol: '!',
                description: 'Warning triangle'
            },
            info: {
                terminal: 'ℹ',
                ascii: '[INFO]',
                symbol: 'i',
                description: 'Information symbol'
            },
            pending: {
                terminal: '⋯',
                ascii: '[...]',
                symbol: '...',
                description: 'Ellipsis for pending'
            }
        };
        
        // Game overlay indicators (RuneLite style)
        this.overlayIndicators = {
            quest_available: '?',
            quest_start: '!',
            quest_complete: '✓',
            dialogue_active: '@',
            action_required: '⚡',
            tag_marker: '#',
            loot_nearby: '$',
            danger_zone: '⚠'
        };
        
        // Separate emoji encoding systems (for special purposes only)
        this.emojiSystems = {
            hollowtown: 'Use hollowtown-layer-system.js',
            bitmap: 'Use BITMAP-STATE-COMPRESSION.md',
            education: 'Use COLOR-CODED-EDUCATION-SYSTEM.js'
        };
        
        console.log('🎨 Unified Color System initialized');
        console.log('   - Colors:', Object.keys(this.colors).length);
        console.log('   - Indicators:', Object.keys(this.statusIndicators).length);
        console.log('   - Overlays:', Object.keys(this.overlayIndicators).length);
    }
    
    /**
     * Get color in specified format
     */
    getColor(colorName, format = 'hex') {
        const color = this.colors[colorName];
        if (!color) {
            console.warn(`Unknown color: ${colorName}, using default gray`);
            return this.getColor('pending', format);
        }
        
        switch (format) {
            case 'hex':
                return color.hex;
            case 'rgb':
                return color.rgb;
            case 'rgbString':
                return `rgb(${color.rgb.join(', ')})`;
            case 'hsl':
                return color.hsl;
            case 'hslString':
                return `hsl(${color.hsl[0]}, ${color.hsl[1]}%, ${color.hsl[2]}%)`;
            case 'ansi':
                return color.ansi;
            case 'chalk':
                if (chalk) {
                    return chalk[color.chalkMethod];
                } else {
                    // Return a function that uses ANSI codes
                    return (text) => `${color.ansi}${text}\x1b[0m`;
                }
            case 'object':
                return color;
            default:
                return color.hex;
        }
    }
    
    /**
     * Get status indicator (NOT a color, but a symbol)
     */
    getStatusIndicator(status, format = 'terminal') {
        const indicator = this.statusIndicators[status];
        if (!indicator) {
            return this.statusIndicators.info[format] || '?';
        }
        
        return indicator[format] || indicator.terminal;
    }
    
    /**
     * Get overlay indicator for game UI
     */
    getOverlayIndicator(type) {
        return this.overlayIndicators[type] || '?';
    }
    
    /**
     * Format message with color (terminal)
     */
    formatTerminal(message, colorName) {
        const chalkFn = this.getColor(colorName, 'chalk');
        return chalkFn ? chalkFn(message) : message;
    }
    
    /**
     * Format message with ANSI codes (raw)
     */
    formatAnsi(message, colorName) {
        const ansi = this.getColor(colorName, 'ansi');
        const reset = '\x1b[0m';
        return `${ansi}${message}${reset}`;
    }
    
    /**
     * Format status message with indicator and color
     */
    formatStatus(status, message, useColor = true) {
        const indicator = this.getStatusIndicator(status, 'ascii');
        
        if (useColor) {
            const colorName = status; // status names match color names
            return this.formatTerminal(`${indicator} ${message}`, colorName);
        }
        
        return `${indicator} ${message}`;
    }
    
    /**
     * Generate CSS variables for web UI
     */
    generateCSSVariables() {
        let css = ':root {\n';
        
        // Color variables
        for (const [name, color] of Object.entries(this.colors)) {
            css += `  --color-${name}: ${color.hex};\n`;
            css += `  --color-${name}-rgb: ${color.rgb.join(', ')};\n`;
            css += `  --color-${name}-hsl: ${color.hsl.join(', ')};\n`;
        }
        
        css += '}\n\n';
        
        // Utility classes
        css += '/* Status color utilities */\n';
        for (const [name, color] of Object.entries(this.colors)) {
            css += `.text-${name} { color: ${color.hex}; }\n`;
            css += `.bg-${name} { background-color: ${color.hex}; }\n`;
            css += `.border-${name} { border-color: ${color.hex}; }\n`;
        }
        
        return css;
    }
    
    /**
     * Generate theme object for UI frameworks
     */
    generateTheme() {
        const theme = {
            colors: {},
            indicators: this.statusIndicators,
            overlays: this.overlayIndicators
        };
        
        for (const [name, color] of Object.entries(this.colors)) {
            theme.colors[name] = {
                hex: color.hex,
                rgb: color.rgb,
                hsl: color.hsl,
                meaning: color.meaning
            };
        }
        
        return theme;
    }
    
    /**
     * Check if a string contains emoji (to detect misuse)
     */
    containsEmoji(str) {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        return emojiRegex.test(str);
    }
    
    /**
     * Convert emoji status to proper color name
     */
    emojiToColorName(emoji) {
        const emojiMap = {
            '🟢': 'success',
            '✅': 'success',
            '🔴': 'error',
            '❌': 'error',
            '🟡': 'warning',
            '⚠️': 'warning',
            '🔵': 'info',
            'ℹ️': 'info',
            '⚫': 'pending',
            '⌛': 'pending'
        };
        
        return emojiMap[emoji] || null;
    }
    
    /**
     * Self-test to ensure color system is working
     */
    selfTest() {
        console.log('\n=== Color System Self Test ===\n');
        
        // Test all colors
        console.log('Colors:');
        for (const colorName of Object.keys(this.colors)) {
            const message = `Testing ${colorName} color`;
            console.log(this.formatTerminal(message, colorName));
        }
        
        // Test status formatting
        console.log('\nStatus Messages:');
        console.log(this.formatStatus('success', 'Operation completed successfully'));
        console.log(this.formatStatus('error', 'An error occurred'));
        console.log(this.formatStatus('warning', 'This is a warning'));
        console.log(this.formatStatus('info', 'For your information'));
        console.log(this.formatStatus('pending', 'Processing...'));
        
        // Test overlay indicators
        console.log('\nOverlay Indicators:');
        for (const [type, indicator] of Object.entries(this.overlayIndicators)) {
            console.log(`  ${type}: ${indicator}`);
        }
        
        console.log('\n=== Test Complete ===\n');
    }
}

// Export singleton instance
const unifiedColorSystem = new UnifiedColorSystem();

// Export for use in other modules
module.exports = unifiedColorSystem;

// If run directly, perform self-test
if (require.main === module) {
    unifiedColorSystem.selfTest();
    
    // Example usage
    console.log('\n=== Example Usage ===\n');
    
    // Terminal formatting
    console.log('Terminal Output:');
    console.log(unifiedColorSystem.formatTerminal('Success!', 'success'));
    console.log(unifiedColorSystem.formatTerminal('Error!', 'error'));
    console.log(unifiedColorSystem.formatTerminal('Warning!', 'warning'));
    
    // Get colors for API
    console.log('\nAPI Colors:');
    console.log('Success hex:', unifiedColorSystem.getColor('success', 'hex'));
    console.log('Error RGB:', unifiedColorSystem.getColor('error', 'rgb'));
    console.log('Warning HSL:', unifiedColorSystem.getColor('warning', 'hsl'));
    
    // Generate CSS
    console.log('\nCSS Variables (preview):');
    const css = unifiedColorSystem.generateCSSVariables();
    console.log(css.split('\n').slice(0, 10).join('\n') + '\n...');
}
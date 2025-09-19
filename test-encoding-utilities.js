#!/usr/bin/env node

/**
 * TEST ENCODING/DECODING UTILITIES
 * 
 * Standalone utilities for encoding and decoding test output
 * Handles headers, footers, green text, emojis, and special formatting
 * Inspired by old text games and BBCode/ANSI formatting
 */

const chalk = require('chalk');
const crypto = require('crypto');

console.log(`
🔤🔢🎨🔤🔢🎨🔤🔢🎨
TEST ENCODING UTILITIES
Old school meets new tech
🔤🔢🎨🔤🔢🎨🔤🔢🎨
`);

class TestEncodingUtilities {
    constructor() {
        // Initialize encoding maps
        this.initializeEncodingMaps();
        
        // Old school BBS/MUD color codes
        this.initializeColorCodes();
        
        // Emoji to meaning mappings
        this.initializeEmojiMeanings();
        
        // Green text patterns
        this.initializeGreenTextPatterns();
    }

    initializeEncodingMaps() {
        // Header encoding patterns
        this.headerPatterns = {
            'standard': {
                template: '═══════════════════════════════════════════════════════',
                encode: (content, options = {}) => {
                    const timestamp = new Date().toISOString();
                    const hash = this.generateHash(content);
                    const emoji = options.emoji || '📋';
                    return `${emoji} [${timestamp}] [${hash}] ${content} ${emoji}`;
                }
            },
            
            'battle.net': {
                template: '╔═══════════════════════════════════════════════════╗',
                encode: (content, options = {}) => {
                    const race = options.race || 'Human';
                    const class_ = options.class || 'Warrior';
                    return `║ ⚔️ ${race} ${class_} | ${content.padEnd(30)} ║`;
                }
            },
            
            'matrix': {
                template: '░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░',
                encode: (content, options = {}) => {
                    const encoded = Buffer.from(content).toString('base64');
                    return `░▒▓ ${encoded} ▓▒░`;
                }
            },
            
            'old_school': {
                template: '+--------------------------------------------------+',
                encode: (content, options = {}) => {
                    return `| ${content.padEnd(48)} |`;
                }
            }
        };

        // Footer encoding patterns
        this.footerPatterns = {
            'standard': {
                template: '═══════════════════════════════════════════════════════',
                encode: (results, options = {}) => {
                    const status = results.success ? '✅ PASS' : '❌ FAIL';
                    const time = `${results.duration}ms`;
                    const score = results.score || '100%';
                    return `${status} | Tests: ${results.total} | Time: ${time} | Score: ${score}`;
                }
            },
            
            'game_over': {
                template: '███████████████████████████████████████████████████',
                encode: (results, options = {}) => {
                    if (results.success) {
                        return '█ 🎉 VICTORY! Press [SPACE] to continue... █';
                    } else {
                        return '█ 💀 GAME OVER! Insert coin to continue... █';
                    }
                }
            },
            
            'ascii_art': {
                template: null,
                encode: (results, options = {}) => {
                    if (results.success) {
                        return `
    ╔══╗╔══╗╔══╗╔══╗
    ║╔╗║║╔╗║║══╣║══╣
    ║╚╝║║╚╝║╠══║╠══║
    ║╔═╝║╔╗║║══╣║══╣
    ╚╝  ╚╝╚╝╚══╝╚══╝`;
                    } else {
                        return `
    ╔══╗╔══╗╔══╗╔╗
    ║╔═╝║╔╗║╚║║╝║║
    ║╚╗ ║╚╝║ ║║ ║║
    ║╔╝ ║╔╗║ ║║ ║╚╗
    ╚╝  ╚╝╚╝╚══╝╚═╝`;
                    }
                }
            }
        };
    }

    initializeColorCodes() {
        // Old school BBS/ANSI color codes
        this.colorCodes = {
            // Foreground colors
            '&0': chalk.black,
            '&1': chalk.blue,
            '&2': chalk.green,
            '&3': chalk.cyan,
            '&4': chalk.red,
            '&5': chalk.magenta,
            '&6': chalk.yellow,
            '&7': chalk.white,
            '&8': chalk.gray,
            '&9': chalk.blueBright,
            '&a': chalk.greenBright,
            '&b': chalk.cyanBright,
            '&c': chalk.redBright,
            '&d': chalk.magentaBright,
            '&e': chalk.yellowBright,
            '&f': chalk.whiteBright,
            
            // Special effects
            '&l': chalk.bold,
            '&n': chalk.underline,
            '&o': chalk.italic,
            '&r': chalk.reset,
            
            // Background colors (using &B prefix)
            '&B0': chalk.bgBlack,
            '&B1': chalk.bgBlue,
            '&B2': chalk.bgGreen,
            '&B3': chalk.bgCyan,
            '&B4': chalk.bgRed,
            '&B5': chalk.bgMagenta,
            '&B6': chalk.bgYellow,
            '&B7': chalk.bgWhite
        };
    }

    initializeEmojiMeanings() {
        // Emoji to test meaning mappings
        this.emojiMeanings = {
            // Status emojis
            '✅': { meaning: 'test_passed', color: 'green', priority: 'info' },
            '❌': { meaning: 'test_failed', color: 'red', priority: 'error' },
            '⏳': { meaning: 'test_pending', color: 'yellow', priority: 'warning' },
            '⏭️': { meaning: 'test_skipped', color: 'gray', priority: 'info' },
            '💥': { meaning: 'test_error', color: 'red', priority: 'critical' },
            '🎲': { meaning: 'test_flaky', color: 'yellow', priority: 'warning' },
            
            // Phase emojis
            '🚀': { meaning: 'startup_phase', color: 'cyan', priority: 'info' },
            '🔐': { meaning: 'login_phase', color: 'blue', priority: 'info' },
            '🌍': { meaning: 'world_phase', color: 'green', priority: 'info' },
            '💬': { meaning: 'forum_phase', color: 'yellow', priority: 'info' },
            '📦': { meaning: 'archival_phase', color: 'magenta', priority: 'info' },
            
            // Special emojis
            '🧪': { meaning: 'test_suite', color: 'white', priority: 'info' },
            '🔍': { meaning: 'verification', color: 'blue', priority: 'info' },
            '📊': { meaning: 'report', color: 'cyan', priority: 'info' },
            '🎮': { meaning: 'game_mode', color: 'green', priority: 'info' },
            '🏆': { meaning: 'achievement', color: 'yellow', priority: 'success' },
            '💀': { meaning: 'critical_failure', color: 'red', priority: 'critical' },
            
            // Battle.net race emojis
            '👤': { meaning: 'human_race', color: 'blue', priority: 'info' },
            '🧟': { meaning: 'orc_race', color: 'red', priority: 'info' },
            '🧝': { meaning: 'elf_race', color: 'green', priority: 'info' },
            '⛏️': { meaning: 'dwarf_race', color: 'yellow', priority: 'info' },
            '💀': { meaning: 'undead_race', color: 'magenta', priority: 'info' },
            '🔮': { meaning: 'protoss_race', color: 'cyan', priority: 'info' }
        };
    }

    initializeGreenTextPatterns() {
        // Green text patterns (inspired by imageboards and old forums)
        this.greenTextPatterns = {
            'standard': {
                pattern: /^>/,
                format: (text) => chalk.green(text),
                parse: (text) => ({ type: 'greentext', content: text.substring(1).trim() })
            },
            
            'implication': {
                pattern: /^>implying/i,
                format: (text) => chalk.green.italic(text),
                parse: (text) => ({ type: 'implication', content: text })
            },
            
            'mfw': {
                pattern: /^>mfw/i,
                format: (text) => chalk.green.bold(text),
                parse: (text) => ({ type: 'reaction', content: text })
            },
            
            'quote': {
                pattern: /^>>/,
                format: (text) => chalk.blue.underline(text),
                parse: (text) => ({ type: 'quote_reference', id: text.substring(2) })
            },
            
            'test_status': {
                pattern: /^>\s*(PASS|FAIL|SKIP|ERROR)/i,
                format: (text, match) => {
                    const status = match[1].toUpperCase();
                    const colors = {
                        'PASS': chalk.green,
                        'FAIL': chalk.red,
                        'SKIP': chalk.yellow,
                        'ERROR': chalk.red.bold
                    };
                    return (colors[status] || chalk.white)(text);
                },
                parse: (text, match) => ({ 
                    type: 'test_status', 
                    status: match[1].toUpperCase(),
                    content: text 
                })
            }
        };
    }

    /**
     * Encode header with specified style
     */
    encodeHeader(content, style = 'standard', options = {}) {
        const pattern = this.headerPatterns[style];
        if (!pattern) {
            throw new Error(`Unknown header style: ${style}`);
        }

        const header = [];
        
        // Add template line
        if (pattern.template) {
            header.push(pattern.template);
        }
        
        // Add encoded content
        header.push(pattern.encode(content, options));
        
        // Add closing template for boxed styles
        if (style === 'battle.net' || style === 'old_school') {
            header.push(pattern.template.replace('╔', '╚').replace('╗', '╝').replace('+', '+'));
        }

        return header.join('\n');
    }

    /**
     * Encode footer with specified style
     */
    encodeFooter(results, style = 'standard', options = {}) {
        const pattern = this.footerPatterns[style];
        if (!pattern) {
            throw new Error(`Unknown footer style: ${style}`);
        }

        const footer = [];
        
        // Add template line if exists
        if (pattern.template) {
            footer.push(pattern.template);
        }
        
        // Add encoded results
        footer.push(pattern.encode(results, options));
        
        return footer.join('\n');
    }

    /**
     * Apply color codes to text (old school BBS style)
     */
    applyColorCodes(text) {
        let formatted = text;
        
        // Replace color codes with chalk formatting
        for (const [code, colorFn] of Object.entries(this.colorCodes)) {
            const regex = new RegExp(code.replace(/[&]/g, '\\$&'), 'g');
            formatted = formatted.replace(regex, '\x1b[0m'); // Reset before applying
            
            // Apply color to text following the code
            const segments = formatted.split(code);
            if (segments.length > 1) {
                formatted = segments.map((segment, i) => 
                    i === 0 ? segment : colorFn(segment)
                ).join('');
            }
        }
        
        return formatted;
    }

    /**
     * Format green text
     */
    formatGreenText(text) {
        for (const [name, pattern] of Object.entries(this.greenTextPatterns)) {
            const match = text.match(pattern.pattern);
            if (match) {
                return pattern.format(text, match);
            }
        }
        
        // Default green text
        if (text.startsWith('>')) {
            return chalk.green(text);
        }
        
        return text;
    }

    /**
     * Parse green text
     */
    parseGreenText(text) {
        for (const [name, pattern] of Object.entries(this.greenTextPatterns)) {
            const match = text.match(pattern.pattern);
            if (match) {
                return pattern.parse(text, match);
            }
        }
        
        return null;
    }

    /**
     * Decode emoji to meaning
     */
    decodeEmoji(emoji) {
        return this.emojiMeanings[emoji] || { 
            meaning: 'unknown', 
            color: 'white', 
            priority: 'info' 
        };
    }

    /**
     * Encode test results as emoji sequence
     */
    encodeResultsAsEmojis(results) {
        const emojis = [];
        
        // Add phase emoji
        if (results.phase) {
            const phaseEmojis = {
                'startup': '🚀',
                'login': '🔐',
                'world': '🌍',
                'forum': '💬',
                'archival': '📦'
            };
            emojis.push(phaseEmojis[results.phase] || '🧪');
        }
        
        // Add status emojis
        if (results.passed > 0) emojis.push('✅'.repeat(Math.min(results.passed, 5)));
        if (results.failed > 0) emojis.push('❌'.repeat(Math.min(results.failed, 5)));
        if (results.skipped > 0) emojis.push('⏭️');
        
        // Add special emojis
        if (results.flaky > 0) emojis.push('🎲');
        if (results.critical) emojis.push('💥');
        if (results.perfect) emojis.push('🏆');
        
        return emojis.join('');
    }

    /**
     * Generate hash for content
     */
    generateHash(content) {
        return crypto.createHash('sha256')
            .update(content)
            .digest('hex')
            .substring(0, 8);
    }

    /**
     * Create box drawing around content
     */
    createBox(content, style = 'single') {
        const styles = {
            'single': { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
            'double': { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
            'rounded': { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
            'heavy': { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' }
        };
        
        const box = styles[style] || styles.single;
        const lines = content.split('\n');
        const maxLength = Math.max(...lines.map(l => l.length));
        
        const result = [];
        
        // Top border
        result.push(box.tl + box.h.repeat(maxLength + 2) + box.tr);
        
        // Content with side borders
        lines.forEach(line => {
            result.push(box.v + ' ' + line.padEnd(maxLength) + ' ' + box.v);
        });
        
        // Bottom border
        result.push(box.bl + box.h.repeat(maxLength + 2) + box.br);
        
        return result.join('\n');
    }

    /**
     * Create ASCII progress bar
     */
    createProgressBar(current, total, width = 30) {
        const percentage = Math.floor((current / total) * 100);
        const filled = Math.floor((current / total) * width);
        const empty = width - filled;
        
        const bar = [
            '[',
            '█'.repeat(filled),
            '░'.repeat(empty),
            ']',
            ` ${percentage}%`
        ].join('');
        
        // Color based on percentage
        if (percentage >= 90) return chalk.green(bar);
        if (percentage >= 70) return chalk.yellow(bar);
        if (percentage >= 50) return chalk.yellow(bar);
        return chalk.red(bar);
    }

    /**
     * Format test output with old school styling
     */
    formatTestOutput(testName, status, duration, options = {}) {
        const statusEmoji = {
            'passed': '✅',
            'failed': '❌',
            'skipped': '⏭️',
            'pending': '⏳',
            'error': '💥'
        }[status] || '❓';
        
        const statusColor = {
            'passed': chalk.green,
            'failed': chalk.red,
            'skipped': chalk.gray,
            'pending': chalk.yellow,
            'error': chalk.red.bold
        }[status] || chalk.white;
        
        // Build formatted output
        let output = '';
        
        if (options.showGreenText && status === 'passed') {
            output = this.formatGreenText(`> ${testName} - OK`);
        } else {
            output = `${statusEmoji} ${statusColor(testName)}`;
        }
        
        if (duration) {
            output += chalk.gray(` (${duration}ms)`);
        }
        
        if (options.showBox) {
            output = this.createBox(output, 'single');
        }
        
        return output;
    }

    /**
     * Demonstrate all encoding features
     */
    demonstrateFeatures() {
        console.log('\n📚 ENCODING FEATURES DEMONSTRATION\n');
        
        // Headers
        console.log('HEADERS:');
        console.log(this.encodeHeader('Test Suite Results', 'standard'));
        console.log('\n' + this.encodeHeader('Battle.net Style', 'battle.net', { 
            race: 'Protoss', 
            class: 'Auditor' 
        }));
        console.log('\n' + this.encodeHeader('Matrix Style', 'matrix'));
        
        // Color codes
        console.log('\n\nCOLOR CODES:');
        console.log(this.applyColorCodes('&2Green &4Red &6Yellow &bCyan &r&lBold &nUnderline&r'));
        
        // Green text
        console.log('\n\nGREEN TEXT:');
        console.log(this.formatGreenText('> be me'));
        console.log(this.formatGreenText('> running tests'));
        console.log(this.formatGreenText('> PASS all tests'));
        console.log(this.formatGreenText('> feels good man'));
        console.log(this.formatGreenText('>>12345 (reference)'));
        
        // Progress bars
        console.log('\n\nPROGRESS BARS:');
        console.log(this.createProgressBar(10, 10));
        console.log(this.createProgressBar(7, 10));
        console.log(this.createProgressBar(5, 10));
        console.log(this.createProgressBar(3, 10));
        
        // Emoji encoding
        console.log('\n\nEMOJI ENCODING:');
        const testResults = {
            phase: 'login',
            passed: 8,
            failed: 2,
            skipped: 1,
            perfect: false
        };
        console.log('Results:', testResults);
        console.log('Encoded:', this.encodeResultsAsEmojis(testResults));
        
        // Footers
        console.log('\n\nFOOTERS:');
        console.log(this.encodeFooter({ 
            success: true, 
            total: 10, 
            duration: 1234,
            score: '95%'
        }, 'standard'));
        
        console.log('\n' + this.encodeFooter({ success: true }, 'game_over'));
        console.log('\n' + this.encodeFooter({ success: false }, 'ascii_art'));
    }

    /**
     * CLI Interface
     */
    async cli() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'demo':
                this.demonstrateFeatures();
                break;

            case 'encode':
                const text = args.slice(1).join(' ') || 'Test message';
                console.log('\nEncoded Header:');
                console.log(this.encodeHeader(text));
                console.log('\nGreen Text:');
                console.log(this.formatGreenText(`> ${text}`));
                console.log('\nBoxed:');
                console.log(this.createBox(text));
                break;

            case 'decode':
                const emoji = args[1] || '✅';
                const meaning = this.decodeEmoji(emoji);
                console.log(`\nEmoji: ${emoji}`);
                console.log(`Meaning: ${meaning.meaning}`);
                console.log(`Color: ${meaning.color}`);
                console.log(`Priority: ${meaning.priority}`);
                break;

            default:
                console.log(`
🔤 TEST ENCODING UTILITIES

Commands:
  demo           - Demonstrate all encoding features
  encode [text]  - Encode text with various styles
  decode [emoji] - Decode emoji meaning

Features:
  ✅ Multiple header/footer styles
  ✅ Old school BBS color codes (&2, &4, etc)
  ✅ Green text formatting (>, >implying, >mfw)
  ✅ Emoji meanings and encoding
  ✅ ASCII progress bars
  ✅ Box drawing utilities
  ✅ Hash generation

Examples:
  node test-encoding-utilities.js demo
  node test-encoding-utilities.js encode "Critical Test Failed"
  node test-encoding-utilities.js decode 💀

Color Codes:
  &0-&f  - Foreground colors (black to white bright)
  &B0-&B7 - Background colors
  &l     - Bold
  &n     - Underline
  &o     - Italic
  &r     - Reset
                `);
        }
    }
}

// Export for use in other modules
module.exports = TestEncodingUtilities;

// Run CLI if executed directly
if (require.main === module) {
    const utils = new TestEncodingUtilities();
    utils.cli().catch(console.error);
}
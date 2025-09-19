#!/usr/bin/env node

/**
 * 🎨 ASCII PIXEL ART ENGINE
 * 2D terminal aesthetics for Cal's responses
 * Old-school bitmap generation and pixel art styling
 * Creates shareable visual elements for forum posts
 */

const fs = require('fs');

class AsciiPixelArtEngine {
    constructor() {
        this.version = '1.0.0';
        this.name = 'ASCII Pixel Art Engine';
        
        // ASCII art character sets
        this.charSets = {
            // Density-based (light to heavy)
            density: [' ', '.', ':', ';', 'o', '8', '#', '@'],
            // Block characters for pixel art
            blocks: ['░', '▒', '▓', '█'],
            // Box drawing characters
            boxes: ['─', '│', '┌', '┐', '└', '┘', '┬', '┴', '├', '┤', '┼'],
            // Gaming/retro characters  
            retro: ['▀', '▄', '█', '▌', '▐', '■', '□', '▪', '▫', '●', '○'],
            // Shading patterns
            shading: [' ', '░', '▒', '▓', '█']
        };
        
        // Color codes for terminal output
        this.colors = {
            red: '\x1b[31m',
            green: '\x1b[32m', 
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m'
        };
        
        // Pre-made templates for common elements
        this.templates = {
            cal_face: this.generateCalFace(),
            roasted: this.generateRoastedBanner(),
            wisdom: this.generateWisdomFrame(),
            legendary: this.generateLegendaryDrop(),
            pixel_cal: this.generatePixelCal()
        };
        
        console.log('🎨 ASCII Pixel Art Engine initialized!');
        console.log('📺 Retro terminal aesthetics ready');
        console.log('🎮 Old-school bitmap generation active');
    }
    
    // Main function to generate art based on context
    generateArt(type, context = {}) {
        switch (type) {
            case 'cal_response':
                return this.generateCalResponseArt(context);
            case 'roasted_banner':
                return this.generateRoastedBanner(context.username);
            case 'wisdom_frame':
                return this.generateWisdomFrame(context.text);
            case 'legendary_drop':
                return this.generateLegendaryDrop(context);
            case 'pixel_portrait':
                return this.generatePixelPortrait(context.character);
            case 'terminal_box':
                return this.generateTerminalBox(context.content);
            case 'progress_bar':
                return this.generateProgressBar(context.label, context.percentage);
            case 'ascii_logo':
                return this.generateAsciiLogo(context.text);
            default:
                return this.templates.cal_face;
        }
    }
    
    generateCalFace() {
        return `
    ┌─────────────────────────┐
    │    ●●●●●●●●●●●●●●●    │
    │   ●                ●   │
    │  ●   ◉          ◉   ●  │
    │ ●                    ● │
    │ ●        ~~~~        ● │
    │ ●                    ● │
    │  ●   \\______________/   ●  │
    │   ●                ●   │
    │    ●●●●●●●●●●●●●●●    │
    └─────────────────────────┘
         🤖 CAL AI ACTIVATED 🤖`;
    }
    
    generateRoastedBanner(username = "USER") {
        const banner = `
    ██████╗  ██████╗  █████╗ ███████╗████████╗███████╗██████╗ 
    ██╔══██╗██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
    ██████╔╝██║   ██║███████║███████╗   ██║   █████╗  ██║  ██║
    ██╔══██╗██║   ██║██╔══██║╚════██║   ██║   ██╔══╝  ██║  ██║
    ██║  ██║╚██████╔╝██║  ██║███████║   ██║   ███████╗██████╔╝
    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═════╝`;
        
        const flame = this.generateFlameEffect();
        
        return `${flame}\n${banner}\n${flame}\n\n    💀 ${username.toUpperCase()} HAS BEEN THOROUGHLY ROASTED 💀`;
    }
    
    generateWisdomFrame(text = "WISDOM ACTIVATED") {
        const topBorder = '╔' + '═'.repeat(50) + '╗';
        const bottomBorder = '╚' + '═'.repeat(50) + '╝';
        const sideBorder = '║';
        
        return `
    ${topBorder}
    ║  🧠 DEEP THOUGHT PROTOCOLS ACTIVATED 🧠        ║
    ║                                                ║
    ║  "The profound and the profane dance together  ║
    ║   in the cosmic ballet of understanding"       ║
    ║                                                ║
    ║            ∴ ∵ WISDOM DISPENSED ∵ ∴            ║
    ${bottomBorder}`;
    }
    
    generateLegendaryDrop(context = {}) {
        const stars = this.generateStarField();
        
        return `
    ✨ ★ ✦ ✧ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ✱ ✲ ✳ ✴ ✵ ✶ ✷ ✸ ✹ ✺ ✻ ✼ ✽ ✾ ✿ ❀ ❁ ❂ ✨
    ★                                                                    ★
    ✦     ██╗     ███████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗    ✦
    ✧     ██║     ██╔════╝██╔════╝ ██╔════╝████╗  ██║██╔══██╗██╔══██╗   ✧
    ✩     ██║     █████╗  ██║  ███╗█████╗  ██╔██╗ ██║██║  ██║███████║   ✩
    ✪     ██║     ██╔══╝  ██║   ██║██╔══╝  ██║╚██╗██║██║  ██║██╔══██║   ✪
    ✫     ███████╗███████╗╚██████╔╝███████╗██║ ╚████║██████╔╝██║  ██║   ✫
    ✬     ╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝   ✬
    ✭                                                                    ✭
    ✮               👑 ULTRA RARE RESPONSE UNLOCKED 👑                   ✮
    ✯                                                                    ✯
    ★       ▄▀█ █▀▀ █ █ █ █▀▀ █ █ █▀▀ █▄█ █▀▀ █▄ █ ▀█▀ ▄▀█              ★
    ✦       █▀█ █▄▄ █▀█ █ █▄▄ █ ▄▀█ █▄▄ █ █ █▄▄ █ ▀█  █  █▀█              ✦
    ✧                                                                    ✧
    ✩           ║ YOU HAVE WITNESSED LEGENDARY CAL ║                    ✩
    ✪           ║ SCREENSHOT THIS IMMEDIATELY!! ║                       ✪
    ✫                                                                    ✫
    ✨ ★ ✦ ✧ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ✱ ✲ ✳ ✴ ✵ ✶ ✷ ✸ ✹ ✺ ✻ ✼ ✽ ✾ ✿ ❀ ❁ ❂ ✨`;
    }
    
    generatePixelCal() {
        return `
    ████████████████████████████████
    ██                            ██
    ██  ████████        ████████  ██
    ██  ██    ██        ██    ██  ██
    ██  ██    ██        ██    ██  ██
    ██  ████████        ████████  ██
    ██                            ██
    ██    ████████████████████    ██
    ██  ██                  ██  ██
    ██  ██  ████████████████  ██  ██
    ██  ██  ██            ██  ██  ██
    ██  ██  ██            ██  ██  ██
    ██    ██              ██    ██
    ██      ████████████████      ██
    ██                            ██
    ████████████████████████████████
           🤖 PIXEL CAL 🤖`;
    }
    
    generatePixelPortrait(character) {
        const portraits = {
            'eye_system': `
    ┌─────────────────────────┐
    │    👁️ EYE SYSTEM 👁️     │
    │  ╔═══╗           ╔═══╗  │
    │  ║ ● ║           ║ ● ║  │
    │  ╚═══╝           ╚═══╝  │
    │                         │
    │     ▄▄▄▄▄▄▄▄▄▄▄▄▄     │
    │    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    │
    │                         │
    │   GAZE-CONTROLLED ART   │
    └─────────────────────────┘`,
            'eye_art': `
    ╔════════════════════════╗
    ║      🎨 EYE ART 🎨      ║
    ╠════════════════════════╣
    ║  ●○●○●○●○●○●○●○●○●○●○  ║
    ║  ○●○●○●○●○●○●○●○●○●○●  ║
    ║  ●○●○● PIXELS ●○●○●○  ║
    ║  ○●○●○●○●○●○●○●○●○●○●  ║
    ║  ●○●○●○●○●○●○●○●○●○●○  ║
    ╚════════════════════════╝`,
            'default': this.generatePixelCal()
        };
        
        return portraits[character] || portraits['default'];
    }
    
    generateTerminalBox(content, width = 60) {
        const lines = content.split('\n');
        const maxLength = Math.max(width, Math.max(...lines.map(line => line.length)));
        
        const topBorder = '┌' + '─'.repeat(maxLength + 2) + '┐';
        const bottomBorder = '└' + '─'.repeat(maxLength + 2) + '┘';
        
        const contentLines = lines.map(line => 
            '│ ' + line.padEnd(maxLength, ' ') + ' │'
        );
        
        return [topBorder, ...contentLines, bottomBorder].join('\n');
    }
    
    generateProgressBar(label, percentage, width = 40) {
        const filled = Math.floor(percentage * width / 100);
        const empty = width - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        
        return `
    ${label}
    ┌${'─'.repeat(width + 2)}┐
    │${bar}│ ${percentage}%
    └${'─'.repeat(width + 2)}┘`;
    }
    
    generateFlameEffect() {
        const flames = ['🔥', '🔥', '🔥', '💥', '🔥', '🔥', '🔥'];
        return flames.join(' ');
    }
    
    generateStarField() {
        const stars = ['✨', '⭐', '🌟', '✦', '✧', '✩'];
        return Array(20).fill().map(() => 
            stars[Math.floor(Math.random() * stars.length)]
        ).join(' ');
    }
    
    generateAsciiLogo(text) {
        // Simple block letter generation
        const letters = {
            'C': [
                '  ████  ',
                ' ██  ██ ',
                '██      ',
                '██      ',
                ' ██  ██ ',
                '  ████  '
            ],
            'A': [
                '  ████  ',
                ' ██  ██ ',
                '██    ██',
                '████████',
                '██    ██',
                '██    ██'
            ],
            'L': [
                '██      ',
                '██      ',
                '██      ',
                '██      ',
                '██      ',
                '████████'
            ]
        };
        
        const textChars = text.toUpperCase().split('');
        const lines = ['', '', '', '', '', ''];
        
        textChars.forEach(char => {
            if (letters[char]) {
                letters[char].forEach((line, index) => {
                    lines[index] += line + '  ';
                });
            }
        });
        
        return lines.join('\n');
    }
    
    // Bitmap-style text generation
    generateBitmapText(text, style = 'block') {
        const styles = {
            block: {
                on: '█',
                off: ' '
            },
            dots: {
                on: '●',
                off: '○'
            },
            hash: {
                on: '#',
                off: '.'
            }
        };
        
        const currentStyle = styles[style] || styles.block;
        
        // Simple 5x7 bitmap for letters (simplified)
        const bitmaps = {
            'C': [
                [0,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,1],
                [0,1,1,1,0]
            ],
            'A': [
                [0,1,1,1,0],
                [1,0,0,0,1],
                [1,1,1,1,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1]
            ]
        };
        
        return this.renderBitmap(text, bitmaps, currentStyle);
    }
    
    renderBitmap(text, bitmaps, style) {
        const chars = text.toUpperCase().split('');
        const result = [];
        
        // Initialize result lines
        for (let i = 0; i < 6; i++) {
            result[i] = '';
        }
        
        chars.forEach(char => {
            const bitmap = bitmaps[char];
            if (bitmap) {
                for (let row = 0; row < 6; row++) {
                    for (let col = 0; col < 5; col++) {
                        result[row] += bitmap[row][col] ? style.on : style.off;
                    }
                    result[row] += '  '; // Spacing between characters
                }
            }
        });
        
        return result.join('\n');
    }
    
    // Generate pixel art patterns
    generatePixelPattern(type, size = 16) {
        const patterns = {
            checkerboard: this.generateCheckerboard(size),
            gradient: this.generateGradient(size),
            noise: this.generateNoise(size),
            waves: this.generateWaves(size)
        };
        
        return patterns[type] || patterns.checkerboard;
    }
    
    generateCheckerboard(size) {
        let result = '';
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                result += ((x + y) % 2) ? '█' : '░';
            }
            result += '\n';
        }
        return result;
    }
    
    generateGradient(size) {
        let result = '';
        const chars = this.charSets.shading;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const intensity = Math.floor((x / size) * chars.length);
                result += chars[Math.min(intensity, chars.length - 1)];
            }
            result += '\n';
        }
        return result;
    }
    
    generateNoise(size) {
        let result = '';
        const chars = this.charSets.density;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                result += randomChar;
            }
            result += '\n';
        }
        return result;
    }
    
    generateWaves(size) {
        let result = '';
        const chars = this.charSets.shading;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const wave = Math.sin(x * 0.5) * Math.sin(y * 0.3);
                const intensity = Math.floor(((wave + 1) / 2) * chars.length);
                result += chars[Math.min(intensity, chars.length - 1)];
            }
            result += '\n';
        }
        return result;
    }
    
    // Color a piece of ASCII art (for terminal display)
    colorizeArt(art, color = 'green') {
        const colorCode = this.colors[color] || this.colors.green;
        return colorCode + art + this.colors.reset;
    }
    
    // Generate art for web display (HTML friendly)
    generateHTMLArt(type, context = {}) {
        const art = this.generateArt(type, context);
        
        return `<div class="ascii-art" style="
            font-family: 'Courier New', monospace;
            white-space: pre;
            background: #000;
            color: #00FF00;
            padding: 10px;
            border-radius: 3px;
            font-size: 10px;
            overflow-x: auto;
        ">${art}</div>`;
    }
    
    // Export art as different formats
    exportArt(art, format = 'text') {
        switch (format) {
            case 'text':
                return art;
            case 'html':
                return this.generateHTMLArt('custom', { art });
            case 'json':
                return JSON.stringify({
                    art,
                    timestamp: new Date().toISOString(),
                    engine: this.name,
                    version: this.version
                });
            default:
                return art;
        }
    }
    
    // Get all available art types
    getAvailableTypes() {
        return [
            'cal_response',
            'roasted_banner', 
            'wisdom_frame',
            'legendary_drop',
            'pixel_portrait',
            'terminal_box',
            'progress_bar',
            'ascii_logo'
        ];
    }
}

module.exports = AsciiPixelArtEngine;

// Demo mode if run directly
if (require.main === module) {
    const engine = new AsciiPixelArtEngine();
    
    console.log('\n🎨 ASCII PIXEL ART ENGINE DEMO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Demo various art types
    console.log('\n🤖 Cal Face:');
    console.log(engine.generateArt('cal_response'));
    
    console.log('\n💀 Roasted Banner:');
    console.log(engine.generateArt('roasted_banner', { username: 'DemoUser' }));
    
    console.log('\n🧠 Wisdom Frame:');
    console.log(engine.generateArt('wisdom_frame'));
    
    console.log('\n👑 Legendary Drop:');
    console.log(engine.generateArt('legendary_drop'));
    
    console.log('\n📺 Terminal Box:');
    console.log(engine.generateArt('terminal_box', { content: 'Hello from the terminal!\nThis is a demo box.' }));
    
    console.log('\n📊 Progress Bar:');
    console.log(engine.generateArt('progress_bar', { label: 'Roasting Progress:', percentage: 85 }));
    
    console.log('\n🔥 Pixel Patterns:');
    console.log('Checkerboard:');
    console.log(engine.generatePixelPattern('checkerboard', 8));
    
    console.log('\nGradient:');
    console.log(engine.generatePixelPattern('gradient', 8));
    
    console.log('\n✨ Available art types:', engine.getAvailableTypes());
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 ASCII Pixel Art Engine Demo Complete!');
}
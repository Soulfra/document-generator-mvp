#!/usr/bin/env node

/**
 * TEXT RENDERING LAYER
 * 
 * Universal text transformation layer supporting 1337 speak, alternative viewing modes,
 * overhead displays, and mass text effects without affecting underlying message encoding.
 * 
 * Works as a pure view layer on top of existing infrastructure:
 * - MorseNeuralProtocol.js (neural state encoding)
 * - test-encoding-utilities.js (header/footer processing) 
 * - VERIFICATION-SYMBOL-ENCODING.md (symbol mappings)
 */

const crypto = require('crypto');

class TextRenderingLayer {
    constructor() {
        this.renderingModes = {
            'standard': 'default',
            'leet': '1337 speak transformation',
            'mirror': 'reversed text display',
            'cipher': 'character substitution cipher', 
            'binary': 'binary representation',
            'morse': 'morse code dots and dashes',
            'symbols': 'unicode symbol replacement',
            'matrix': 'matrix rain style',
            'retro': 'old terminal style',
            'stealth': 'barely visible text'
        };

        this.initializeLeetSpeak();
        this.initializeCipherMaps();
        this.initializeSymbolMaps();
        this.initializeEffectMaps();
        
        // View state (doesn't affect underlying data)
        this.currentMode = 'standard';
        this.overheadEnabled = false;
        this.massDisplayEnabled = false;
        this.effectIntensity = 1.0;
        
        console.log('📺 Text Rendering Layer initialized');
        console.log(`🎨 Modes available: ${Object.keys(this.renderingModes).join(', ')}`);
    }

    initializeLeetSpeak() {
        // 1337 speak character mappings
        this.leetMap = {
            // Basic leet
            'a': '4', 'A': '4',
            'e': '3', 'E': '3', 
            'i': '1', 'I': '1',
            'o': '0', 'O': '0',
            's': '5', 'S': '5',
            't': '7', 'T': '7',
            'l': '1', 'L': '1',
            
            // Advanced leet
            'b': '6', 'B': '8',
            'g': '9', 'G': '9',
            'z': '2', 'Z': '2',
            'd': 'D', 
            'f': 'F',
            'h': '#', 'H': '#',
            'n': 'N',
            'r': 'R',
            'u': 'U',
            'v': 'V',
            'w': 'W',
            'x': 'X',
            'y': 'Y',
            
            // Ultra leet combinations
            'the': '7h3',
            'and': '&',
            'you': 'u',
            'your': 'ur', 
            'are': 'r',
            'to': '2',
            'for': '4',
            'be': 'b',
            'have': 'hav3',
            'that': 'th47',
            'this': '7h15',
            'with': 'w/',
            'not': 'n07',
            'can': 'c4n',
            'will': 'w111',
            'get': '937',
            'all': '411',
            'know': 'kn0w',
            'like': '11k3',
            'time': '71m3',
            'people': 'p30p13',
            'work': 'w0rk',
            'way': 'w4y',
            'new': 'n3w',
            'good': '900d',
            'great': '9r347',
            'first': '1st',
            'right': 'r19h7',
            'own': '0wn',
            'see': '533',
            'make': 'm4k3',
            'over': '0v3r',
            'think': '7h1nk',
            'also': '4150',
            'back': 'b4ck',
            'other': '07h3r',
            'want': 'w4n7',
            'look': '100k',
            'use': 'u53',
            'man': 'm4n',
            'day': 'd4y',
            'take': '74k3',
            'come': 'c0m3',
            'system': 'sy573m',
            'game': '94m3',
            'code': 'c0d3',
            'hack': 'h4ck',
            'elite': '31173',
            'leet': '1337',
            'pwn': 'pwn',
            'noob': 'n00b',
            'owned': 'pwn3d'
        };

        // Inverse leet for decoding
        this.inverseLeetMap = {};
        for (const [key, value] of Object.entries(this.leetMap)) {
            this.inverseLeetMap[value] = key;
        }
    }

    initializeCipherMaps() {
        // Various cipher transformations
        this.cipherMaps = {
            'rot13': this.generateROT13Map(),
            'atbash': this.generateAtbashMap(), 
            'keyboard': this.generateKeyboardShiftMap(),
            'reverse': this.generateReverseMap(),
            'scramble': this.generateScrambleMap()
        };
    }

    initializeSymbolMaps() {
        // Unicode symbol replacements
        this.symbolMaps = {
            'circles': {
                'a': '⚬', 'b': '●', 'c': '◐', 'd': '◑', 'e': '◒', 'f': '◓',
                'g': '○', 'h': '◯', 'i': '◦', 'j': '⚫', 'k': '⚪', 'l': '◉',
                'm': '⬤', 'n': '⚭', 'o': '⊙', 'p': '⊚', 'q': '⊛', 'r': '⊜',
                's': '⊝', 't': '⦿', 'u': '⦾', 'v': '⦽', 'w': '⧮', 'x': '⧯',
                'y': '⧲', 'z': '⧺'
            },
            
            'triangles': {
                'a': '△', 'b': '▲', 'c': '▴', 'd': '▵', 'e': '▶', 'f': '▷',
                'g': '▸', 'h': '▹', 'i': '►', 'j': '▻', 'k': '▼', 'l': '▽',
                'm': '▾', 'n': '▿', 'o': '◀', 'p': '◁', 'q': '◂', 'r': '◃',
                's': '◄', 't': '◅', 'u': '⬅', 'v': '⬆', 'w': '⬇', 'x': '➡',
                'y': '⬈', 'z': '⬉'
            },
            
            'squares': {
                'a': '■', 'b': '□', 'c': '▢', 'd': '▣', 'e': '▤', 'f': '▥',
                'g': '▦', 'h': '▧', 'i': '▨', 'j': '▩', 'k': '▪', 'l': '▫',
                'm': '▬', 'n': '▭', 'o': '▮', 'p': '▯', 'q': '▰', 'r': '▱',
                's': '▲', 't': '▴', 'u': '▵', 'v': '▶', 'w': '▷', 'x': '▸',
                'y': '▹', 'z': '►'
            },
            
            'stars': {
                'a': '★', 'b': '☆', 'c': '✦', 'd': '✧', 'e': '✩', 'f': '✪',
                'g': '✫', 'h': '✬', 'i': '✭', 'j': '✮', 'k': '✯', 'l': '✰',
                'm': '✱', 'n': '✲', 'o': '✳', 'p': '✴', 'q': '✵', 'r': '✶',
                's': '✷', 't': '✸', 'u': '✹', 'v': '✺', 'w': '✻', 'x': '✼',
                'y': '✽', 'z': '✾'
            }
        };
    }

    initializeEffectMaps() {
        // Visual effects for text
        this.effects = {
            'glitch': {
                chars: ['█', '▓', '▒', '░', '▀', '▄', '▌', '▐'],
                intensity: 0.1
            },
            
            'matrix': {
                chars: ['0', '1', 'ﾊ', 'ﾐ', 'ﾋ', 'ｰ', 'ｳ', 'ｼ', 'ﾅ', 'ﾓ', 'ﾆ', 'ｻ', 'ﾜ', 'ﾂ', 'ｵ', 'ﾘ', 'ｱ', 'ﾎ', 'ﾃ', 'ﾏ', 'ｹ', 'ﾒ', 'ｴ', 'ｶ', 'ｷ', 'ﾑ', 'ﾕ', 'ﾗ', 'ｾ', 'ﾈ', 'ｽ', 'ﾀ', 'ﾇ', 'ﾍ'],
                probability: 0.05
            },
            
            'cyberpunk': {
                prefix: ['>', '>>', '>>>', '[', '[[', '[[['],
                suffix: [']', ']]', ']]]', '_', '__', '___'],
                colors: ['cyan', 'magenta', 'green', 'yellow']
            },
            
            'retro': {
                frames: ['/', '-', '\\', '|'],
                brackets: ['[', ']', '<', '>', '{', '}'],
                padding: '_'
            }
        };
    }

    /**
     * Main rendering function - transforms text based on current mode
     */
    render(text, mode = null, options = {}) {
        const renderMode = mode || this.currentMode;
        
        // Store original for reference (never modify underlying data)
        const original = text;
        
        let rendered = text;
        
        switch (renderMode) {
            case 'leet':
                rendered = this.applyLeetSpeak(text, options);
                break;
                
            case 'mirror':
                rendered = this.applyMirror(text, options);
                break;
                
            case 'cipher':
                rendered = this.applyCipher(text, options.cipher || 'rot13');
                break;
                
            case 'binary':
                rendered = this.applyBinary(text, options);
                break;
                
            case 'morse':
                rendered = this.applyMorse(text, options);
                break;
                
            case 'symbols':
                rendered = this.applySymbols(text, options.symbolSet || 'circles');
                break;
                
            case 'matrix':
                rendered = this.applyMatrix(text, options);
                break;
                
            case 'retro':
                rendered = this.applyRetro(text, options);
                break;
                
            case 'stealth':
                rendered = this.applyStealth(text, options);
                break;
                
            default:
                rendered = text; // Standard mode
        }
        
        // Apply overhead effects if enabled
        if (this.overheadEnabled) {
            rendered = this.applyOverhead(rendered, options);
        }
        
        // Apply mass display effects if enabled  
        if (this.massDisplayEnabled) {
            rendered = this.applyMassDisplay(rendered, options);
        }
        
        return {
            original,
            rendered,
            mode: renderMode,
            metadata: {
                length: text.length,
                renderedLength: rendered.length,
                transformation: renderMode,
                overhead: this.overheadEnabled,
                massDisplay: this.massDisplayEnabled,
                timestamp: Date.now()
            }
        };
    }

    /**
     * Apply 1337 speak transformation
     */
    applyLeetSpeak(text, options = {}) {
        let result = text.toLowerCase();
        
        // Apply word-level replacements first
        for (const [word, leet] of Object.entries(this.leetMap)) {
            if (word.length > 2) { // Only replace full words
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                result = result.replace(regex, leet);
            }
        }
        
        // Apply character-level replacements
        for (const [char, leet] of Object.entries(this.leetMap)) {
            if (char.length === 1) {
                const regex = new RegExp(char, 'g');
                result = result.replace(regex, leet);
            }
        }
        
        // Apply intensity effects
        const intensity = options.intensity || this.effectIntensity;
        if (intensity > 1.0) {
            result = this.intensifyLeet(result, intensity);
        }
        
        return result;
    }

    /**
     * Apply mirror/reverse transformation
     */
    applyMirror(text, options = {}) {
        if (options.wordLevel) {
            // Reverse words but keep word order
            return text.split(' ').map(word => word.split('').reverse().join('')).join(' ');
        } else {
            // Full text reverse
            return text.split('').reverse().join('');
        }
    }

    /**
     * Apply cipher transformation
     */
    applyCipher(text, cipherType) {
        const cipher = this.cipherMaps[cipherType];
        if (!cipher) return text;
        
        return text.split('').map(char => cipher[char] || char).join('');
    }

    /**
     * Apply binary representation
     */
    applyBinary(text, options = {}) {
        const separator = options.separator || ' ';
        const padding = options.padding || 8;
        
        return text.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(padding, '0');
        }).join(separator);
    }

    /**
     * Apply morse code transformation
     */
    applyMorse(text, options = {}) {
        // Basic morse mapping
        const morse = {
            'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
            'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
            'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
            's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
            'y': '-.--', 'z': '--..', ' ': '/'
        };
        
        return text.toLowerCase().split('').map(char => morse[char] || char).join(' ');
    }

    /**
     * Apply symbol replacement
     */
    applySymbols(text, symbolSet) {
        const symbols = this.symbolMaps[symbolSet];
        if (!symbols) return text;
        
        return text.toLowerCase().split('').map(char => symbols[char] || char).join('');
    }

    /**
     * Apply matrix rain effect
     */
    applyMatrix(text, options = {}) {
        const chars = this.effects.matrix.chars;
        const probability = options.probability || this.effects.matrix.probability;
        
        return text.split('').map(char => {
            if (Math.random() < probability) {
                return chars[Math.floor(Math.random() * chars.length)];
            }
            return char;
        }).join('');
    }

    /**
     * Apply retro terminal styling
     */
    applyRetro(text, options = {}) {
        const frames = this.effects.retro.frames;
        const brackets = this.effects.retro.brackets;
        
        const frame = frames[Math.floor(Math.random() * frames.length)];
        const leftBracket = brackets[Math.floor(Math.random() * brackets.length)];
        const rightBracket = brackets[Math.floor(Math.random() * brackets.length)];
        
        return `${frame} ${leftBracket}${text}${rightBracket} ${frame}`;
    }

    /**
     * Apply stealth/barely visible effect
     */
    applyStealth(text, options = {}) {
        const opacity = options.opacity || 0.3;
        
        // Use Unicode combining characters for ghostly effect
        const ghostChars = ['̥', '̊', '̃', '̄', '̆', '̇', '̈', '̉', '̌'];
        
        return text.split('').map(char => {
            if (char !== ' ') {
                const ghost = ghostChars[Math.floor(Math.random() * ghostChars.length)];
                return char + ghost;
            }
            return char;
        }).join('');
    }

    /**
     * Apply overhead display effects
     */
    applyOverhead(text, options = {}) {
        const overheadStyle = options.overheadStyle || 'floating';
        
        switch (overheadStyle) {
            case 'floating':
                return `⬆ ${text} ⬆`;
                
            case 'bubble':
                const topBorder = '°'.repeat(text.length + 2);
                return `${topBorder}\n°${text}°\n${topBorder}`;
                
            case 'banner':
                return `╔${'═'.repeat(text.length + 2)}╗\n║ ${text} ║\n╚${'═'.repeat(text.length + 2)}╝`;
                
            default:
                return `[ ${text} ]`;
        }
    }

    /**
     * Apply mass display effects 
     */
    applyMassDisplay(text, options = {}) {
        const massEffect = options.massEffect || 'weight';
        
        switch (massEffect) {
            case 'weight':
                // Add visual weight with underscores
                return text + '\n' + '_'.repeat(text.length);
                
            case 'shadow':
                // Create shadow effect
                const shadow = text.split('').map(() => '▓').join('');
                return `${text}\n ${shadow}`;
                
            case 'depth':
                // 3D depth effect
                return text.split('').map((char, i) => char + '░'.repeat(i % 3)).join('');
                
            default:
                return text;
        }
    }

    /**
     * Switch rendering mode
     */
    setMode(mode) {
        if (this.renderingModes[mode]) {
            this.currentMode = mode;
            return true;
        }
        return false;
    }

    /**
     * Toggle overhead display
     */
    toggleOverhead(enabled = null) {
        this.overheadEnabled = enabled !== null ? enabled : !this.overheadEnabled;
        return this.overheadEnabled;
    }

    /**
     * Toggle mass display
     */
    toggleMassDisplay(enabled = null) {
        this.massDisplayEnabled = enabled !== null ? enabled : !this.massDisplayEnabled;
        return this.massDisplayEnabled;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            mode: this.currentMode,
            overhead: this.overheadEnabled,
            massDisplay: this.massDisplayEnabled,
            intensity: this.effectIntensity,
            availableModes: Object.keys(this.renderingModes)
        };
    }

    /**
     * Demonstrate all rendering modes
     */
    demonstrateAllModes(text = "the system works great") {
        console.log('\n🎨 TEXT RENDERING DEMONSTRATIONS\n');
        
        for (const mode of Object.keys(this.renderingModes)) {
            const result = this.render(text, mode);
            console.log(`${mode.toUpperCase().padEnd(10)}: ${result.rendered}`);
        }
        
        console.log('\nOVERHEAD EFFECTS:');
        this.overheadEnabled = true;
        const overhead = this.render(text, 'standard', { overheadStyle: 'banner' });
        console.log(overhead.rendered);
        
        console.log('\nMASS EFFECTS:');
        this.massDisplayEnabled = true;
        const mass = this.render(text, 'standard', { massEffect: 'shadow' });
        console.log(mass.rendered);
        
        // Reset state
        this.overheadEnabled = false;
        this.massDisplayEnabled = false;
    }

    // Helper methods for cipher generation
    generateROT13Map() {
        const map = {};
        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(97 + i); // a-z
            const shifted = String.fromCharCode(97 + ((i + 13) % 26));
            map[char] = shifted;
            map[char.toUpperCase()] = shifted.toUpperCase();
        }
        return map;
    }

    generateAtbashMap() {
        const map = {};
        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(97 + i);
            const reversed = String.fromCharCode(97 + (25 - i));
            map[char] = reversed;
            map[char.toUpperCase()] = reversed.toUpperCase();
        }
        return map;
    }

    generateKeyboardShiftMap() {
        return {
            'q': 'w', 'w': 'e', 'e': 'r', 'r': 't', 't': 'y', 'y': 'u',
            'u': 'i', 'i': 'o', 'o': 'p', 'p': 'q',
            'a': 's', 's': 'd', 'd': 'f', 'f': 'g', 'g': 'h', 'h': 'j',
            'j': 'k', 'k': 'l', 'l': 'a',
            'z': 'x', 'x': 'c', 'c': 'v', 'v': 'b', 'b': 'n', 'n': 'm',
            'm': 'z'
        };
    }

    generateReverseMap() {
        const map = {};
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < alphabet.length; i++) {
            map[alphabet[i]] = alphabet[alphabet.length - 1 - i];
            map[alphabet[i].toUpperCase()] = alphabet[alphabet.length - 1 - i].toUpperCase();
        }
        return map;
    }

    generateScrambleMap() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const scrambled = [...alphabet].sort(() => Math.random() - 0.5);
        const map = {};
        for (let i = 0; i < alphabet.length; i++) {
            map[alphabet[i]] = scrambled[i];
            map[alphabet[i].toUpperCase()] = scrambled[i].toUpperCase();
        }
        return map;
    }

    intensifyLeet(text, intensity) {
        // Add extra leet effects at higher intensities
        const extraEffects = {
            'ck': 'xx',
            'er': '3r',
            'ph': 'f',
            'tion': '710n',
            'ing': '1n9',
            'ed': '3d'
        };
        
        let result = text;
        for (const [pattern, replacement] of Object.entries(extraEffects)) {
            result = result.replace(new RegExp(pattern, 'gi'), replacement);
        }
        
        return result;
    }
}

// CLI interface
async function cli() {
    const args = process.argv.slice(2);
    const command = args[0];
    const renderer = new TextRenderingLayer();

    switch (command) {
        case 'demo':
            renderer.demonstrateAllModes(args.slice(1).join(' ') || 'the system works great');
            break;

        case 'render':
            const text = args.slice(2).join(' ') || 'test message';
            const mode = args[1] || 'leet';
            const result = renderer.render(text, mode);
            console.log('\nORIGINAL:', result.original);
            console.log('RENDERED:', result.rendered);
            console.log('MODE:', result.mode);
            break;

        case 'modes':
            console.log('\nAVAILABLE MODES:');
            for (const [mode, description] of Object.entries(renderer.renderingModes)) {
                console.log(`${mode.padEnd(12)} - ${description}`);
            }
            break;

        case 'leet':
            const leetText = args.slice(1).join(' ') || 'you are elite hacker now';
            const leetResult = renderer.render(leetText, 'leet');
            console.log('\nLEET SPEAK:');
            console.log('Original:', leetResult.original);
            console.log('1337:', leetResult.rendered);
            break;

        default:
            console.log(`
🎨 TEXT RENDERING LAYER

Commands:
  demo [text]          - Demonstrate all rendering modes
  render <mode> <text> - Render text in specific mode
  modes               - List all available modes
  leet <text>         - Convert text to 1337 speak

Modes:
  standard, leet, mirror, cipher, binary, morse, symbols, 
  matrix, retro, stealth

Examples:
  node text-rendering-layer.js demo "hello world"
  node text-rendering-layer.js render leet "you are elite"
  node text-rendering-layer.js leet "the system works"

Features:
  ✅ Pure view layer (doesn't affect underlying data)
  ✅ 1337 speak with word and character replacement
  ✅ Multiple cipher modes (ROT13, Atbash, keyboard shift)
  ✅ Symbol replacement (circles, triangles, squares, stars)
  ✅ Visual effects (matrix, glitch, retro terminal)
  ✅ Overhead display modes (floating, bubble, banner)
  ✅ Mass display effects (weight, shadow, depth)
  ✅ Stealth/barely visible mode
  ✅ Binary and morse code representation
            `);
    }
}

module.exports = TextRenderingLayer;

// Run CLI if executed directly
if (require.main === module) {
    cli().catch(console.error);
}

console.log('🎨 Text Rendering Layer ready');
console.log('📺 Pure view transformations without affecting core data');
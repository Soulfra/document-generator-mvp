#!/usr/bin/env node

/**
 * 🎨 COLOR TEXT PIXEL SYSTEM
 * Convert color-coded text descriptions into precise pixel art/bitmaps
 * Like AI Horde but using simple text format with color codes
 * Laser-precise pixel placement using coordinate-based commands
 */

const AsciiPixelArtEngine = require('./ascii-pixel-art-engine.js');
let VisualContentPipeline;
try {
    VisualContentPipeline = require('./visual-content-pipeline.js');
} catch {
    VisualContentPipeline = require('./visual-content-pipeline-mock.js');
}
const fs = require('fs').promises;

class ColorTextPixelSystem {
    constructor(options = {}) {
        this.options = {
            gridSize: options.gridSize || 32,
            outputFormat: options.outputFormat || 'both', // 'ascii', 'canvas', 'both'
            colorMode: options.colorMode || 'hex', // 'hex', 'rgb', 'terminal'
            enableAI: options.enableAI !== false,
            outputDir: options.outputDir || './pixel-output',
            ...options
        };
        
        // Initialize engines
        this.asciiEngine = new AsciiPixelArtEngine();
        
        if (this.options.enableAI) {
            this.aiPipeline = new VisualContentPipeline({
                outputDir: './ai-pixel-output',
                watermarkStyle: 'tech',
                enableImageGeneration: true
            });
        }
        
        // Color palette definitions
        this.colors = {
            // Standard hex colors
            hex: {
                'R': '#FF0000', 'G': '#00FF00', 'B': '#0000FF',
                'Y': '#FFFF00', 'M': '#FF00FF', 'C': '#00FFFF',
                'W': '#FFFFFF', 'K': '#000000', 'X': '#808080',
                '0': '#000000', '1': '#FF0000', '2': '#00FF00', '3': '#0000FF',
                '4': '#FFFF00', '5': '#FF00FF', '6': '#00FFFF', '7': '#FFFFFF',
                '8': '#808080', '9': '#404040'
            },
            
            // RGB values
            rgb: {
                'R': [255, 0, 0], 'G': [0, 255, 0], 'B': [0, 0, 255],
                'Y': [255, 255, 0], 'M': [255, 0, 255], 'C': [0, 255, 255],
                'W': [255, 255, 255], 'K': [0, 0, 0], 'X': [128, 128, 128]
            },
            
            // Terminal colors
            terminal: {
                'R': '\x1b[31m██\x1b[0m', 'G': '\x1b[32m██\x1b[0m', 'B': '\x1b[34m██\x1b[0m',
                'Y': '\x1b[33m██\x1b[0m', 'M': '\x1b[35m██\x1b[0m', 'C': '\x1b[36m██\x1b[0m',
                'W': '\x1b[37m██\x1b[0m', 'K': '\x1b[30m██\x1b[0m', 'X': '\x1b[90m██\x1b[0m',
                ' ': '  ', '.': '\x1b[90m▓▓\x1b[0m'
            },
            
            // GameBoy style (4 shades of green)
            gameboy: {
                '0': '#0F380F', '1': '#306230', '2': '#8BAC0F', '3': '#9BBC0F',
                ' ': '#9BBC0F', '.': '#8BAC0F', 'o': '#306230', '#': '#0F380F'
            },
            
            // Cyberpunk neon
            cyberpunk: {
                'R': '#FF0080', 'G': '#00FF80', 'B': '#0080FF',
                'Y': '#FFFF00', 'M': '#FF00FF', 'C': '#00FFFF',
                'W': '#FFFFFF', 'K': '#000000', 'X': '#404040'
            }
        };
        
        // Command patterns for pixel placement
        this.commands = {
            // Basic: R 5,10 = Red pixel at (5,10) - note the space after color
            basic: /^([RGBYMCWKX0-9])\s+(\d+)\s*,\s*(\d+)$/,
            
            // Line: R 5,10-15,20 = Red line from (5,10) to (15,20)
            line: /^([RGBYMCWKX0-9])\s+(\d+)\s*,\s*(\d+)\s*-\s*(\d+)\s*,\s*(\d+)$/,
            
            // Fill: R 5,10:3x4 = Red rectangle at (5,10) size 3x4
            rect: /^([RGBYMCWKX0-9])\s+(\d+)\s*,\s*(\d+)\s*:\s*(\d+)x(\d+)$/,
            
            // Circle: R 10,10~5 = Red circle center (10,10) radius 5
            circle: /^([RGBYMCWKX0-9])\s+(\d+)\s*,\s*(\d+)\s*~\s*(\d+)$/,
            
            // Custom hex: #FF0080@5,10 = Custom color at (5,10)
            hex: /^#([0-9A-F]{6})\s*@\s*(\d+)\s*,\s*(\d+)$/i,
            
            // Flood fill: R 5,10* = Flood fill with Red starting at (5,10)
            flood: /^([RGBYMCWKX0-9])\s+(\d+)\s*,\s*(\d+)\s*\*$/,
            
            // Pattern: CHK 5,5:8x8 = Checkerboard at (5,5) size 8x8
            pattern: /^(CHK|GRD|NOI|WAV)\s+(\d+)\s*,\s*(\d+)\s*:\s*(\d+)x(\d+)$/
        };
        
        console.log('🎨 Color Text Pixel System initialized');
        console.log(`📐 Grid size: ${this.options.gridSize}x${this.options.gridSize}`);
        console.log(`🎯 Output format: ${this.options.outputFormat}`);
        console.log(`🤖 AI enhanced: ${this.options.enableAI}`);
    }
    
    /**
     * Main method: Process color-coded text into pixel art
     * @param {string} input - Color-coded text commands
     * @param {object} options - Processing options
     */
    async processText(input, options = {}) {
        console.log('🔄 Processing color-coded text...');
        
        const commands = this.parseCommands(input);
        const bitmap = this.createBitmap();
        
        // Process each command
        for (const command of commands) {
            this.executeCommand(bitmap, command);
        }
        
        // Generate outputs
        const results = {
            bitmap: bitmap,
            ascii: null,
            canvas: null,
            ai: null,
            metadata: {
                gridSize: this.options.gridSize,
                commandCount: commands.length,
                generatedAt: Date.now(),
                colorMode: this.options.colorMode
            }
        };
        
        // Generate ASCII version
        if (this.options.outputFormat === 'ascii' || this.options.outputFormat === 'both') {
            results.ascii = this.bitmapToAscii(bitmap);
        }
        
        // Generate canvas/HTML version
        if (this.options.outputFormat === 'canvas' || this.options.outputFormat === 'both') {
            results.canvas = this.bitmapToCanvas(bitmap);
        }
        
        // AI enhance if enabled
        if (this.options.enableAI && options.enhanceWithAI) {
            results.ai = await this.enhanceWithAI(bitmap, input, options);
        }
        
        // Save to file if requested
        if (options.saveToFile) {
            await this.saveResults(results, options.saveToFile);
        }
        
        console.log(`✅ Processed ${commands.length} commands`);
        return results;
    }
    
    /**
     * Parse input text into commands
     */
    parseCommands(input) {
        const lines = input.trim().split('\n');
        const commands = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#') || line.startsWith('//')) continue;
            
            const command = this.parseCommand(line, i + 1);
            if (command) {
                commands.push(command);
            } else {
                console.warn(`⚠️ Invalid command on line ${i + 1}: ${line}`);
            }
        }
        
        return commands;
    }
    
    /**
     * Parse a single command line
     */
    parseCommand(line, lineNumber) {
        // Strip comments from the line before pattern matching
        const commandOnly = line.split('#')[0].trim();
        
        // Try each command pattern
        for (const [type, pattern] of Object.entries(this.commands)) {
            const match = commandOnly.match(pattern);
            if (match) {
                return this.createCommand(type, match, lineNumber, line);
            }
        }
        
        return null;
    }
    
    /**
     * Create command object from regex match
     */
    createCommand(type, match, lineNumber, originalLine = null) {
        const command = { type, line: lineNumber, raw: originalLine || match[0] };
        
        switch (type) {
            case 'basic':
                command.color = match[1];
                command.x = parseInt(match[2]);
                command.y = parseInt(match[3]);
                break;
                
            case 'line':
                command.color = match[1];
                command.x1 = parseInt(match[2]);
                command.y1 = parseInt(match[3]);
                command.x2 = parseInt(match[4]);
                command.y2 = parseInt(match[5]);
                break;
                
            case 'rect':
                command.color = match[1];
                command.x = parseInt(match[2]);
                command.y = parseInt(match[3]);
                command.width = parseInt(match[4]);
                command.height = parseInt(match[5]);
                break;
                
            case 'circle':
                command.color = match[1];
                command.x = parseInt(match[2]);
                command.y = parseInt(match[3]);
                command.radius = parseInt(match[4]);
                break;
                
            case 'hex':
                command.color = `#${match[1]}`;
                command.x = parseInt(match[2]);
                command.y = parseInt(match[3]);
                break;
                
            case 'flood':
                command.color = match[1];
                command.x = parseInt(match[2]);
                command.y = parseInt(match[3]);
                break;
                
            case 'pattern':
                command.pattern = match[1];
                command.x = parseInt(match[2]);
                command.y = parseInt(match[3]);
                command.width = parseInt(match[4]);
                command.height = parseInt(match[5]);
                break;
        }
        
        return command;
    }
    
    /**
     * Create empty bitmap grid
     */
    createBitmap() {
        const size = this.options.gridSize;
        const bitmap = [];
        
        for (let y = 0; y < size; y++) {
            bitmap[y] = [];
            for (let x = 0; x < size; x++) {
                bitmap[y][x] = ' '; // Empty space
            }
        }
        
        return bitmap;
    }
    
    /**
     * Execute a single command on the bitmap
     */
    executeCommand(bitmap, command) {
        const size = this.options.gridSize;
        
        switch (command.type) {
            case 'basic':
            case 'hex':
                if (this.inBounds(command.x, command.y, size)) {
                    bitmap[command.y][command.x] = command.color;
                }
                break;
                
            case 'line':
                this.drawLine(bitmap, command);
                break;
                
            case 'rect':
                this.drawRect(bitmap, command);
                break;
                
            case 'circle':
                this.drawCircle(bitmap, command);
                break;
                
            case 'flood':
                this.floodFill(bitmap, command);
                break;
                
            case 'pattern':
                this.drawPattern(bitmap, command);
                break;
        }
    }
    
    /**
     * Draw line between two points
     */
    drawLine(bitmap, command) {
        const { color, x1, y1, x2, y2 } = command;
        const size = this.options.gridSize;
        
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1, y = y1;
        
        while (true) {
            if (this.inBounds(x, y, size)) {
                bitmap[y][x] = color;
            }
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
    
    /**
     * Draw filled rectangle
     */
    drawRect(bitmap, command) {
        const { color, x, y, width, height } = command;
        const size = this.options.gridSize;
        
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const px = x + dx;
                const py = y + dy;
                
                if (this.inBounds(px, py, size)) {
                    bitmap[py][px] = color;
                }
            }
        }
    }
    
    /**
     * Draw filled circle
     */
    drawCircle(bitmap, command) {
        const { color, x: cx, y: cy, radius } = command;
        const size = this.options.gridSize;
        
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                
                if (distance <= radius && this.inBounds(x, y, size)) {
                    bitmap[y][x] = color;
                }
            }
        }
    }
    
    /**
     * Flood fill algorithm
     */
    floodFill(bitmap, command) {
        const { color, x, y } = command;
        const size = this.options.gridSize;
        
        if (!this.inBounds(x, y, size)) return;
        
        const targetColor = bitmap[y][x];
        if (targetColor === color) return;
        
        const stack = [[x, y]];
        
        while (stack.length > 0) {
            const [px, py] = stack.pop();
            
            if (!this.inBounds(px, py, size) || bitmap[py][px] !== targetColor) {
                continue;
            }
            
            bitmap[py][px] = color;
            
            // Add neighbors to stack
            stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
        }
    }
    
    /**
     * Draw pattern (checkerboard, gradient, noise, wave)
     */
    drawPattern(bitmap, command) {
        const { pattern, x, y, width, height } = command;
        const size = this.options.gridSize;
        
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const px = x + dx;
                const py = y + dy;
                
                if (!this.inBounds(px, py, size)) continue;
                
                let color = ' ';
                
                switch (pattern) {
                    case 'CHK': // Checkerboard
                        color = ((px + py) % 2) ? 'K' : 'W';
                        break;
                        
                    case 'GRD': // Gradient
                        const intensity = Math.floor((dx / width) * 4);
                        color = ['K', 'X', '8', 'W'][intensity] || 'W';
                        break;
                        
                    case 'NOI': // Noise
                        color = ['K', 'X', '8', 'W'][Math.floor(Math.random() * 4)];
                        break;
                        
                    case 'WAV': // Wave
                        const wave = Math.sin(dx * 0.5) * Math.sin(dy * 0.3);
                        const waveIntensity = Math.floor(((wave + 1) / 2) * 4);
                        color = ['K', 'X', '8', 'W'][waveIntensity] || 'W';
                        break;
                }
                
                bitmap[py][px] = color;
            }
        }
    }
    
    /**
     * Check if coordinates are within bounds
     */
    inBounds(x, y, size) {
        return x >= 0 && x < size && y >= 0 && y < size;
    }
    
    /**
     * Convert bitmap to ASCII art
     */
    bitmapToAscii(bitmap) {
        const colorMap = this.colors.terminal;
        let result = '';
        
        for (let y = 0; y < bitmap.length; y++) {
            for (let x = 0; x < bitmap[y].length; x++) {
                const pixel = bitmap[y][x];
                result += colorMap[pixel] || colorMap[' '];
            }
            result += '\n';
        }
        
        return result;
    }
    
    /**
     * Convert bitmap to HTML canvas
     */
    bitmapToCanvas(bitmap) {
        const size = this.options.gridSize;
        const pixelSize = Math.max(1, Math.floor(800 / size));
        
        let html = `<canvas id="pixelCanvas" width="${size * pixelSize}" height="${size * pixelSize}" style="
            border: 2px solid #333;
            background: #000;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        "></canvas>\n`;
        
        html += `<script>\n`;
        html += `const canvas = document.getElementById('pixelCanvas');\n`;
        html += `const ctx = canvas.getContext('2d');\n`;
        html += `const pixelSize = ${pixelSize};\n`;
        html += `const colors = ${JSON.stringify(this.colors.hex)};\n`;
        html += `\n`;
        
        html += `// Draw bitmap\n`;
        for (let y = 0; y < bitmap.length; y++) {
            for (let x = 0; x < bitmap[y].length; x++) {
                const pixel = bitmap[y][x];
                if (pixel !== ' ') {
                    const color = this.colors.hex[pixel] || '#808080';
                    html += `ctx.fillStyle = '${color}'; ctx.fillRect(${x * pixelSize}, ${y * pixelSize}, pixelSize, pixelSize);\n`;
                }
            }
        }
        
        html += `</script>`;
        
        return html;
    }
    
    /**
     * Enhance bitmap with AI
     */
    async enhanceWithAI(bitmap, originalInput, options) {
        if (!this.aiPipeline) return null;
        
        try {
            console.log('🤖 AI enhancing pixel art...');
            
            // Create description for AI
            const description = this.describeBitmap(bitmap, originalInput);
            
            // Generate enhanced version
            const aiResult = await this.aiPipeline.generateImage(description, {
                type: 'pixel_art',
                style: 'enhanced',
                aspectRatio: '1:1'
            });
            
            return {
                description,
                result: aiResult,
                enhancedAt: Date.now()
            };
            
        } catch (error) {
            console.error('AI enhancement failed:', error);
            return null;
        }
    }
    
    /**
     * Create description of bitmap for AI
     */
    describeBitmap(bitmap, originalInput) {
        const colorCounts = {};
        let filledPixels = 0;
        
        // Count colors and pixels
        for (let y = 0; y < bitmap.length; y++) {
            for (let x = 0; x < bitmap[y].length; x++) {
                const pixel = bitmap[y][x];
                if (pixel !== ' ') {
                    colorCounts[pixel] = (colorCounts[pixel] || 0) + 1;
                    filledPixels++;
                }
            }
        }
        
        const dominantColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([color]) => color);
        
        return `Pixel art with ${filledPixels} pixels, dominant colors: ${dominantColors.join(', ')}, ` +
               `created from commands: ${originalInput.split('\n').slice(0, 3).join('; ')}, ` +
               `high contrast, retro gaming style, clean lines, ${this.options.gridSize}x${this.options.gridSize} grid`;
    }
    
    /**
     * Save results to files
     */
    async saveResults(results, basename) {
        try {
            await fs.mkdir(this.options.outputDir, { recursive: true });
            
            // Save ASCII version
            if (results.ascii) {
                await fs.writeFile(
                    `${this.options.outputDir}/${basename}.txt`, 
                    results.ascii
                );
            }
            
            // Save HTML canvas
            if (results.canvas) {
                const html = `<!DOCTYPE html>\n<html><head><title>Pixel Art: ${basename}</title></head><body>\n${results.canvas}\n</body></html>`;
                await fs.writeFile(
                    `${this.options.outputDir}/${basename}.html`, 
                    html
                );
            }
            
            // Save bitmap data as JSON
            await fs.writeFile(
                `${this.options.outputDir}/${basename}.json`,
                JSON.stringify({
                    bitmap: results.bitmap,
                    metadata: results.metadata
                }, null, 2)
            );
            
            console.log(`💾 Results saved to ${this.options.outputDir}/${basename}.*`);
            
        } catch (error) {
            console.error('Failed to save results:', error);
        }
    }
    
    /**
     * Get example commands for documentation
     */
    getExampleCommands() {
        return `# Color Text Pixel System - Command Examples
# Basic pixel placement: COLOR X,Y
R 5,10       # Red pixel at (5,10)
G 10,15      # Green pixel at (10,15)

# Lines: COLOR X1,Y1-X2,Y2
R 0,0-31,31  # Red diagonal line
B 5,5-25,5   # Blue horizontal line

# Rectangles: COLOR X,Y:WxH
R 10,10:5x3  # Red 5x3 rectangle at (10,10)
G 0,0:32x32  # Green fill entire grid

# Circles: COLOR X,Y~R
B 16,16~8    # Blue circle center (16,16) radius 8

# Custom colors: #RRGGBB@X,Y
#FF0080@15,20  # Pink pixel at (15,20)

# Flood fill: COLOR X,Y*
W 10,10*     # White flood fill from (10,10)

# Patterns: PATTERN X,Y:WxH
CHK 0,0:16x16   # Checkerboard 16x16
GRD 16,0:16x16  # Gradient 16x16
NOI 0,16:16x16  # Noise 16x16
WAV 16,16:16x16 # Wave 16x16

# Color codes:
# R=Red, G=Green, B=Blue, Y=Yellow, M=Magenta, C=Cyan
# W=White, K=Black, X=Gray
# 0-9 = Number-based colors`;
    }
}

module.exports = ColorTextPixelSystem;

// CLI usage
if (require.main === module) {
    const system = new ColorTextPixelSystem({
        gridSize: 16,
        outputFormat: 'both',
        enableAI: true
    });
    
    // Demo example
    const demoCommands = `# Simple face
R 5,3      # Left eye
R 10,3     # Right eye
R 8,8      # Nose
R 5,12-10,12  # Mouth
B 0,0:16x16   # Blue border rectangle
`;
    
    console.log('\n🎨 COLOR TEXT PIXEL SYSTEM DEMO');
    console.log('━'.repeat(50));
    
    console.log('\n📖 Example Commands:');
    console.log(system.getExampleCommands());
    
    console.log('\n🎯 Processing demo commands...');
    
    system.processText(demoCommands, {
        saveToFile: 'demo-face',
        enhanceWithAI: false
    }).then(results => {
        console.log('\n✅ Demo complete!');
        console.log('ASCII Output:');
        console.log(results.ascii);
        
        console.log('\n📁 Files saved:');
        console.log('- demo-face.txt (ASCII)');
        console.log('- demo-face.html (Canvas)');
        console.log('- demo-face.json (Data)');
        
        console.log('\n🎮 Try these commands:');
        console.log('R 5,5         - Red pixel');
        console.log('R 0,0-15,15   - Red diagonal');
        console.log('#00FFFF@8,8   - Cyan pixel');
        console.log('CHK 0,0:16x16 - Checkerboard');
        
    }).catch(console.error);
}
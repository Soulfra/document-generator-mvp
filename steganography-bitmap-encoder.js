#!/usr/bin/env node

/**
 * Steganography Bitmap Encoder
 * 
 * Hides authentication data in visual patterns, images, and sprites using:
 * - LSB (Least Significant Bit) encoding in pixels
 * - Pattern-based encoding in geometric shapes
 * - Frequency domain hiding using DCT
 * - Groove-based encoding in centipede segments
 * - Multi-layer visual ciphers
 * 
 * Integrates with the centipede authentication system to hide challenges
 * and verification data within the visual game elements.
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class SteganographyBitmapEncoder extends EventEmitter {
    constructor() {
        super();
        
        this.systemId = `SBE-${Date.now()}`;
        
        // Encoding methods available
        this.encodingMethods = {
            lsb: {
                name: 'Least Significant Bit',
                description: 'Hide data in the least significant bits of pixel values',
                capacity: 'High',
                detectability: 'Low',
                complexity: 'Simple'
            },
            pattern: {
                name: 'Pattern-Based Encoding',
                description: 'Embed data in geometric patterns and shapes',
                capacity: 'Medium',
                detectability: 'Medium',
                complexity: 'Moderate'
            },
            frequency: {
                name: 'Frequency Domain',
                description: 'Hide data in DCT coefficients of image blocks',
                capacity: 'Medium',
                detectability: 'Very Low',
                complexity: 'High'
            },
            groove: {
                name: 'Groove Encoding',
                description: 'Embed data in centipede segment spacing and colors',
                capacity: 'Low',
                detectability: 'Minimal',
                complexity: 'High'
            },
            multi_layer: {
                name: 'Multi-Layer Cipher',
                description: 'Combine multiple encoding methods for maximum security',
                capacity: 'Variable',
                detectability: 'Extremely Low',
                complexity: 'Very High'
            }
        };
        
        // Canvas contexts for encoding
        this.canvases = new Map();
        this.contexts = new Map();
        
        // Encoded data registry
        this.encodedData = new Map();
        
        // Authentication challenges embedded in visuals
        this.hiddenChallenges = new Map();
        
        // Pattern libraries
        this.patternLibrary = {
            fibonacci: this.generateFibonacciPattern(),
            mandelbrot: this.generateMandelbrotPattern(),
            cellular: this.generateCellularPattern(),
            neural: this.generateNeuralPattern(),
            quantum: this.generateQuantumPattern()
        };
        
        // Color palettes for encoding
        this.colorPalettes = {
            oceanic: ['#003366', '#0066cc', '#0099ff', '#00ccff', '#66ffff'],
            forest: ['#004400', '#008800', '#00cc00', '#44ff44', '#88ff88'],
            sunset: ['#660000', '#cc0000', '#ff4400', '#ff8800', '#ffcc00'],
            aurora: ['#220066', '#4400cc', '#6600ff', '#8844ff', '#aa88ff'],
            neural: ['#001122', '#002244', '#004488', '#0088cc', '#00ccff']
        };
        
        // DCT coefficients for frequency domain encoding
        this.dctMatrix = this.generateDCTMatrix(8);
        
        console.log('🎨 Steganography Bitmap Encoder Initializing...\n');
        this.initialize();
    }
    
    initialize() {
        console.log('📊 ENCODING METHODS AVAILABLE:');
        Object.entries(this.encodingMethods).forEach(([key, method]) => {
            console.log(`   ${method.name}: ${method.description}`);
            console.log(`     Capacity: ${method.capacity} | Detectability: ${method.detectability}`);
        });
        
        console.log('\n🎭 PATTERN LIBRARIES LOADED:');
        Object.keys(this.patternLibrary).forEach(pattern => {
            console.log(`   • ${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Pattern`);
        });
        
        console.log('\n🎨 COLOR PALETTES READY:');
        Object.keys(this.colorPalettes).forEach(palette => {
            console.log(`   • ${palette.charAt(0).toUpperCase() + palette.slice(1)} (${this.colorPalettes[palette].length} colors)`);
        });
        
        this.emit('system_initialized');
        console.log('\n✅ Steganography system ready for encoding!\n');
    }
    
    // Create canvas for image manipulation
    createCanvas(width, height, id = null) {
        const canvasId = id || `canvas_${Date.now()}`;
        
        // In browser environment, create actual canvas
        if (typeof document !== 'undefined') {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            this.canvases.set(canvasId, canvas);
            this.contexts.set(canvasId, ctx);
            
            return { canvas, ctx, id: canvasId };
        }
        
        // In Node.js environment, create virtual canvas
        const virtualCanvas = {
            width,
            height,
            data: new Array(width * height * 4).fill(0) // RGBA
        };
        
        this.canvases.set(canvasId, virtualCanvas);
        
        return { canvas: virtualCanvas, id: canvasId };
    }
    
    // LSB Encoding - Hide data in least significant bits
    encodeLSB(imageData, message, key = null) {
        console.log(`🔐 LSB Encoding: ${message.length} characters`);
        
        const encrypted = key ? this.encryptMessage(message, key) : message;
        const binary = this.stringToBinary(encrypted);
        
        // Add length header (32 bits)
        const lengthBinary = binary.length.toString(2).padStart(32, '0');
        const fullBinary = lengthBinary + binary;
        
        console.log(`   Binary length: ${fullBinary.length} bits`);
        console.log(`   Image capacity: ${imageData.data.length / 4} pixels (${imageData.data.length} bits)`);
        
        if (fullBinary.length > imageData.data.length) {
            throw new Error('Message too large for image capacity');
        }
        
        // Encode binary data into LSBs
        for (let i = 0; i < fullBinary.length; i++) {
            const bit = parseInt(fullBinary[i]);
            const pixelIndex = i;
            
            // Modify LSB of pixel value
            imageData.data[pixelIndex] = (imageData.data[pixelIndex] & 0xFE) | bit;
        }
        
        console.log(`✅ LSB Encoding complete: ${fullBinary.length} bits encoded`);
        
        return {
            method: 'lsb',
            bitsEncoded: fullBinary.length,
            imageData,
            checksum: this.calculateChecksum(fullBinary)
        };
    }
    
    // LSB Decoding - Extract hidden data from LSBs
    decodeLSB(imageData, key = null) {
        console.log('🔍 LSB Decoding...');
        
        // Extract length (first 32 bits)
        let lengthBinary = '';
        for (let i = 0; i < 32; i++) {
            lengthBinary += (imageData.data[i] & 1).toString();
        }
        
        const messageLength = parseInt(lengthBinary, 2);
        console.log(`   Message length: ${messageLength} bits`);
        
        if (messageLength <= 0 || messageLength > imageData.data.length - 32) {
            throw new Error('Invalid message length or corrupted data');
        }
        
        // Extract message bits
        let messageBinary = '';
        for (let i = 32; i < 32 + messageLength; i++) {
            messageBinary += (imageData.data[i] & 1).toString();
        }
        
        const message = this.binaryToString(messageBinary);
        const decrypted = key ? this.decryptMessage(message, key) : message;
        
        console.log(`✅ LSB Decoding complete: "${decrypted.substring(0, 50)}..."`);
        
        return {
            method: 'lsb',
            message: decrypted,
            bitsDecoded: messageLength,
            checksum: this.calculateChecksum(messageBinary)
        };
    }
    
    // Pattern-based encoding using geometric shapes
    encodePattern(canvas, ctx, message, patternType = 'fibonacci') {
        console.log(`🔶 Pattern Encoding: ${patternType} pattern`);
        
        const pattern = this.patternLibrary[patternType];
        if (!pattern) {
            throw new Error(`Pattern type '${patternType}' not found`);
        }
        
        const binary = this.stringToBinary(message);
        console.log(`   Binary data: ${binary.length} bits`);
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Encode data using pattern positions
        let bitIndex = 0;
        pattern.forEach((point, index) => {
            if (bitIndex < binary.length) {
                const bit = parseInt(binary[bitIndex]);
                const x = (point.x * canvas.width) % canvas.width;
                const y = (point.y * canvas.height) % canvas.height;
                
                // Encode bit as color intensity or shape
                const intensity = bit ? 255 : 127;
                ctx.fillStyle = `rgba(${intensity}, ${intensity}, ${intensity}, 0.8)`;
                
                // Draw encoding shape
                ctx.beginPath();
                ctx.arc(x, y, 3 + bit * 2, 0, Math.PI * 2);
                ctx.fill();
                
                bitIndex++;
            }
        });
        
        // Add pattern metadata
        this.encodedData.set(`pattern_${Date.now()}`, {
            method: 'pattern',
            patternType,
            message,
            bitsEncoded: bitIndex,
            canvas: canvas
        });
        
        console.log(`✅ Pattern Encoding complete: ${bitIndex} bits encoded`);
        
        return {
            method: 'pattern',
            patternType,
            bitsEncoded: bitIndex,
            canvas
        };
    }
    
    // Frequency domain encoding using DCT
    encodeFrequency(imageData, message, strength = 10) {
        console.log(`🌊 Frequency Domain Encoding (strength: ${strength})`);
        
        const binary = this.stringToBinary(message);
        const blockSize = 8;
        const numBlocks = Math.floor(imageData.width / blockSize) * Math.floor(imageData.height / blockSize);
        
        console.log(`   Image blocks: ${numBlocks} (${blockSize}x${blockSize})`);
        console.log(`   Binary data: ${binary.length} bits`);
        
        if (binary.length > numBlocks) {
            throw new Error('Message too large for frequency domain capacity');
        }
        
        let bitIndex = 0;
        
        // Process image in 8x8 blocks
        for (let blockY = 0; blockY < Math.floor(imageData.height / blockSize); blockY++) {
            for (let blockX = 0; blockX < Math.floor(imageData.width / blockSize); blockX++) {
                if (bitIndex >= binary.length) break;
                
                const bit = parseInt(binary[bitIndex]);
                
                // Extract 8x8 block
                const block = this.extractBlock(imageData, blockX * blockSize, blockY * blockSize, blockSize);
                
                // Apply DCT
                const dctBlock = this.applyDCT(block);
                
                // Modify middle frequency coefficient
                const coeff = dctBlock[2][2];
                const newCoeff = bit ? coeff + strength : coeff - strength;
                dctBlock[2][2] = Math.max(0, Math.min(255, newCoeff));
                
                // Apply inverse DCT
                const modifiedBlock = this.applyIDCT(dctBlock);
                
                // Put block back into image
                this.insertBlock(imageData, modifiedBlock, blockX * blockSize, blockY * blockSize, blockSize);
                
                bitIndex++;
            }
            if (bitIndex >= binary.length) break;
        }
        
        console.log(`✅ Frequency Domain Encoding complete: ${bitIndex} bits encoded`);
        
        return {
            method: 'frequency',
            bitsEncoded: bitIndex,
            strength,
            imageData
        };
    }
    
    // Groove encoding for centipede segments
    encodeGroove(centipedeSegments, message, grooveType = 'spacing') {
        console.log(`🐛 Groove Encoding: ${grooveType} method`);
        
        const binary = this.stringToBinary(message);
        console.log(`   Segments available: ${centipedeSegments.length}`);
        console.log(`   Binary data: ${binary.length} bits`);
        
        if (binary.length > centipedeSegments.length) {
            throw new Error('Message too large for centipede groove capacity');
        }
        
        const encodedSegments = [...centipedeSegments];
        
        for (let i = 0; i < binary.length; i++) {
            const bit = parseInt(binary[i]);
            const segment = encodedSegments[i];
            
            switch (grooveType) {
                case 'spacing':
                    // Encode in segment spacing
                    segment.spacing = bit ? 1.2 : 0.8;
                    break;
                    
                case 'color':
                    // Encode in color intensity
                    segment.colorIntensity = bit ? 1.0 : 0.7;
                    break;
                    
                case 'size':
                    // Encode in segment size
                    segment.sizeMultiplier = bit ? 1.1 : 0.9;
                    break;
                    
                case 'angle':
                    // Encode in segment angle deviation
                    segment.angleDeviation = bit ? 0.1 : -0.1;
                    break;
            }
        }
        
        console.log(`✅ Groove Encoding complete: ${binary.length} bits encoded`);
        
        return {
            method: 'groove',
            grooveType,
            bitsEncoded: binary.length,
            segments: encodedSegments
        };
    }
    
    // Multi-layer encoding combining multiple methods
    encodeMultiLayer(canvas, ctx, imageData, centipedeSegments, message, layers = ['lsb', 'pattern', 'groove']) {
        console.log(`🏗️ Multi-Layer Encoding: ${layers.join(' + ')}`);
        
        const results = [];
        const messageChunks = this.splitMessage(message, layers.length);
        
        layers.forEach((layer, index) => {
            const chunk = messageChunks[index] || '';
            console.log(`   Layer ${index + 1} (${layer}): "${chunk.substring(0, 20)}..."`);
            
            let result;
            switch (layer) {
                case 'lsb':
                    result = this.encodeLSB(imageData, chunk);
                    break;
                case 'pattern':
                    result = this.encodePattern(canvas, ctx, chunk, 'fibonacci');
                    break;
                case 'groove':
                    result = this.encodeGroove(centipedeSegments, chunk, 'spacing');
                    break;
                case 'frequency':
                    result = this.encodeFrequency(imageData, chunk);
                    break;
            }
            
            if (result) {
                results.push(result);
            }
        });
        
        console.log(`✅ Multi-Layer Encoding complete: ${layers.length} layers`);
        
        return {
            method: 'multi_layer',
            layers: results,
            totalBits: results.reduce((sum, r) => sum + (r.bitsEncoded || 0), 0)
        };
    }
    
    // Hide authentication challenge in visual pattern
    hideAuthenticationChallenge(canvas, ctx, challenge) {
        console.log(`🔐 Hiding Authentication Challenge: ${challenge.type}`);
        
        const challengeData = JSON.stringify(challenge);
        const challengeId = crypto.randomBytes(8).toString('hex');
        
        // Create visual pattern that encodes the challenge
        const pattern = this.createChallengePattern(challenge);
        
        // Draw pattern on canvas
        ctx.save();
        ctx.globalAlpha = 0.1; // Very subtle
        
        pattern.elements.forEach(element => {
            ctx.fillStyle = element.color;
            ctx.beginPath();
            
            switch (element.type) {
                case 'circle':
                    ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
                    break;
                case 'rectangle':
                    ctx.rect(element.x, element.y, element.width, element.height);
                    break;
                case 'line':
                    ctx.moveTo(element.x1, element.y1);
                    ctx.lineTo(element.x2, element.y2);
                    ctx.stroke();
                    break;
            }
            
            ctx.fill();
        });
        
        ctx.restore();
        
        // Store challenge metadata
        this.hiddenChallenges.set(challengeId, {
            challenge,
            pattern,
            position: pattern.centroid,
            discoverable: false,
            attempts: 0
        });
        
        console.log(`✅ Authentication Challenge hidden: ${challengeId}`);
        
        return {
            challengeId,
            pattern,
            visible: false
        };
    }
    
    // Detect if user has discovered hidden challenge
    checkChallengeDiscovery(challengeId, userPosition, tolerance = 50) {
        const hiddenChallenge = this.hiddenChallenges.get(challengeId);
        if (!hiddenChallenge) return false;
        
        const dx = userPosition.x - hiddenChallenge.position.x;
        const dy = userPosition.y - hiddenChallenge.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= tolerance) {
            hiddenChallenge.discoverable = true;
            console.log(`🎯 Challenge discovered: ${challengeId}`);
            
            this.emit('challenge_discovered', {
                challengeId,
                challenge: hiddenChallenge.challenge,
                position: hiddenChallenge.position
            });
            
            return true;
        }
        
        return false;
    }
    
    // Generate authentication patterns for embedding
    generateAuthenticationPattern(authData) {
        console.log(`🔑 Generating Authentication Pattern`);
        
        const pattern = {
            type: 'authentication',
            data: authData,
            visual: {
                primary: this.hashToColor(authData.hash, 'primary'),
                secondary: this.hashToColor(authData.hash, 'secondary'),
                geometry: this.hashToGeometry(authData.hash),
                frequency: this.hashToFrequency(authData.hash)
            },
            security: {
                layers: 3,
                encryption: 'AES-256',
                steganography: ['lsb', 'pattern', 'frequency'],
                obfuscation: true
            }
        };
        
        return pattern;
    }
    
    // Utility Functions
    stringToBinary(str) {
        return str.split('').map(char => 
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join('');
    }
    
    binaryToString(binary) {
        const bytes = binary.match(/.{8}/g) || [];
        return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
    }
    
    encryptMessage(message, key) {
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encrypted = cipher.update(message, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    decryptMessage(encrypted, key) {
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    calculateChecksum(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }
    
    splitMessage(message, parts) {
        const chunkSize = Math.ceil(message.length / parts);
        const chunks = [];
        
        for (let i = 0; i < parts; i++) {
            const start = i * chunkSize;
            const end = start + chunkSize;
            chunks.push(message.slice(start, end));
        }
        
        return chunks;
    }
    
    hashToColor(hash, variant = 'primary') {
        const hashBytes = Buffer.from(hash, 'hex');
        const offset = variant === 'primary' ? 0 : 3;
        
        const r = hashBytes[offset % hashBytes.length];
        const g = hashBytes[(offset + 1) % hashBytes.length];
        const b = hashBytes[(offset + 2) % hashBytes.length];
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    hashToGeometry(hash) {
        const hashInt = parseInt(hash.substring(0, 8), 16);
        const shapes = ['circle', 'square', 'triangle', 'hexagon', 'diamond'];
        return shapes[hashInt % shapes.length];
    }
    
    hashToFrequency(hash) {
        const hashInt = parseInt(hash.substring(8, 16), 16);
        return (hashInt % 1000) / 1000; // 0-1 range
    }
    
    // Pattern generators
    generateFibonacciPattern() {
        const pattern = [];
        const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
        
        for (let i = 0; i < 100; i++) {
            const angle = i * phi * 2 * Math.PI;
            const radius = i * 0.02;
            
            pattern.push({
                x: 0.5 + radius * Math.cos(angle),
                y: 0.5 + radius * Math.sin(angle),
                index: i
            });
        }
        
        return pattern;
    }
    
    generateMandelbrotPattern() {
        const pattern = [];
        const iterations = 50;
        
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const cx = (x - 25) / 25 * 2;
                const cy = (y - 25) / 25 * 2;
                
                let zx = 0, zy = 0;
                let i = 0;
                
                while (zx * zx + zy * zy < 4 && i < iterations) {
                    const temp = zx * zx - zy * zy + cx;
                    zy = 2 * zx * zy + cy;
                    zx = temp;
                    i++;
                }
                
                if (i < iterations) {
                    pattern.push({
                        x: x / 50,
                        y: y / 50,
                        iterations: i
                    });
                }
            }
        }
        
        return pattern;
    }
    
    generateCellularPattern() {
        const pattern = [];
        const size = 20;
        const grid = Array(size).fill().map(() => Array(size).fill(false));
        
        // Seed random cells
        for (let i = 0; i < size * size * 0.45; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            grid[x][y] = true;
        }
        
        // Apply cellular automata rules
        for (let generation = 0; generation < 5; generation++) {
            const newGrid = grid.map(row => [...row]);
            
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const neighbors = this.countNeighbors(grid, x, y);
                    
                    if (grid[x][y]) {
                        newGrid[x][y] = neighbors >= 4;
                    } else {
                        newGrid[x][y] = neighbors >= 5;
                    }
                }
            }
            
            grid.splice(0, grid.length, ...newGrid);
        }
        
        // Convert to pattern points
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                if (grid[x][y]) {
                    pattern.push({
                        x: x / size,
                        y: y / size,
                        generation: 5
                    });
                }
            }
        }
        
        return pattern;
    }
    
    generateNeuralPattern() {
        const pattern = [];
        const nodes = 30;
        const connections = [];
        
        // Generate nodes
        for (let i = 0; i < nodes; i++) {
            const node = {
                x: Math.random(),
                y: Math.random(),
                id: i,
                connections: []
            };
            
            pattern.push(node);
        }
        
        // Create connections based on distance
        for (let i = 0; i < nodes; i++) {
            for (let j = i + 1; j < nodes; j++) {
                const dx = pattern[i].x - pattern[j].x;
                const dy = pattern[i].y - pattern[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 0.3) {
                    pattern[i].connections.push(j);
                    pattern[j].connections.push(i);
                }
            }
        }
        
        return pattern;
    }
    
    generateQuantumPattern() {
        const pattern = [];
        const particles = 25;
        
        for (let i = 0; i < particles; i++) {
            // Quantum superposition - multiple probable positions
            const positions = [];
            for (let p = 0; p < 3; p++) {
                positions.push({
                    x: Math.random(),
                    y: Math.random(),
                    probability: Math.random()
                });
            }
            
            pattern.push({
                id: i,
                positions,
                entangled: i % 2 === 0 ? i + 1 : i - 1, // Entanglement pairs
                spin: Math.random() > 0.5 ? 'up' : 'down'
            });
        }
        
        return pattern;
    }
    
    countNeighbors(grid, x, y) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < grid.length && ny >= 0 && ny < grid[0].length) {
                    if (grid[nx][ny]) count++;
                }
            }
        }
        return count;
    }
    
    createChallengePattern(challenge) {
        const elements = [];
        const hash = crypto.createHash('md5').update(JSON.stringify(challenge)).digest('hex');
        
        // Generate pattern based on challenge type
        switch (challenge.type) {
            case 'behavioral_analysis':
                elements.push(...this.createBehavioralPattern(hash));
                break;
            case 'cognitive_challenge':
                elements.push(...this.createCognitivePattern(hash));
                break;
            case 'game_authentication':
                elements.push(...this.createGamePattern(hash));
                break;
            default:
                elements.push(...this.createGenericPattern(hash));
        }
        
        // Calculate centroid
        const centroid = elements.reduce((acc, el) => {
            acc.x += el.x || 0;
            acc.y += el.y || 0;
            return acc;
        }, { x: 0, y: 0 });
        
        centroid.x /= elements.length;
        centroid.y /= elements.length;
        
        return { elements, centroid };
    }
    
    createBehavioralPattern(hash) {
        // Erratic, human-like patterns
        return [
            { type: 'circle', x: 100, y: 150, size: 5, color: '#ff4444' },
            { type: 'circle', x: 110, y: 145, size: 3, color: '#ff6666' },
            { type: 'line', x1: 100, y1: 150, x2: 110, y2: 145, color: '#ff4444' }
        ];
    }
    
    createCognitivePattern(hash) {
        // Geometric, logical patterns
        return [
            { type: 'rectangle', x: 200, y: 200, width: 10, height: 10, color: '#4444ff' },
            { type: 'rectangle', x: 215, y: 200, width: 10, height: 10, color: '#6666ff' },
            { type: 'rectangle', x: 230, y: 200, width: 10, height: 10, color: '#8888ff' }
        ];
    }
    
    createGamePattern(hash) {
        // Playful, dynamic patterns
        return [
            { type: 'circle', x: 300, y: 100, size: 8, color: '#44ff44' },
            { type: 'circle', x: 308, y: 108, size: 6, color: '#66ff66' },
            { type: 'circle', x: 314, y: 118, size: 4, color: '#88ff88' }
        ];
    }
    
    createGenericPattern(hash) {
        // Basic pattern for unknown types
        return [
            { type: 'circle', x: 50, y: 50, size: 5, color: '#888888' }
        ];
    }
    
    // DCT operations for frequency domain encoding
    generateDCTMatrix(size) {
        const matrix = [];
        for (let i = 0; i < size; i++) {
            matrix[i] = [];
            for (let j = 0; j < size; j++) {
                if (i === 0) {
                    matrix[i][j] = Math.sqrt(1 / size);
                } else {
                    matrix[i][j] = Math.sqrt(2 / size) * Math.cos((Math.PI * i * (2 * j + 1)) / (2 * size));
                }
            }
        }
        return matrix;
    }
    
    applyDCT(block) {
        const size = block.length;
        const result = Array(size).fill().map(() => Array(size).fill(0));
        
        for (let u = 0; u < size; u++) {
            for (let v = 0; v < size; v++) {
                let sum = 0;
                for (let x = 0; x < size; x++) {
                    for (let y = 0; y < size; y++) {
                        sum += block[x][y] * this.dctMatrix[u][x] * this.dctMatrix[v][y];
                    }
                }
                result[u][v] = sum;
            }
        }
        
        return result;
    }
    
    applyIDCT(dctBlock) {
        const size = dctBlock.length;
        const result = Array(size).fill().map(() => Array(size).fill(0));
        
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                let sum = 0;
                for (let u = 0; u < size; u++) {
                    for (let v = 0; v < size; v++) {
                        sum += dctBlock[u][v] * this.dctMatrix[u][x] * this.dctMatrix[v][y];
                    }
                }
                result[x][y] = Math.round(Math.max(0, Math.min(255, sum)));
            }
        }
        
        return result;
    }
    
    extractBlock(imageData, startX, startY, blockSize) {
        const block = Array(blockSize).fill().map(() => Array(blockSize).fill(0));
        
        for (let y = 0; y < blockSize; y++) {
            for (let x = 0; x < blockSize; x++) {
                const pixelIndex = ((startY + y) * imageData.width + (startX + x)) * 4;
                // Use luminance (grayscale)
                block[y][x] = 0.299 * imageData.data[pixelIndex] + 
                             0.587 * imageData.data[pixelIndex + 1] + 
                             0.114 * imageData.data[pixelIndex + 2];
            }
        }
        
        return block;
    }
    
    insertBlock(imageData, block, startX, startY, blockSize) {
        for (let y = 0; y < blockSize; y++) {
            for (let x = 0; x < blockSize; x++) {
                const pixelIndex = ((startY + y) * imageData.width + (startX + x)) * 4;
                const value = Math.round(Math.max(0, Math.min(255, block[y][x])));
                
                // Update RGB channels while preserving alpha
                imageData.data[pixelIndex] = value;     // R
                imageData.data[pixelIndex + 1] = value; // G
                imageData.data[pixelIndex + 2] = value; // B
                // Alpha channel remains unchanged
            }
        }
    }
    
    // Analysis and reporting
    analyzeEncodingCapacity(width, height) {
        const totalPixels = width * height;
        const totalBits = totalPixels * 4 * 8; // RGBA * 8 bits
        
        return {
            imageSize: `${width}x${height}`,
            totalPixels,
            lsb: {
                capacity: `${totalPixels} bits (${Math.floor(totalPixels / 8)} characters)`,
                method: 'Least Significant Bit in each color channel'
            },
            pattern: {
                capacity: `${Math.floor(totalPixels / 10)} bits (geometric pattern spacing)`,
                method: 'Position-based encoding in visual patterns'
            },
            frequency: {
                capacity: `${Math.floor(totalPixels / 64)} bits (8x8 DCT blocks)`,
                method: 'Frequency domain coefficient modification'
            },
            multiLayer: {
                capacity: `${Math.floor(totalPixels * 1.5)} bits (combined methods)`,
                method: 'Layered encoding across multiple techniques'
            }
        };
    }
    
    getSystemStatus() {
        return {
            systemId: this.systemId,
            encodingMethods: Object.keys(this.encodingMethods).length,
            patternLibraries: Object.keys(this.patternLibrary).length,
            colorPalettes: Object.keys(this.colorPalettes).length,
            activeCanvases: this.canvases.size,
            encodedData: this.encodedData.size,
            hiddenChallenges: this.hiddenChallenges.size,
            discoveredChallenges: Array.from(this.hiddenChallenges.values()).filter(c => c.discoverable).length
        };
    }
}

// Export for use in other modules
module.exports = SteganographyBitmapEncoder;

// Demo if run directly
if (require.main === module) {
    console.log('🎨 Steganography Bitmap Encoder Demo\n');
    
    const encoder = new SteganographyBitmapEncoder();
    
    encoder.on('system_initialized', () => {
        console.log('📊 CAPACITY ANALYSIS:');
        const capacity = encoder.analyzeEncodingCapacity(800, 600);
        console.log(`   Image Size: ${capacity.imageSize}`);
        console.log(`   LSB Capacity: ${capacity.lsb.capacity}`);
        console.log(`   Pattern Capacity: ${capacity.pattern.capacity}`);
        console.log(`   Frequency Capacity: ${capacity.frequency.capacity}`);
        console.log(`   Multi-Layer Capacity: ${capacity.multiLayer.capacity}`);
        
        console.log('\n🔐 DEMO: Authentication Pattern Generation');
        const authData = {
            hash: 'a1b2c3d4e5f6',
            type: 'behavioral_analysis',
            timestamp: Date.now()
        };
        
        const pattern = encoder.generateAuthenticationPattern(authData);
        console.log(`   Pattern Type: ${pattern.type}`);
        console.log(`   Primary Color: ${pattern.visual.primary}`);
        console.log(`   Geometry: ${pattern.visual.geometry}`);
        console.log(`   Security Layers: ${pattern.security.layers}`);
        
        console.log('\n📈 SYSTEM STATUS:');
        const status = encoder.getSystemStatus();
        Object.entries(status).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
    });
    
    encoder.on('challenge_discovered', (data) => {
        console.log(`\n🎯 CHALLENGE DISCOVERED: ${data.challengeId}`);
        console.log(`   Type: ${data.challenge.type}`);
        console.log(`   Position: (${data.position.x}, ${data.position.y})`);
    });
}
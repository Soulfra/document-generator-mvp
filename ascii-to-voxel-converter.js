#!/usr/bin/env node

/**
 * 🎯 ASCII-TO-VOXEL DEPTH MAPPING CONVERTER
 * Converts 2D ASCII pixel art to 3D voxel height data
 * Maps character intensity to voxel depth/height
 */

class AsciiToVoxelConverter {
    constructor() {
        console.log('🎯 ASCII-to-Voxel Converter initializing...');
        
        // ASCII character intensity mapping to voxel height
        this.intensityMap = {
            ' ': 0,  // Empty space - no voxel
            '.': 1,  // Very light - height 1
            ':': 2,  // Light - height 2
            ';': 3,  // Medium-light - height 3
            'o': 4,  // Medium - height 4
            '8': 5,  // Medium-dark - height 5
            '#': 6,  // Dark - height 6
            '@': 7   // Darkest - height 7
        };
        
        // Color mapping based on intensity
        this.colorMap = {
            0: null,           // No color (transparent)
            1: '#e8e8e8',     // Very light gray
            2: '#c0c0c0',     // Light gray
            3: '#a0a0a0',     // Medium-light gray
            4: '#808080',     // Medium gray
            5: '#606060',     // Medium-dark gray
            6: '#404040',     // Dark gray
            7: '#202020'      // Very dark gray
        };
        
        console.log('✅ Intensity mapping loaded (8 levels)');
        console.log('✅ Color mapping loaded');
    }
    
    /**
     * Convert ASCII pixel art to 3D voxel data
     * @param {string} asciiArt - ASCII art string with newlines
     * @param {Object} options - Conversion options
     * @returns {Object} Voxel data ready for 3D world
     */
    convertToVoxels(asciiArt, options = {}) {
        const {
            scaleX = 1,
            scaleY = 1,
            scaleZ = 1,
            offsetX = 0,
            offsetY = 0,
            offsetZ = 0,
            maxHeight = 16,
            colorMode = 'grayscale'
        } = options;
        
        console.log('🎨 Converting ASCII art to voxel data...');
        
        const lines = asciiArt.split('\n');
        const voxels = [];
        const metadata = {
            width: 0,
            height: lines.length,
            depth: maxHeight,
            totalVoxels: 0
        };
        
        lines.forEach((line, y) => {
            if (line.length > metadata.width) {
                metadata.width = line.length;
            }
            
            Array.from(line).forEach((char, x) => {
                const intensity = this.intensityMap[char];
                
                // Skip empty space
                if (intensity === undefined || intensity === 0) return;
                
                // Calculate height based on intensity
                const height = Math.floor((intensity / 7) * maxHeight);
                
                // Create voxels from bottom to calculated height
                for (let z = 0; z <= height; z++) {
                    const voxel = {
                        x: x * scaleX + offsetX,
                        y: y * scaleY + offsetY, 
                        z: z * scaleZ + offsetZ,
                        height: z,
                        intensity,
                        char,
                        color: this.getVoxelColor(intensity, z, height, colorMode)
                    };
                    
                    voxels.push(voxel);
                    metadata.totalVoxels++;
                }
            });
        });
        
        console.log(`✅ Generated ${metadata.totalVoxels} voxels from ${metadata.width}x${metadata.height} ASCII art`);
        
        return {
            voxels,
            metadata,
            boundingBox: {
                minX: offsetX,
                maxX: metadata.width * scaleX + offsetX,
                minY: offsetY,
                maxY: metadata.height * scaleY + offsetY,
                minZ: offsetZ,
                maxZ: maxHeight * scaleZ + offsetZ
            }
        };
    }
    
    /**
     * Get color for voxel based on intensity and height
     */
    getVoxelColor(intensity, currentHeight, maxHeight, colorMode) {
        switch (colorMode) {
            case 'grayscale':
                return this.colorMap[intensity];
                
            case 'height_gradient':
                // Color based on height position
                const heightRatio = currentHeight / maxHeight;
                const hue = Math.floor(heightRatio * 360);
                return `hsl(${hue}, 70%, 50%)`;
                
            case 'intensity_hue':
                // Color based on ASCII intensity
                const intensityHue = Math.floor((intensity / 7) * 240); // Blue to red
                return `hsl(${intensityHue}, 80%, 60%)`;
                
            case 'face_mapping':
                // Map to skin/hair colors for faces
                if (intensity <= 2) return '#fdbcb4'; // Light skin
                if (intensity <= 4) return '#e1a95f'; // Medium skin
                if (intensity <= 6) return '#8b4513'; // Dark features
                return '#2c1810'; // Hair/dark features
                
            case 'authority_mapping':
                // Map intensity to Kingdom Authority colors
                if (intensity === 0) return null;      // Transparent
                if (intensity === 1) return '#8B0000'; // EXILE - Dark Red
                if (intensity === 2) return '#FF0000'; // PEASANT - Red
                if (intensity === 3) return '#FFA500'; // CITIZEN - Orange
                if (intensity === 4) return '#FFFF00'; // MERCHANT - Yellow
                if (intensity === 5) return '#00FF00'; // KNIGHT - Green
                if (intensity === 6) return '#0000FF'; // LORD - Blue
                return '#FFD700'; // KING - Gold
                
            default:
                return this.colorMap[intensity];
        }
    }
    
    /**
     * Convert voxel data to format compatible with hex world system
     */
    toHexWorldFormat(voxelData, characterInfo = {}) {
        const {
            name = 'Pixel Hero',
            position = { q: 0, r: 0, s: 0 },
            stats = { level: 1, health: 100, energy: 100, coins: 0 }
        } = characterInfo;
        
        return {
            id: 'voxel_' + Date.now(),
            name,
            voxelData: voxelData.voxels,
            position,
            stats,
            abilities: ['scan_qr', 'trade', 'explore', 'pixel_morph'],
            metadata: voxelData.metadata,
            boundingBox: voxelData.boundingBox,
            created: Date.now(),
            type: 'pixel_character',
            isActive: true
        };
    }
    
    /**
     * Create bridge between pixel art and hex world
     */
    async bridgeToHexWorld(asciiArt, characterInfo, hexWorldUrl = 'http://localhost:8300') {
        console.log('🌉 Bridging ASCII art to hex world...');
        
        // Convert to voxels
        const voxelData = this.convertToVoxels(asciiArt, {
            colorMode: 'face_mapping',
            scaleX: 0.5,
            scaleY: 0.5,
            scaleZ: 0.3
        });
        
        // Format for hex world
        const hexCharacter = this.toHexWorldFormat(voxelData, characterInfo);
        
        // Send to hex world system
        try {
            // Use global fetch if available (Node 18+), otherwise dynamic import
            const fetchFn = globalThis.fetch || (await import('node-fetch')).default;
            const response = await fetchFn(`${hexWorldUrl}/api/add-voxel-character`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hexCharacter)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Character bridged to hex world: ${result.character?.id}`);
                return result;
            } else {
                console.error('Failed to bridge to hex world:', response.status);
                return null;
            }
            
        } catch (error) {
            console.error('Bridge connection failed:', error.message);
            return null;
        }
    }
    
    /**
     * Analyze ASCII art for better voxel generation
     */
    analyzeAsciiStructure(asciiArt) {
        const lines = asciiArt.split('\n');
        const analysis = {
            dimensions: { width: 0, height: lines.length },
            characterDistribution: {},
            intensityMap: new Map(),
            features: {
                hasSymmetry: false,
                hasFace: false,
                hasBody: false
            }
        };
        
        lines.forEach((line, y) => {
            if (line.length > analysis.dimensions.width) {
                analysis.dimensions.width = line.length;
            }
            
            Array.from(line).forEach((char, x) => {
                // Count character usage
                analysis.characterDistribution[char] = (analysis.characterDistribution[char] || 0) + 1;
                
                // Map positions by intensity
                const intensity = this.intensityMap[char] || 0;
                if (!analysis.intensityMap.has(intensity)) {
                    analysis.intensityMap.set(intensity, []);
                }
                analysis.intensityMap.get(intensity).push({ x, y, char });
            });
        });
        
        // Detect features
        analysis.features.hasFace = this.detectFaceFeatures(lines);
        analysis.features.hasBody = this.detectBodyFeatures(lines);
        analysis.features.hasSymmetry = this.detectSymmetry(lines);
        
        return analysis;
    }
    
    detectFaceFeatures(lines) {
        // Look for eye patterns (typically in upper portion)
        const upperHalf = lines.slice(0, Math.floor(lines.length / 2));
        const eyePatterns = /[o8#@].*[o8#@]/; // Two dark spots suggesting eyes
        return upperHalf.some(line => eyePatterns.test(line));
    }
    
    detectBodyFeatures(lines) {
        // Look for body structure (wider in middle)
        const middle = Math.floor(lines.length / 2);
        const bodyArea = lines.slice(middle - 2, middle + 2);
        return bodyArea.some(line => line.length > lines[0]?.length * 0.8);
    }
    
    detectSymmetry(lines) {
        // Check for left-right symmetry
        return lines.some(line => {
            const mid = Math.floor(line.length / 2);
            const left = line.slice(0, mid);
            const right = line.slice(mid).split('').reverse().join('');
            return left === right;
        });
    }
    
    /**
     * Demo the conversion process
     */
    demo() {
        console.log('\n🎨 ASCII-TO-VOXEL CONVERTER DEMO');
        console.log('================================');
        
        const sampleAscii = `
        ...
       .:::.
      .;ooo;.
     .;8###8;.
      .;ooo;.
       .:::.
        ...
        `;
        
        console.log('📥 Input ASCII Art:');
        console.log(sampleAscii);
        
        const voxelData = this.convertToVoxels(sampleAscii.trim());
        
        console.log('\n📦 Voxel Output:');
        console.log(`   Total Voxels: ${voxelData.metadata.totalVoxels}`);
        console.log(`   Dimensions: ${voxelData.metadata.width}x${voxelData.metadata.height}x${voxelData.metadata.depth}`);
        console.log(`   Bounding Box: ${JSON.stringify(voxelData.boundingBox)}`);
        
        console.log('\n🎯 Sample Voxels:');
        voxelData.voxels.slice(0, 5).forEach(voxel => {
            console.log(`   (${voxel.x},${voxel.y},${voxel.z}) height:${voxel.height} char:'${voxel.char}' color:${voxel.color}`);
        });
        
        return voxelData;
    }
}

module.exports = AsciiToVoxelConverter;

// Demo mode if run directly
if (require.main === module) {
    const converter = new AsciiToVoxelConverter();
    converter.demo();
}
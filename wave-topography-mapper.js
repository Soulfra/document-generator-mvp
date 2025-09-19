/**
 * 🌊 WAVE TOPOGRAPHY MAPPER
 * 
 * Maps sound frequencies (from piano keys) to topographic heights
 * Creates wave-based terrain where low frequencies = valleys, high = mountains
 * Integrates with the spherical world projector for complete terrain mapping
 */

class WaveTopographyMapper {
    constructor(pianoSystem = null) {
        this.piano = pianoSystem;
        
        // Complete frequency to height mapping (88 piano keys)
        this.frequencyToHeight = this.generateFrequencyHeightMap();
        
        // Wave characteristics for terrain generation
        this.waveParams = {
            // Primary wave (ocean-like swells)
            primary: {
                amplitude: 500,      // meters
                wavelength: 50000,   // meters (50km)
                frequency: 0.02,     // Hz
                phase: 0,
                direction: 0         // degrees
            },
            
            // Secondary wave (regional variations)
            secondary: {
                amplitude: 200,
                wavelength: 10000,   // 10km
                frequency: 0.1,
                phase: Math.PI / 4,
                direction: 45
            },
            
            // Tertiary wave (local features)
            tertiary: {
                amplitude: 50,
                wavelength: 1000,    // 1km
                frequency: 1,
                phase: Math.PI / 2,
                direction: 90
            },
            
            // Noise wave (surface detail)
            noise: {
                amplitude: 10,
                octaves: 4,
                persistence: 0.5,
                lacunarity: 2
            }
        };
        
        // Sound propagation parameters
        this.soundPropagation = {
            speedOfSound: 343,      // m/s in air at 20°C
            damping: 0.95,          // Energy loss per km
            reverberation: 0.3,     // Echo factor
            harmonics: 3            // Number of harmonic frequencies
        };
        
        // Crest detection parameters
        this.crestParams = {
            minHeight: 100,         // Minimum height to be considered a crest
            minProminence: 50,      // Minimum prominence above surroundings
            smoothingRadius: 1000   // Radius for smoothing in meters
        };
        
        console.log('🌊 Wave Topography Mapper initialized');
    }
    
    /**
     * Generate complete frequency to height map for 88 piano keys
     */
    generateFrequencyHeightMap() {
        const map = new Map();
        const A0_FREQUENCY = 27.5; // Lowest piano key
        
        // Generate all 88 keys
        for (let i = 0; i < 88; i++) {
            // Calculate frequency using equal temperament
            const frequency = A0_FREQUENCY * Math.pow(2, i / 12);
            
            // Map frequency to height using logarithmic scale
            // Low frequencies = deep valleys, high frequencies = tall peaks
            const height = this.frequencyToHeightFormula(frequency);
            
            // Determine note name
            const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
            const noteIndex = i % 12;
            const octave = Math.floor((i + 9) / 12); // A0 is in octave 0
            const noteName = noteNames[noteIndex] + octave;
            
            map.set(noteName, {
                frequency: frequency,
                height: height,
                keyNumber: i + 1 // Piano keys are numbered 1-88
            });
        }
        
        return map;
    }
    
    /**
     * Convert frequency to height using logarithmic mapping
     */
    frequencyToHeightFormula(frequency) {
        // Sea level at middle C (261.63 Hz)
        const middleC = 261.63;
        const seaLevel = 0;
        
        // Use logarithmic scale for natural terrain feel
        // Each octave up = ~1000m increase in height
        const octavesFromMiddleC = Math.log2(frequency / middleC);
        const height = seaLevel + (octavesFromMiddleC * 1000);
        
        // Clamp to reasonable Earth-like values
        return this.clamp(height, -11000, 9000); // Mariana Trench to Everest
    }
    
    /**
     * Get height at a specific point with wave modulation
     */
    getHeightAtPoint(x, y, time = 0) {
        // Base height from nearest frequency source
        const baseFrequency = this.getFrequencyAtPoint(x, y);
        const baseHeight = this.frequencyToHeightFormula(baseFrequency);
        
        // Apply multiple wave layers
        let totalHeight = baseHeight;
        
        // Primary wave (large swells)
        totalHeight += this.calculateWaveHeight(x, y, time, this.waveParams.primary);
        
        // Secondary wave (regional)
        totalHeight += this.calculateWaveHeight(x, y, time * 2, this.waveParams.secondary);
        
        // Tertiary wave (local)
        totalHeight += this.calculateWaveHeight(x, y, time * 4, this.waveParams.tertiary);
        
        // Add Perlin noise for natural terrain
        totalHeight += this.perlinNoise(x, y) * this.waveParams.noise.amplitude;
        
        return totalHeight;
    }
    
    /**
     * Calculate wave height at a point
     */
    calculateWaveHeight(x, y, time, waveParams) {
        // Convert direction to radians
        const dirRad = waveParams.direction * Math.PI / 180;
        
        // Project position onto wave direction
        const wavePosition = x * Math.cos(dirRad) + y * Math.sin(dirRad);
        
        // Calculate wave phase
        const k = 2 * Math.PI / waveParams.wavelength; // Wave number
        const omega = 2 * Math.PI * waveParams.frequency; // Angular frequency
        const phase = k * wavePosition - omega * time + waveParams.phase;
        
        // Calculate wave height with damping
        const distance = Math.sqrt(x * x + y * y);
        const damping = Math.pow(this.soundPropagation.damping, distance / 1000);
        
        return waveParams.amplitude * Math.sin(phase) * damping;
    }
    
    /**
     * Get frequency at a point based on sound sources
     */
    getFrequencyAtPoint(x, y) {
        // For now, create a frequency field based on position
        // In full implementation, this would consider actual sound sources
        
        // Create interesting frequency patterns
        const centerFreq = 440; // A4
        const freqVariation = 200;
        
        // Radial frequency gradient
        const distance = Math.sqrt(x * x + y * y);
        const radialFreq = centerFreq + Math.sin(distance / 10000) * freqVariation;
        
        // Angular frequency variation
        const angle = Math.atan2(y, x);
        const angularFreq = Math.sin(angle * 3) * 100;
        
        return radialFreq + angularFreq;
    }
    
    /**
     * Apply wave topography to a flat map
     */
    applyWaveTopography(flatMap, time = 0) {
        const topographicMap = {
            width: flatMap.width,
            height: flatMap.height,
            data: new Float32Array(flatMap.width * flatMap.height),
            metadata: {
                minHeight: Infinity,
                maxHeight: -Infinity,
                avgHeight: 0,
                crests: [],
                valleys: []
            }
        };
        
        // Generate height data for each point
        for (let y = 0; y < flatMap.height; y++) {
            for (let x = 0; x < flatMap.width; x++) {
                const worldX = (x - flatMap.width / 2) * 100; // Scale to world coordinates
                const worldY = (y - flatMap.height / 2) * 100;
                
                const height = this.getHeightAtPoint(worldX, worldY, time);
                const index = y * flatMap.width + x;
                
                topographicMap.data[index] = height;
                
                // Update metadata
                topographicMap.metadata.minHeight = Math.min(topographicMap.metadata.minHeight, height);
                topographicMap.metadata.maxHeight = Math.max(topographicMap.metadata.maxHeight, height);
                topographicMap.metadata.avgHeight += height;
            }
        }
        
        topographicMap.metadata.avgHeight /= (flatMap.width * flatMap.height);
        
        // Detect crests and valleys
        this.detectTopographicFeatures(topographicMap);
        
        return topographicMap;
    }
    
    /**
     * Detect crests and valleys in the topographic map
     */
    detectTopographicFeatures(topographicMap) {
        const { width, height, data } = topographicMap;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = y * width + x;
                const currentHeight = data[index];
                
                // Check if this is a local maximum (crest)
                if (this.isLocalMaximum(data, width, height, x, y)) {
                    if (currentHeight > this.crestParams.minHeight) {
                        topographicMap.metadata.crests.push({
                            x: x,
                            y: y,
                            height: currentHeight,
                            prominence: this.calculateProminence(data, width, height, x, y),
                            ceilingHeight: this.calculateCeilingHeight(currentHeight)
                        });
                    }
                }
                
                // Check if this is a local minimum (valley)
                if (this.isLocalMinimum(data, width, height, x, y)) {
                    topographicMap.metadata.valleys.push({
                        x: x,
                        y: y,
                        depth: currentHeight,
                        watershed: this.calculateWatershed(data, width, height, x, y)
                    });
                }
            }
        }
    }
    
    /**
     * Check if a point is a local maximum
     */
    isLocalMaximum(data, width, height, x, y) {
        const index = y * width + x;
        const current = data[index];
        
        // Check all 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    if (data[ny * width + nx] > current) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Check if a point is a local minimum
     */
    isLocalMinimum(data, width, height, x, y) {
        const index = y * width + x;
        const current = data[index];
        
        // Check all 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    if (data[ny * width + nx] < current) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Calculate prominence of a peak
     */
    calculateProminence(data, width, height, peakX, peakY) {
        const peakHeight = data[peakY * width + peakX];
        let minSaddleHeight = peakHeight;
        
        // Simple prominence calculation - find lowest point to higher peak
        const searchRadius = 50; // pixels
        
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const x = peakX + dx;
                const y = peakY + dy;
                
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const height = data[y * width + x];
                    if (height < minSaddleHeight) {
                        minSaddleHeight = height;
                    }
                }
            }
        }
        
        return peakHeight - minSaddleHeight;
    }
    
    /**
     * Calculate ceiling height above a crest
     */
    calculateCeilingHeight(crestHeight) {
        // Ceiling height based on wave amplitude and safety factor
        // Higher crests get proportionally higher ceilings
        const baseCeiling = 500; // Base ceiling height in meters
        const scaleFactor = 0.5; // 50% of crest height added to ceiling
        
        return crestHeight + baseCeiling + (crestHeight * scaleFactor);
    }
    
    /**
     * Calculate watershed area for a valley
     */
    calculateWatershed(data, width, height, valleyX, valleyY) {
        // Simple watershed - count pixels that would drain to this valley
        const searchRadius = 20;
        let watershedArea = 0;
        
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const x = valleyX + dx;
                const y = valleyY + dy;
                
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    // Check if water would flow toward valley
                    if (this.wouldFlowToward(data, width, height, x, y, valleyX, valleyY)) {
                        watershedArea++;
                    }
                }
            }
        }
        
        return watershedArea;
    }
    
    /**
     * Check if water would flow from point A to point B
     */
    wouldFlowToward(data, width, height, fromX, fromY, toX, toY) {
        const fromHeight = data[fromY * width + fromX];
        const toHeight = data[toY * width + toX];
        
        // Water flows downhill
        return fromHeight > toHeight;
    }
    
    /**
     * Generate Perlin noise for natural terrain variation
     */
    perlinNoise(x, y) {
        // Simplified Perlin noise implementation
        const scale = 0.001;
        const octaves = this.waveParams.noise.octaves;
        const persistence = this.waveParams.noise.persistence;
        const lacunarity = this.waveParams.noise.lacunarity;
        
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.noise2D(x * scale * frequency, y * scale * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        return total / maxValue;
    }
    
    /**
     * Simple 2D noise function
     */
    noise2D(x, y) {
        // Pseudo-random based on coordinates
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
        return (n - Math.floor(n)) * 2 - 1;
    }
    
    /**
     * Utility function to clamp values
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Convert height to frequency (inverse mapping)
     */
    heightToFrequency(height) {
        // Inverse of frequencyToHeightFormula
        const middleC = 261.63;
        const seaLevel = 0;
        const octavesFromMiddleC = (height - seaLevel) / 1000;
        
        return middleC * Math.pow(2, octavesFromMiddleC);
    }
    
    /**
     * Get wave state at current time
     */
    getWaveState(time) {
        return {
            primary: {
                phase: (time * this.waveParams.primary.frequency * 2 * Math.PI) % (2 * Math.PI),
                amplitude: this.waveParams.primary.amplitude
            },
            secondary: {
                phase: (time * this.waveParams.secondary.frequency * 2 * Math.PI) % (2 * Math.PI),
                amplitude: this.waveParams.secondary.amplitude
            },
            tertiary: {
                phase: (time * this.waveParams.tertiary.frequency * 2 * Math.PI) % (2 * Math.PI),
                amplitude: this.waveParams.tertiary.amplitude
            }
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaveTopographyMapper;
}
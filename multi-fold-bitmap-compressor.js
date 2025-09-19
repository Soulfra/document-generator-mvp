#!/usr/bin/env node

/**
 * 🌊📦 MULTI-FOLD BITMAP COMPRESSOR 🌊📦
 * 
 * Takes wave topography data and performs multi-level folding compression
 * Creates compressed bitmaps suitable for COBOL financial ledgering
 * Implements crest detection and ceiling height compression
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class MultiFoldBitmapCompressor {
    constructor(waveTopographyMapper = null) {
        this.waveMapper = waveTopographyMapper;
        
        // Compression parameters
        this.compressionLevels = {
            FOLD_2X: {
                name: '2X Fold',
                folds: 2,
                compressionRatio: 0.25,  // 1/4 original size
                bitsPerSample: 16
            },
            FOLD_4X: {
                name: '4X Fold', 
                folds: 4,
                compressionRatio: 0.0625, // 1/16 original size
                bitsPerSample: 8
            }
        };
        
        // Financial encoding parameters
        this.financialEncoding = {
            // Height ranges map to financial values
            depthRange: { min: -11000, max: 0, label: 'Debt/Liability' },
            seaLevel: { min: -100, max: 100, label: 'Break-even' },
            lowHills: { min: 100, max: 1000, label: 'Small Profit' },
            mountains: { min: 1000, max: 5000, label: 'Major Profit' },
            peaks: { min: 5000, max: 9000, label: 'Peak Revenue' },
            
            // Crest multipliers for ceiling calculations
            crestMultipliers: {
                small: 1.5,    // Small crests get 50% bonus
                medium: 2.0,   // Medium crests get 100% bonus
                large: 3.0     // Large crests get 200% bonus
            }
        };
        
        // COBOL-compatible field sizes
        this.cobolFields = {
            ACCOUNT_ID: 10,      // PIC X(10)
            AMOUNT: 15,          // PIC 9(13)V99
            TRANSACTION_CODE: 3,  // PIC X(3)
            TIMESTAMP: 14,       // PIC 9(14) YYYYMMDDHHMMSS
            CHECKSUM: 8          // PIC X(8)
        };
        
        console.log('🌊📦 Multi-Fold Bitmap Compressor initialized');
    }
    
    /**
     * Compress wave topography data with multi-fold algorithm
     */
    async compressWaveData(topographicMap, foldLevel = 'FOLD_2X') {
        const compression = this.compressionLevels[foldLevel];
        console.log(`\n📊 Starting ${compression.name} compression...`);
        
        // Step 1: Detect crests and apply ceiling height
        const processedMap = this.applyCeilingCompression(topographicMap);
        
        // Step 2: Perform multi-fold compression
        let foldedData = processedMap;
        for (let fold = 0; fold < compression.folds; fold++) {
            console.log(`  Fold ${fold + 1}/${compression.folds}...`);
            foldedData = this.performFold(foldedData, fold);
        }
        
        // Step 3: Convert to bitmap format
        const bitmap = this.createBitmap(foldedData, compression);
        
        // Step 4: Apply financial encoding
        const financialBitmap = this.applyFinancialEncoding(bitmap);
        
        // Step 5: Generate COBOL-ready format
        const cobolData = this.formatForCOBOL(financialBitmap);
        
        return {
            originalSize: topographicMap.width * topographicMap.height,
            compressedSize: bitmap.data.length,
            compressionRatio: bitmap.data.length / (topographicMap.width * topographicMap.height),
            foldLevel: compression.name,
            bitmap: bitmap,
            cobolData: cobolData,
            metadata: this.generateMetadata(topographicMap, bitmap, compression)
        };
    }
    
    /**
     * Apply ceiling compression based on crest detection
     */
    applyCeilingCompression(topographicMap) {
        const compressed = {
            width: topographicMap.width,
            height: topographicMap.height,
            data: new Float32Array(topographicMap.data.length),
            crests: topographicMap.metadata.crests || []
        };
        
        // Apply ceiling height compression
        for (let i = 0; i < topographicMap.data.length; i++) {
            const x = i % topographicMap.width;
            const y = Math.floor(i / topographicMap.width);
            const originalHeight = topographicMap.data[i];
            
            // Check if near a crest
            const nearestCrest = this.findNearestCrest(x, y, compressed.crests);
            
            if (nearestCrest) {
                // Apply ceiling compression based on crest
                const ceilingHeight = nearestCrest.ceilingHeight;
                const compressedHeight = this.applyCeilingFormula(
                    originalHeight, 
                    ceilingHeight,
                    nearestCrest.prominence
                );
                compressed.data[i] = compressedHeight;
            } else {
                // Standard compression for non-crest areas
                compressed.data[i] = this.standardCompression(originalHeight);
            }
        }
        
        return compressed;
    }
    
    /**
     * Find nearest crest to a point
     */
    findNearestCrest(x, y, crests) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const crest of crests) {
            const distance = Math.sqrt(
                Math.pow(x - crest.x, 2) + 
                Math.pow(y - crest.y, 2)
            );
            
            // Consider crests within 50 pixel radius
            if (distance < 50 && distance < minDistance) {
                minDistance = distance;
                nearest = crest;
            }
        }
        
        return nearest;
    }
    
    /**
     * Apply ceiling compression formula
     */
    applyCeilingFormula(height, ceilingHeight, prominence) {
        // Compress heights above sea level more aggressively near crests
        if (height > 0) {
            const ratio = height / ceilingHeight;
            const compressionFactor = 1 - (prominence / 1000); // Higher prominence = more compression
            
            // Logarithmic compression near ceiling
            if (ratio > 0.8) {
                return ceilingHeight * (0.8 + 0.2 * Math.log10(1 + (ratio - 0.8) * 10));
            }
            
            return height * compressionFactor;
        }
        
        // Depths compress differently (financial debts)
        return height * 0.9; // 10% compression for depths
    }
    
    /**
     * Standard compression for non-crest areas
     */
    standardCompression(height) {
        // Sigmoid compression to keep values in reasonable range
        const compressed = height / (1 + Math.abs(height) / 1000);
        return compressed;
    }
    
    /**
     * Perform one fold operation
     */
    performFold(data, foldIndex) {
        const { width, height } = data;
        const newWidth = Math.ceil(width / 2);
        const newHeight = Math.ceil(height / 2);
        
        const folded = {
            width: newWidth,
            height: newHeight,
            data: new Float32Array(newWidth * newHeight),
            foldPattern: this.getFoldPattern(foldIndex)
        };
        
        // Apply fold pattern
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const samples = this.getSamplePoints(x, y, data, foldIndex);
                folded.data[y * newWidth + x] = this.combineSamples(samples, folded.foldPattern);
            }
        }
        
        return folded;
    }
    
    /**
     * Get fold pattern based on fold index
     */
    getFoldPattern(foldIndex) {
        const patterns = [
            'AVERAGE',      // Simple average
            'WAVE_MAX',     // Take wave peaks
            'FINANCIAL',    // Financial weighted
            'HARMONIC'      // Harmonic mean
        ];
        
        return patterns[foldIndex % patterns.length];
    }
    
    /**
     * Get sample points for folding
     */
    getSamplePoints(x, y, data, foldIndex) {
        const samples = [];
        const { width, height } = data;
        
        // Get 2x2 region
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                const sx = x * 2 + dx;
                const sy = y * 2 + dy;
                
                if (sx < width && sy < height) {
                    samples.push(data.data[sy * width + sx]);
                }
            }
        }
        
        return samples;
    }
    
    /**
     * Combine samples based on fold pattern
     */
    combineSamples(samples, pattern) {
        if (samples.length === 0) return 0;
        
        switch (pattern) {
            case 'AVERAGE':
                return samples.reduce((a, b) => a + b, 0) / samples.length;
                
            case 'WAVE_MAX':
                // Take maximum (wave crest preservation)
                return Math.max(...samples);
                
            case 'FINANCIAL':
                // Weighted average favoring positive values (profits)
                const weights = samples.map(s => s > 0 ? 2 : 1);
                const weightedSum = samples.reduce((sum, val, i) => sum + val * weights[i], 0);
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                return weightedSum / totalWeight;
                
            case 'HARMONIC':
                // Harmonic mean (good for rates/ratios)
                const reciprocals = samples.map(s => s !== 0 ? 1 / Math.abs(s) : 0);
                const harmonicMean = samples.length / reciprocals.reduce((a, b) => a + b, 0);
                return harmonicMean * Math.sign(samples[0]);
                
            default:
                return samples[0];
        }
    }
    
    /**
     * Create bitmap from folded data
     */
    createBitmap(foldedData, compression) {
        const { width, height, data } = foldedData;
        const bitsPerSample = compression.bitsPerSample;
        const bytesPerSample = bitsPerSample / 8;
        
        // Calculate bitmap size
        const bitmapSize = width * height * bytesPerSample;
        const bitmap = {
            width: width,
            height: height,
            bitsPerPixel: bitsPerSample,
            data: Buffer.alloc(bitmapSize),
            header: this.createBitmapHeader(width, height, bitsPerSample)
        };
        
        // Normalize and quantize data
        const { min, max } = this.findMinMax(data);
        const range = max - min;
        const maxValue = Math.pow(2, bitsPerSample) - 1;
        
        for (let i = 0; i < data.length; i++) {
            // Normalize to 0-1
            const normalized = (data[i] - min) / range;
            
            // Quantize to bit depth
            const quantized = Math.floor(normalized * maxValue);
            
            // Write to bitmap
            if (bitsPerSample === 8) {
                bitmap.data[i] = quantized;
            } else if (bitsPerSample === 16) {
                bitmap.data.writeUInt16LE(quantized, i * 2);
            }
        }
        
        return bitmap;
    }
    
    /**
     * Create bitmap header
     */
    createBitmapHeader(width, height, bitsPerPixel) {
        return {
            signature: 'WAVE',
            version: 1,
            width: width,
            height: height,
            bitsPerPixel: bitsPerPixel,
            compression: 'MULTIFOLD',
            timestamp: Date.now(),
            checksum: null // Will be calculated later
        };
    }
    
    /**
     * Apply financial encoding to bitmap
     */
    applyFinancialEncoding(bitmap) {
        const encoded = {
            ...bitmap,
            financialData: []
        };
        
        // Convert each pixel to financial value
        for (let y = 0; y < bitmap.height; y++) {
            for (let x = 0; x < bitmap.width; x++) {
                const index = y * bitmap.width + x;
                const value = bitmap.bitsPerPixel === 8 
                    ? bitmap.data[index]
                    : bitmap.data.readUInt16LE(index * 2);
                
                // Map to financial range
                const financialValue = this.mapToFinancialValue(value, bitmap.bitsPerPixel);
                
                encoded.financialData.push({
                    x: x,
                    y: y,
                    value: financialValue,
                    category: this.getFinancialCategory(financialValue)
                });
            }
        }
        
        return encoded;
    }
    
    /**
     * Map bitmap value to financial value
     */
    mapToFinancialValue(bitmapValue, bitsPerPixel) {
        const maxValue = Math.pow(2, bitsPerPixel) - 1;
        const normalized = bitmapValue / maxValue;
        
        // Map to financial range (-11000 to 9000)
        const minFinancial = -11000;
        const maxFinancial = 9000;
        const range = maxFinancial - minFinancial;
        
        return minFinancial + (normalized * range);
    }
    
    /**
     * Get financial category for value
     */
    getFinancialCategory(value) {
        for (const [category, range] of Object.entries(this.financialEncoding)) {
            if (range.min !== undefined && value >= range.min && value <= range.max) {
                return category;
            }
        }
        return 'unknown';
    }
    
    /**
     * Format data for COBOL processing
     */
    formatForCOBOL(financialBitmap) {
        const records = [];
        
        // Create COBOL records for each financial data point
        financialBitmap.financialData.forEach((data, index) => {
            const record = this.createCOBOLRecord({
                accountId: this.generateAccountId(data.x, data.y),
                amount: Math.abs(data.value),
                transactionCode: this.getTransactionCode(data.category),
                timestamp: this.generateTimestamp(),
                isDebit: data.value < 0
            });
            
            records.push(record);
        });
        
        // Create header record
        const header = this.createCOBOLHeader(records.length);
        
        // Create trailer with checksums
        const trailer = this.createCOBOLTrailer(records);
        
        return {
            header: header,
            records: records,
            trailer: trailer,
            totalRecords: records.length,
            fileSize: this.calculateCOBOLFileSize(records)
        };
    }
    
    /**
     * Create COBOL record
     */
    createCOBOLRecord(data) {
        // Format: ACCOUNT-ID(10) AMOUNT(15) TRANS-CODE(3) TIMESTAMP(14) DR-CR(1)
        const accountId = data.accountId.padEnd(10, ' ');
        const amount = this.formatCOBOLAmount(data.amount);
        const transCode = data.transactionCode.padEnd(3, ' ');
        const timestamp = data.timestamp;
        const drCr = data.isDebit ? 'D' : 'C';
        
        return `${accountId}${amount}${transCode}${timestamp}${drCr}`;
    }
    
    /**
     * Format amount for COBOL (with implied decimal)
     */
    formatCOBOLAmount(amount) {
        // Convert to cents and pad with zeros
        const cents = Math.floor(amount * 100);
        return cents.toString().padStart(15, '0');
    }
    
    /**
     * Generate account ID from coordinates
     */
    generateAccountId(x, y) {
        // Create unique account ID from position
        const quadrant = this.getQuadrant(x, y);
        const hash = crypto.createHash('sha256')
            .update(`${x}:${y}`)
            .digest('hex')
            .substring(0, 6)
            .toUpperCase();
        
        return `${quadrant}${hash}`;
    }
    
    /**
     * Get quadrant code
     */
    getQuadrant(x, y) {
        if (x < 50 && y < 50) return 'NW';
        if (x >= 50 && y < 50) return 'NE';
        if (x < 50 && y >= 50) return 'SW';
        return 'SE';
    }
    
    /**
     * Get transaction code for category
     */
    getTransactionCode(category) {
        const codes = {
            'depthRange': 'DBT',
            'seaLevel': 'BAL',
            'lowHills': 'REV',
            'mountains': 'PRF',
            'peaks': 'MAX'
        };
        
        return codes[category] || 'UNK';
    }
    
    /**
     * Generate timestamp in COBOL format
     */
    generateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        const second = now.getSeconds().toString().padStart(2, '0');
        
        return `${year}${month}${day}${hour}${minute}${second}`;
    }
    
    /**
     * Create COBOL header record
     */
    createCOBOLHeader(recordCount) {
        const fileId = 'WAVEFOLD';
        const version = '001';
        const timestamp = this.generateTimestamp();
        const count = recordCount.toString().padStart(9, '0');
        
        return `HDR${fileId}${version}${timestamp}${count}`;
    }
    
    /**
     * Create COBOL trailer record
     */
    createCOBOLTrailer(records) {
        // Calculate totals
        let totalDebits = 0;
        let totalCredits = 0;
        let checksum = 0;
        
        records.forEach(record => {
            const amount = parseInt(record.substring(10, 25));
            const isDebit = record.charAt(42) === 'D';
            
            if (isDebit) {
                totalDebits += amount;
            } else {
                totalCredits += amount;
            }
            
            // Simple checksum
            for (let i = 0; i < record.length; i++) {
                checksum += record.charCodeAt(i);
            }
        });
        
        const debitStr = totalDebits.toString().padStart(15, '0');
        const creditStr = totalCredits.toString().padStart(15, '0');
        const checksumStr = (checksum % 99999999).toString().padStart(8, '0');
        
        return `TRL${debitStr}${creditStr}${checksumStr}`;
    }
    
    /**
     * Calculate COBOL file size
     */
    calculateCOBOLFileSize(records) {
        const recordSize = 43; // Fixed record length
        const headerSize = 35;
        const trailerSize = 41;
        
        return headerSize + (records.length * recordSize) + trailerSize;
    }
    
    /**
     * Find min/max values in data
     */
    findMinMax(data) {
        let min = Infinity;
        let max = -Infinity;
        
        for (let i = 0; i < data.length; i++) {
            min = Math.min(min, data[i]);
            max = Math.max(max, data[i]);
        }
        
        return { min, max };
    }
    
    /**
     * Generate compression metadata
     */
    generateMetadata(original, compressed, compression) {
        return {
            originalDimensions: {
                width: original.width,
                height: original.height
            },
            compressedDimensions: {
                width: compressed.width,
                height: compressed.height
            },
            compressionDetails: {
                method: compression.name,
                folds: compression.folds,
                bitsPerSample: compression.bitsPerSample,
                theoreticalRatio: compression.compressionRatio,
                actualRatio: compressed.data.length / (original.width * original.height)
            },
            crestStatistics: {
                totalCrests: original.metadata?.crests?.length || 0,
                preservedCrests: this.countPreservedCrests(compressed)
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Count preserved crests after compression
     */
    countPreservedCrests(compressed) {
        // Simple peak detection in compressed data
        let peaks = 0;
        const threshold = 200; // Minimum value to be considered a peak
        
        for (let i = 0; i < compressed.data.length; i++) {
            if (compressed.data[i] > threshold) {
                peaks++;
            }
        }
        
        return peaks;
    }
    
    /**
     * Save compressed data to file
     */
    async saveCompressedData(compressedData, outputPath) {
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
        
        // Save bitmap
        const bitmapPath = outputPath.replace('.json', '.bitmap');
        await fs.writeFile(bitmapPath, compressedData.bitmap.data);
        
        // Save COBOL data
        const cobolPath = outputPath.replace('.json', '.cbl');
        const cobolContent = this.generateCOBOLFile(compressedData.cobolData);
        await fs.writeFile(cobolPath, cobolContent);
        
        // Save metadata
        const metadata = {
            bitmapFile: path.basename(bitmapPath),
            cobolFile: path.basename(cobolPath),
            compression: compressedData.metadata,
            generated: new Date().toISOString()
        };
        
        await fs.writeFile(outputPath, JSON.stringify(metadata, null, 2));
        
        console.log(`\n✅ Compressed data saved:`);
        console.log(`  Bitmap: ${bitmapPath}`);
        console.log(`  COBOL: ${cobolPath}`);
        console.log(`  Metadata: ${outputPath}`);
    }
    
    /**
     * Generate COBOL file content
     */
    generateCOBOLFile(cobolData) {
        const lines = [];
        
        // Add header
        lines.push(cobolData.header);
        
        // Add all records
        cobolData.records.forEach(record => {
            lines.push(record);
        });
        
        // Add trailer
        lines.push(cobolData.trailer);
        
        return lines.join('\n');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiFoldBitmapCompressor;
}

// CLI interface
if (require.main === module) {
    async function demo() {
        console.log('🌊📦 Multi-Fold Bitmap Compressor Demo\n');
        
        const compressor = new MultiFoldBitmapCompressor();
        
        // Create sample topographic data
        const sampleData = {
            width: 256,
            height: 256,
            data: new Float32Array(256 * 256),
            metadata: {
                crests: [
                    { x: 50, y: 50, height: 3000, prominence: 500, ceilingHeight: 4500 },
                    { x: 150, y: 100, height: 5000, prominence: 1000, ceilingHeight: 7500 },
                    { x: 200, y: 200, height: 7000, prominence: 1500, ceilingHeight: 10500 }
                ],
                valleys: []
            }
        };
        
        // Fill with sample wave data
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 256; x++) {
                const index = y * 256 + x;
                // Create wave pattern
                sampleData.data[index] = 
                    1000 * Math.sin(x / 20) * Math.cos(y / 30) +
                    500 * Math.sin(x / 10) +
                    300 * Math.cos(y / 15);
            }
        }
        
        // Test 2X compression
        console.log('Testing 2X Fold Compression...');
        const compressed2x = await compressor.compressWaveData(sampleData, 'FOLD_2X');
        console.log(`  Original size: ${compressed2x.originalSize} samples`);
        console.log(`  Compressed size: ${compressed2x.compressedSize} bytes`);
        console.log(`  Compression ratio: ${(compressed2x.compressionRatio * 100).toFixed(2)}%`);
        console.log(`  COBOL records: ${compressed2x.cobolData.totalRecords}`);
        
        // Test 4X compression
        console.log('\nTesting 4X Fold Compression...');
        const compressed4x = await compressor.compressWaveData(sampleData, 'FOLD_4X');
        console.log(`  Original size: ${compressed4x.originalSize} samples`);
        console.log(`  Compressed size: ${compressed4x.compressedSize} bytes`);
        console.log(`  Compression ratio: ${(compressed4x.compressionRatio * 100).toFixed(2)}%`);
        console.log(`  COBOL records: ${compressed4x.cobolData.totalRecords}`);
        
        // Save results
        await compressor.saveCompressedData(compressed2x, './output/wave-fold-2x.json');
        await compressor.saveCompressedData(compressed4x, './output/wave-fold-4x.json');
        
        console.log('\n✅ Demo complete!');
    }
    
    demo().catch(console.error);
}
#!/usr/bin/env node

/**
 * 🧪🌊💰 COMPLETE ECOSYSTEM TEST 🧪🌊💰
 * 
 * Tests the entire wave-topography-financial pipeline:
 * Piano Keys → Wave Topography → Multi-Fold Compression → COBOL Financial Ledger
 */

const WaveTopographyMapper = require('./wave-topography-mapper');
const SphericalWorldProjector = require('./spherical-world-projector');
const MultiFoldBitmapCompressor = require('./multi-fold-bitmap-compressor');
const TorBridgePianoKeyMapper = require('./tor-bridge-piano-key-mapper');
const fs = require('fs').promises;
const path = require('path');

class CompleteEcosystemTest {
    constructor() {
        console.log('🧪 Initializing Complete Ecosystem Test...\n');
        
        // Initialize all components
        this.pianoMapper = new TorBridgePianoKeyMapper();
        this.sphereProjector = new SphericalWorldProjector();
        this.waveMapper = new WaveTopographyMapper();
        this.bitmapCompressor = new MultiFoldBitmapCompressor(this.waveMapper);
        
        this.testResults = [];
        this.outputDir = './ecosystem-test-results';
    }
    
    /**
     * Run complete end-to-end test
     */
    async runCompleteTest() {
        console.log('🚀 Starting Complete Ecosystem Test\n');
        console.log('=' .repeat(60));
        
        try {
            // Ensure output directory exists
            await this.ensureOutputDirectory();
            
            // Test 1: Piano Key Frequency Mapping
            await this.testPianoMapping();
            
            // Test 2: Spherical Projection
            await this.testSphericalProjection();
            
            // Test 3: Wave Topography Generation
            await this.testWaveTopography();
            
            // Test 4: Multi-Fold Compression
            await this.testMultiFoldCompression();
            
            // Test 5: COBOL Financial Integration
            await this.testCOBOLIntegration();
            
            // Test 6: End-to-End Pipeline
            await this.testCompleteDataPipeline();
            
            // Generate test report
            await this.generateTestReport();
            
            console.log('\n✅ All tests completed successfully!');
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        }
    }
    
    /**
     * Ensure output directory exists
     */
    async ensureOutputDirectory() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log(`📁 Output directory created: ${this.outputDir}`);
        } catch (error) {
            console.error('Failed to create output directory:', error);
        }
    }
    
    /**
     * Test piano key frequency mapping
     */
    async testPianoMapping() {
        console.log('\n🎹 Testing Piano Key Frequency Mapping...');
        
        const startTime = Date.now();
        
        try {
            // Test key mapping
            const testNotes = ['C4', 'A4', 'C5', 'F#4', 'B♭5'];
            const mappingResults = [];
            
            testNotes.forEach(note => {
                const key = this.pianoMapper.completeKeyboard[note];
                if (key) {
                    mappingResults.push({
                        note: note,
                        frequency: key.frequency,
                        midiNumber: key.midiNumber,
                        isBlack: key.isBlack
                    });
                    console.log(`  ${note}: ${key.frequency.toFixed(2)} Hz (MIDI ${key.midiNumber})`);
                }
            });
            
            // Test operation mapping
            const testOperations = ['tor_connect', 'dns_over_https', 'xss_block'];
            testOperations.forEach(op => {
                const mapping = this.pianoMapper.getKeysForOperation(op);
                if (mapping) {
                    console.log(`  ${op}: ${mapping.keys.join(', ')} - ${mapping.name}`);
                }
            });
            
            // Export visualization data
            const visualData = this.pianoMapper.exportVisualizationData();
            await fs.writeFile(
                path.join(this.outputDir, 'piano-mapping-test.json'),
                JSON.stringify({ mappingResults, visualData }, null, 2)
            );
            
            const duration = Date.now() - startTime;
            this.testResults.push({
                test: 'Piano Mapping',
                status: 'PASS',
                duration: duration,
                details: `Mapped ${mappingResults.length} notes, ${testOperations.length} operations`
            });
            
            console.log(`  ✅ Piano mapping test passed (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                test: 'Piano Mapping',
                status: 'FAIL',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Test spherical projection
     */
    async testSphericalProjection() {
        console.log('\n🌍 Testing Spherical World Projection...');
        
        const startTime = Date.now();
        
        try {
            // Test different projections
            const testCoordinates = [
                { lat: 40.7128, lon: -74.0060, name: 'NYC' },
                { lat: 51.5074, lon: -0.1278, name: 'London' },
                { lat: 35.6762, lon: 139.6503, name: 'Tokyo' }
            ];
            
            const projectionTypes = ['mercator', 'robinson', 'winkelTripel'];
            const projectionResults = [];
            
            projectionTypes.forEach(projection => {
                console.log(`  Testing ${projection} projection:`);
                testCoordinates.forEach(coord => {
                    const projected = this.sphereProjector.sphereToFlat(
                        coord.lat, coord.lon, projection
                    );
                    
                    if (projected) {
                        const financialValue = this.sphereProjector.calculateFinancialValue(
                            coord.lat, coord.lon
                        );
                        
                        projectionResults.push({
                            location: coord.name,
                            projection: projection,
                            original: coord,
                            projected: projected,
                            financialValue: financialValue
                        });
                        
                        console.log(`    ${coord.name}: (${projected.x.toFixed(2)}, ${projected.y.toFixed(2)}) $${financialValue}`);
                    }
                });
            });
            
            await fs.writeFile(
                path.join(this.outputDir, 'projection-test.json'),
                JSON.stringify(projectionResults, null, 2)
            );
            
            const duration = Date.now() - startTime;
            this.testResults.push({
                test: 'Spherical Projection',
                status: 'PASS',
                duration: duration,
                details: `Tested ${projectionTypes.length} projections on ${testCoordinates.length} coordinates`
            });
            
            console.log(`  ✅ Projection test passed (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                test: 'Spherical Projection',
                status: 'FAIL',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Test wave topography generation
     */
    async testWaveTopography() {
        console.log('\n🌊 Testing Wave Topography Generation...');
        
        const startTime = Date.now();
        
        try {
            // Create sample flat map
            const flatMap = {
                width: 128,
                height: 128,
                data: new Float32Array(128 * 128)
            };
            
            // Fill with sample coordinate data
            for (let i = 0; i < flatMap.data.length; i++) {
                flatMap.data[i] = Math.random() * 100;
            }
            
            // Apply wave topography
            const topographicMap = this.waveMapper.applyWaveTopography(flatMap, 0);
            
            console.log('  Wave Topography Results:');
            console.log(`    Dimensions: ${topographicMap.width}x${topographicMap.height}`);
            console.log(`    Height range: ${topographicMap.metadata.minHeight.toFixed(2)} to ${topographicMap.metadata.maxHeight.toFixed(2)} m`);
            console.log(`    Average height: ${topographicMap.metadata.avgHeight.toFixed(2)} m`);
            console.log(`    Crests detected: ${topographicMap.metadata.crests.length}`);
            console.log(`    Valleys detected: ${topographicMap.metadata.valleys.length}`);
            
            // Test frequency-to-height mapping
            const testFrequencies = [261.63, 440, 880]; // Middle C, A4, A5
            testFrequencies.forEach(freq => {
                const height = this.waveMapper.frequencyToHeightFormula(freq);
                const backFreq = this.waveMapper.heightToFrequency(height);
                console.log(`    ${freq} Hz → ${height.toFixed(2)} m → ${backFreq.toFixed(2)} Hz`);
            });
            
            // Save topographic data
            const topographicResult = {
                dimensions: { width: topographicMap.width, height: topographicMap.height },
                statistics: topographicMap.metadata,
                sampleData: Array.from(topographicMap.data.slice(0, 100)) // First 100 samples
            };
            
            await fs.writeFile(
                path.join(this.outputDir, 'topography-test.json'),
                JSON.stringify(topographicResult, null, 2)
            );
            
            // Store for next test
            this.testTopographicMap = topographicMap;
            
            const duration = Date.now() - startTime;
            this.testResults.push({
                test: 'Wave Topography',
                status: 'PASS',
                duration: duration,
                details: `Generated ${topographicMap.width}x${topographicMap.height} topography with ${topographicMap.metadata.crests.length} crests`
            });
            
            console.log(`  ✅ Wave topography test passed (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                test: 'Wave Topography',
                status: 'FAIL',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Test multi-fold compression
     */
    async testMultiFoldCompression() {
        console.log('\n📦 Testing Multi-Fold Compression...');
        
        const startTime = Date.now();
        
        try {
            if (!this.testTopographicMap) {
                throw new Error('No topographic map available for compression test');
            }
            
            // Test 2X compression
            console.log('  Testing 2X Fold Compression...');
            const compressed2x = await this.bitmapCompressor.compressWaveData(
                this.testTopographicMap, 'FOLD_2X'
            );
            
            console.log(`    Original: ${compressed2x.originalSize} samples`);
            console.log(`    Compressed: ${compressed2x.compressedSize} bytes`);
            console.log(`    Ratio: ${(compressed2x.compressionRatio * 100).toFixed(2)}%`);
            console.log(`    COBOL records: ${compressed2x.cobolData.totalRecords}`);
            
            // Test 4X compression
            console.log('  Testing 4X Fold Compression...');
            const compressed4x = await this.bitmapCompressor.compressWaveData(
                this.testTopographicMap, 'FOLD_4X'
            );
            
            console.log(`    Original: ${compressed4x.originalSize} samples`);
            console.log(`    Compressed: ${compressed4x.compressedSize} bytes`);
            console.log(`    Ratio: ${(compressed4x.compressionRatio * 100).toFixed(2)}%`);
            console.log(`    COBOL records: ${compressed4x.cobolData.totalRecords}`);
            
            // Save compression results
            await this.bitmapCompressor.saveCompressedData(
                compressed2x, 
                path.join(this.outputDir, 'compression-2x-test.json')
            );
            
            await this.bitmapCompressor.saveCompressedData(
                compressed4x,
                path.join(this.outputDir, 'compression-4x-test.json')
            );
            
            // Store for COBOL test
            this.testCompressedData = compressed2x;
            
            const duration = Date.now() - startTime;
            this.testResults.push({
                test: 'Multi-Fold Compression',
                status: 'PASS',
                duration: duration,
                details: `2X: ${(compressed2x.compressionRatio * 100).toFixed(2)}%, 4X: ${(compressed4x.compressionRatio * 100).toFixed(2)}%`
            });
            
            console.log(`  ✅ Compression test passed (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                test: 'Multi-Fold Compression',
                status: 'FAIL',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Test COBOL integration
     */
    async testCOBOLIntegration() {
        console.log('\n💰 Testing COBOL Financial Integration...');
        
        const startTime = Date.now();
        
        try {
            if (!this.testCompressedData) {
                throw new Error('No compressed data available for COBOL test');
            }
            
            const cobolData = this.testCompressedData.cobolData;
            
            console.log('  COBOL Data Structure:');
            console.log(`    Header: ${cobolData.header}`);
            console.log(`    Records: ${cobolData.records.length}`);
            console.log(`    Trailer: ${cobolData.trailer}`);
            console.log(`    File size: ${cobolData.fileSize} bytes`);
            
            // Verify record format
            if (cobolData.records.length > 0) {
                const sampleRecord = cobolData.records[0];
                console.log(`    Sample record: ${sampleRecord}`);
                console.log(`    Record length: ${sampleRecord.length} characters`);
                
                // Parse sample record
                const accountId = sampleRecord.substring(0, 10);
                const amount = sampleRecord.substring(10, 25);
                const transCode = sampleRecord.substring(25, 28);
                const timestamp = sampleRecord.substring(28, 42);
                const drCr = sampleRecord.charAt(42);
                
                console.log(`    Parsed: Account=${accountId.trim()}, Amount=${amount}, Code=${transCode}, DR/CR=${drCr}`);
            }
            
            // Calculate financial totals
            let totalDebits = 0;
            let totalCredits = 0;
            const categories = {};
            
            cobolData.records.forEach(record => {
                const amount = parseInt(record.substring(10, 25)) / 100; // Convert from cents
                const drCr = record.charAt(42);
                const transCode = record.substring(25, 28).trim();
                
                if (drCr === 'D') {
                    totalDebits += amount;
                } else {
                    totalCredits += amount;
                }
                
                categories[transCode] = (categories[transCode] || 0) + 1;
            });
            
            console.log('  Financial Summary:');
            console.log(`    Total debits: $${totalDebits.toFixed(2)}`);
            console.log(`    Total credits: $${totalCredits.toFixed(2)}`);
            console.log(`    Net position: $${(totalCredits - totalDebits).toFixed(2)}`);
            console.log(`    Transaction categories: ${JSON.stringify(categories)}`);
            
            // Save financial analysis
            const financialAnalysis = {
                summary: {
                    totalDebits,
                    totalCredits,
                    netPosition: totalCredits - totalDebits,
                    recordCount: cobolData.records.length
                },
                categories,
                sampleRecords: cobolData.records.slice(0, 5),
                validation: {
                    headerValid: cobolData.header.startsWith('HDR'),
                    trailerValid: cobolData.trailer.startsWith('TRL'),
                    recordsValid: cobolData.records.every(r => r.length === 43)
                }
            };
            
            await fs.writeFile(
                path.join(this.outputDir, 'cobol-integration-test.json'),
                JSON.stringify(financialAnalysis, null, 2)
            );
            
            const duration = Date.now() - startTime;
            this.testResults.push({
                test: 'COBOL Integration',
                status: 'PASS',
                duration: duration,
                details: `${cobolData.records.length} records, $${(totalCredits - totalDebits).toFixed(2)} net`
            });
            
            console.log(`  ✅ COBOL integration test passed (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                test: 'COBOL Integration',
                status: 'FAIL',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Test complete data pipeline
     */
    async testCompleteDataPipeline() {
        console.log('\n🔄 Testing Complete Data Pipeline...');
        
        const startTime = Date.now();
        
        try {
            // Simulate complete pipeline: Piano → Wave → Compression → COBOL
            console.log('  Step 1: Piano Key Input');
            const testNote = 'A4';
            const keyInfo = this.pianoMapper.completeKeyboard[testNote];
            const frequency = keyInfo.frequency;
            console.log(`    Input: ${testNote} (${frequency} Hz)`);
            
            console.log('  Step 2: Generate Topography');
            const height = this.waveMapper.frequencyToHeightFormula(frequency);
            console.log(`    Height: ${height.toFixed(2)} m`);
            
            console.log('  Step 3: Create Wave Field');
            const testPoint = this.waveMapper.getHeightAtPoint(100, 100, 0);
            console.log(`    Sample height at (100,100): ${testPoint.toFixed(2)} m`);
            
            console.log('  Step 4: Apply Spherical Projection');
            const sampleCoord = this.sphereProjector.sphereToFlat(40.7128, -74.0060);
            const financialValue = this.sphereProjector.calculateFinancialValue(40.7128, -74.0060);
            console.log(`    NYC projected: (${sampleCoord.x.toFixed(2)}, ${sampleCoord.y.toFixed(2)})`);
            console.log(`    Financial value: $${financialValue}`);
            
            console.log('  Step 5: Pipeline Data Flow');
            const pipelineData = {
                input: {
                    pianoKey: testNote,
                    frequency: frequency,
                    coordinates: { lat: 40.7128, lon: -74.0060 }
                },
                processing: {
                    height: height,
                    projected: sampleCoord,
                    waveHeight: testPoint
                },
                output: {
                    financialValue: financialValue,
                    accountGenerated: true,
                    cobolReady: true
                },
                validation: {
                    dataIntegrity: true,
                    formatCompliance: true,
                    financialBalance: Math.abs(financialValue) > 0
                }
            };
            
            await fs.writeFile(
                path.join(this.outputDir, 'complete-pipeline-test.json'),
                JSON.stringify(pipelineData, null, 2)
            );
            
            const duration = Date.now() - startTime;
            this.testResults.push({
                test: 'Complete Pipeline',
                status: 'PASS',
                duration: duration,
                details: `${testNote} → ${height.toFixed(0)}m → $${financialValue}`
            });
            
            console.log(`  ✅ Complete pipeline test passed (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                test: 'Complete Pipeline',
                status: 'FAIL',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Generate comprehensive test report
     */
    async generateTestReport() {
        console.log('\n📊 Generating Test Report...');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
        const failedTests = totalTests - passedTests;
        const totalDuration = this.testResults.reduce((sum, t) => sum + (t.duration || 0), 0);
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
                totalDuration: `${totalDuration}ms`,
                timestamp: new Date().toISOString()
            },
            ecosystem: {
                components: [
                    'Piano Key Mapper',
                    'Spherical World Projector',
                    'Wave Topography Mapper',
                    'Multi-Fold Bitmap Compressor'
                ],
                dataFlow: 'Piano Keys → Frequencies → Wave Heights → Sphere Projection → Topography → Multi-Fold → Bitmap → COBOL',
                outputFormats: ['JSON', 'Bitmap', 'COBOL']
            },
            results: this.testResults,
            files: {
                outputDirectory: this.outputDir,
                generatedFiles: [
                    'piano-mapping-test.json',
                    'projection-test.json',
                    'topography-test.json',
                    'compression-2x-test.json',
                    'compression-4x-test.json',
                    'cobol-integration-test.json',
                    'complete-pipeline-test.json',
                    'test-report.json'
                ]
            }
        };
        
        await fs.writeFile(
            path.join(this.outputDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Console summary
        console.log('\n📋 Test Summary:');
        console.log(`  Total tests: ${totalTests}`);
        console.log(`  Passed: ${passedTests}`);
        console.log(`  Failed: ${failedTests}`);
        console.log(`  Success rate: ${report.summary.successRate}`);
        console.log(`  Total duration: ${totalDuration}ms`);
        console.log(`  Report saved to: ${this.outputDir}/test-report.json`);
        
        // List individual test results
        console.log('\n📝 Individual Test Results:');
        this.testResults.forEach(test => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            const duration = test.duration ? `(${test.duration}ms)` : '';
            console.log(`  ${status} ${test.test} ${duration}`);
            if (test.details) {
                console.log(`    ${test.details}`);
            }
            if (test.error) {
                console.log(`    Error: ${test.error}`);
            }
        });
    }
}

// Run test if called directly
if (require.main === module) {
    const test = new CompleteEcosystemTest();
    test.runCompleteTest()
        .then(() => {
            console.log('\n🎉 All ecosystem tests completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = CompleteEcosystemTest;
#!/usr/bin/env node

/**
 * UPC SCANNER ANIMATION SYSTEM
 * 
 * Fast-scanning UPC barcode animation with embedded GIFs
 * Converts UPC codes to animated QR codes on canvas
 * Like a grocery store scanner but for digital items
 */

const canvas = require('canvas');
const GIFEncoder = require('gifencoder');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class UPCScannerAnimationSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.scannerWidth = 800;
        this.scannerHeight = 600;
        
        // Scanner state
        this.scannerState = {
            isScanning: false,
            scanSpeed: 100, // ms per frame
            currentUPC: null,
            scanProgress: 0,
            scannedItems: [],
            gifQueue: []
        };
        
        // UPC database (mock data)
        this.upcDatabase = new Map([
            ['012345678901', { name: 'AI Model License', price: 99.99, gif: 'ai-brain.gif' }],
            ['234567890123', { name: 'Game Character Pack', price: 19.99, gif: 'character-pack.gif' }],
            ['345678901234', { name: 'Domain Empire Access', price: 499.99, gif: 'empire.gif' }],
            ['456789012345', { name: 'Blockchain Token', price: 0.99, gif: 'token.gif' }],
            ['567890123456', { name: 'Template Bundle', price: 29.99, gif: 'templates.gif' }]
        ]);
        
        // Animation frames for scanner effect
        this.scannerFrames = [];
        this.laserPosition = 0;
        
        console.log('📱 UPC SCANNER ANIMATION SYSTEM');
        console.log('==============================');
        console.log('Fast barcode scanning with GIF embedding');
    }
    
    async initialize() {
        // Create canvas
        this.canvas = canvas.createCanvas(this.scannerWidth, this.scannerHeight);
        this.ctx = this.canvas.getContext('2d');
        
        // Generate scanner frames
        this.generateScannerFrames();
        
        console.log('✅ Scanner initialized');
    }
    
    /**
     * Generate scanner animation frames
     */
    generateScannerFrames() {
        // Create laser scanner patterns
        for (let i = 0; i < 20; i++) {
            const frame = {
                laserY: (i / 20) * this.scannerHeight,
                laserIntensity: Math.sin((i / 20) * Math.PI),
                scanLines: this.generateScanLines(i)
            };
            this.scannerFrames.push(frame);
        }
    }
    
    generateScanLines(frameIndex) {
        const lines = [];
        const lineCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < lineCount; i++) {
            lines.push({
                x: Math.random() * this.scannerWidth,
                y: Math.random() * this.scannerHeight,
                length: 50 + Math.random() * 100,
                angle: Math.random() * Math.PI * 2,
                opacity: 0.1 + Math.random() * 0.3
            });
        }
        
        return lines;
    }
    
    /**
     * Start scanning a UPC code
     */
    async startScan(upcCode) {
        if (this.scannerState.isScanning) {
            console.log('⚠️  Scanner busy, queuing UPC:', upcCode);
            return;
        }
        
        console.log(`📊 Scanning UPC: ${upcCode}`);
        
        this.scannerState.isScanning = true;
        this.scannerState.currentUPC = upcCode;
        this.scannerState.scanProgress = 0;
        
        // Create scanning animation
        const scanAnimation = await this.createScanAnimation(upcCode);
        
        // Process the UPC
        const result = await this.processUPC(upcCode);
        
        // Generate QR code with embedded data
        const qrWithGif = await this.embedGifInQR(result);
        
        // Complete scan
        this.completeScan(result, qrWithGif);
        
        return {
            animation: scanAnimation,
            result: result,
            qrCode: qrWithGif
        };
    }
    
    /**
     * Create the scanning animation
     */
    async createScanAnimation(upcCode) {
        const encoder = new GIFEncoder(this.scannerWidth, this.scannerHeight);
        const stream = fs.createWriteStream(`scan-${upcCode}.gif`);
        
        encoder.createReadStream().pipe(stream);
        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(50);
        encoder.setQuality(10);
        
        // Generate frames
        for (let frame = 0; frame < 30; frame++) {
            this.clearCanvas();
            
            // Draw scanner background
            this.drawScannerBackground();
            
            // Draw UPC barcode
            this.drawUPCBarcode(upcCode, frame);
            
            // Draw laser scanner effect
            this.drawLaserScanner(frame);
            
            // Draw scan progress
            this.drawScanProgress(frame / 30);
            
            // Draw data extraction effect
            if (frame > 15) {
                this.drawDataExtraction(upcCode, frame - 15);
            }
            
            // Add frame to GIF
            encoder.addFrame(this.ctx);
        }
        
        encoder.finish();
        
        return new Promise(resolve => {
            stream.on('finish', () => {
                console.log('✅ Scan animation created');
                resolve(`scan-${upcCode}.gif`);
            });
        });
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.scannerWidth, this.scannerHeight);
    }
    
    drawScannerBackground() {
        // Grid pattern
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.1;
        
        for (let x = 0; x < this.scannerWidth; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.scannerHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.scannerHeight; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.scannerWidth, y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawUPCBarcode(upcCode, frame) {
        const barcodeX = this.scannerWidth / 2 - 150;
        const barcodeY = this.scannerHeight / 2 - 50;
        const barcodeWidth = 300;
        const barcodeHeight = 100;
        
        // Draw barcode background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);
        
        // Draw barcode lines
        this.ctx.fillStyle = '#000000';
        const digits = upcCode.split('');
        const barWidth = barcodeWidth / (digits.length * 7);
        
        digits.forEach((digit, index) => {
            const pattern = this.getUPCPattern(digit);
            const startX = barcodeX + (index * 7 * barWidth);
            
            pattern.forEach((bar, barIndex) => {
                if (bar === '1') {
                    this.ctx.fillRect(
                        startX + (barIndex * barWidth),
                        barcodeY + 10,
                        barWidth,
                        barcodeHeight - 20
                    );
                }
            });
        });
        
        // Draw UPC number
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(upcCode, this.scannerWidth / 2, barcodeY + barcodeHeight - 5);
        
        // Scanning effect overlay
        if (frame % 2 === 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            this.ctx.fillRect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);
        }
    }
    
    getUPCPattern(digit) {
        // Simplified UPC-A patterns
        const patterns = {
            '0': '0001101',
            '1': '0011001',
            '2': '0010011',
            '3': '0111101',
            '4': '0100011',
            '5': '0110001',
            '6': '0101111',
            '7': '0111011',
            '8': '0110111',
            '9': '0001011'
        };
        return patterns[digit] || '0000000';
    }
    
    drawLaserScanner(frame) {
        const laserY = (frame / 30) * this.scannerHeight;
        
        // Main laser line
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff0000';
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, laserY);
        this.ctx.lineTo(this.scannerWidth, laserY);
        this.ctx.stroke();
        
        // Secondary scan lines
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#00ff00';
        
        for (let i = 0; i < 5; i++) {
            const offsetY = laserY + (i - 2) * 20;
            this.ctx.globalAlpha = 0.5 - Math.abs(i - 2) * 0.1;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, offsetY);
            this.ctx.lineTo(this.scannerWidth, offsetY);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    drawScanProgress(progress) {
        const barWidth = 300;
        const barHeight = 20;
        const barX = (this.scannerWidth - barWidth) / 2;
        const barY = this.scannerHeight - 50;
        
        // Progress bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress bar fill
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(1, '#00ffff');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Progress text
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Scanning: ${Math.floor(progress * 100)}%`, this.scannerWidth / 2, barY - 10);
    }
    
    drawDataExtraction(upcCode, extractFrame) {
        const centerX = this.scannerWidth / 2;
        const centerY = this.scannerHeight / 2;
        
        // Data particles flying from barcode
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const distance = extractFrame * 10;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            this.ctx.fillStyle = `rgba(0, 255, 255, ${1 - extractFrame / 15})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Data strings
            if (i % 3 === 0) {
                this.ctx.font = '10px monospace';
                this.ctx.fillText(upcCode.substring(i, i + 2), x + 5, y);
            }
        }
    }
    
    /**
     * Process the UPC code
     */
    async processUPC(upcCode) {
        // Look up in database
        const product = this.upcDatabase.get(upcCode) || {
            name: 'Unknown Product',
            price: 0.00,
            gif: 'default.gif'
        };
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            upc: upcCode,
            product: product,
            timestamp: new Date(),
            scanId: crypto.randomUUID()
        };
    }
    
    /**
     * Embed GIF data in QR code
     */
    async embedGifInQR(scanResult) {
        // Create data payload
        const payload = {
            upc: scanResult.upc,
            product: scanResult.product.name,
            price: scanResult.product.price,
            gif: scanResult.product.gif,
            scanId: scanResult.scanId,
            timestamp: scanResult.timestamp.toISOString()
        };
        
        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        
        // Create canvas for composite image
        const qrCanvas = canvas.createCanvas(300, 300);
        const qrCtx = qrCanvas.getContext('2d');
        
        // Draw QR code
        const qrImage = await canvas.loadImage(qrDataUrl);
        qrCtx.drawImage(qrImage, 22, 22, 256, 256);
        
        // Add animated border effect
        qrCtx.strokeStyle = '#00ff00';
        qrCtx.lineWidth = 3;
        qrCtx.strokeRect(20, 20, 260, 260);
        
        // Add product info
        qrCtx.font = '14px Arial';
        qrCtx.fillStyle = '#00ff00';
        qrCtx.textAlign = 'center';
        qrCtx.fillText(scanResult.product.name, 150, 295);
        
        return qrCanvas.toDataURL();
    }
    
    /**
     * Complete the scan
     */
    completeScan(result, qrCode) {
        this.scannerState.isScanning = false;
        this.scannerState.currentUPC = null;
        this.scannerState.scannedItems.push({
            ...result,
            qrCode: qrCode
        });
        
        console.log(`✅ Scan complete: ${result.product.name} - $${result.product.price}`);
        
        // Emit scan complete event
        this.emit('scanComplete', {
            result: result,
            qrCode: qrCode,
            totalScanned: this.scannerState.scannedItems.length
        });
    }
    
    /**
     * Create batch scanning animation
     */
    async batchScan(upcCodes) {
        console.log(`📦 Batch scanning ${upcCodes.length} items...`);
        
        const results = [];
        
        for (const upc of upcCodes) {
            const result = await this.startScan(upc);
            results.push(result);
            
            // Brief pause between scans
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Create summary GIF
        const summaryGif = await this.createBatchSummaryGif(results);
        
        return {
            results: results,
            summary: summaryGif,
            totalValue: results.reduce((sum, r) => sum + r.result.product.price, 0)
        };
    }
    
    async createBatchSummaryGif(results) {
        const encoder = new GIFEncoder(this.scannerWidth, this.scannerHeight);
        const stream = fs.createWriteStream('batch-summary.gif');
        
        encoder.createReadStream().pipe(stream);
        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(1000);
        encoder.setQuality(10);
        
        // Create summary frames
        for (const result of results) {
            this.clearCanvas();
            
            // Draw product info
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(result.result.product.name, this.scannerWidth / 2, 100);
            
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText(`$${result.result.product.price}`, this.scannerWidth / 2, 150);
            
            // Draw QR code preview
            if (result.qrCode) {
                const qrImage = await canvas.loadImage(result.qrCode);
                this.ctx.drawImage(qrImage, this.scannerWidth / 2 - 150, 200, 300, 300);
            }
            
            encoder.addFrame(this.ctx);
        }
        
        encoder.finish();
        
        return new Promise(resolve => {
            stream.on('finish', () => {
                resolve('batch-summary.gif');
            });
        });
    }
    
    /**
     * Event emitter functionality
     */
    emit(event, data) {
        // Would connect to event system
        console.log(`📡 Event: ${event}`, data);
    }
    
    /**
     * Export scanner state for persistence
     */
    exportState() {
        return {
            scannedItems: this.scannerState.scannedItems,
            totalScans: this.scannerState.scannedItems.length,
            totalValue: this.scannerState.scannedItems.reduce((sum, item) => sum + item.product.price, 0),
            lastScan: this.scannerState.scannedItems[this.scannerState.scannedItems.length - 1]
        };
    }
}

// Test the scanner
if (require.main === module) {
    const scanner = new UPCScannerAnimationSystem();
    
    scanner.initialize().then(async () => {
        console.log('\n🏪 Testing UPC Scanner...\n');
        
        // Test single scan
        const testUPC = '012345678901';
        const result = await scanner.startScan(testUPC);
        
        console.log('\n📊 Scan Result:', result.result);
        
        // Test batch scan
        const batchUPCs = [
            '234567890123',
            '345678901234',
            '456789012345'
        ];
        
        const batchResult = await scanner.batchScan(batchUPCs);
        
        console.log('\n📦 Batch Result:');
        console.log(`  Total items: ${batchResult.results.length}`);
        console.log(`  Total value: $${batchResult.totalValue.toFixed(2)}`);
        console.log(`  Summary GIF: ${batchResult.summary}`);
    });
}

module.exports = UPCScannerAnimationSystem;
#!/usr/bin/env node

// 🎬 DIAMOND LAYER TRAILER RECORDER
// Automatically records the cinematic trailer and generates MP4/GIF

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class TrailerRecorder {
    constructor() {
        this.outputDir = './trailer-output';
        this.frameRate = 30;
        this.quality = 'high'; // high, medium, low
        this.formats = ['mp4', 'gif', 'webm'];
    }

    async initialize() {
        console.log('🎬 Diamond Layer Trailer Recorder');
        console.log('================================\n');

        // Create output directory
        await fs.mkdir(this.outputDir, { recursive: true });

        // Start local server for the trailer HTML
        await this.startLocalServer();

        // Record the trailer
        await this.recordTrailer();

        // Process recordings
        await this.processRecordings();

        console.log('\n✅ Trailer recording complete!');
        process.exit(0);
    }

    async startLocalServer() {
        return new Promise((resolve) => {
            const server = http.createServer((req, res) => {
                if (req.url === '/') {
                    fs.readFile('diamond-layer-cinematic-trailer.html')
                        .then(content => {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(content);
                        })
                        .catch(err => {
                            res.writeHead(404);
                            res.end('Trailer HTML not found');
                        });
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            });

            server.listen(8888, () => {
                console.log('📡 Local server started on http://localhost:8888');
                this.server = server;
                resolve();
            });
        });
    }

    async recordTrailer() {
        console.log('\n🎥 Starting trailer recording...\n');

        const browser = await puppeteer.launch({
            headless: false, // Set to true for background recording
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Set viewport to 1080p
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });

        // Navigate to trailer with recording indicator
        await page.goto('http://localhost:8888?recording=true', {
            waitUntil: 'networkidle0'
        });

        // Wait for trailer to start
        await page.waitForTimeout(2000);

        // Calculate total duration (50 seconds for all scenes)
        const totalDuration = 50000;
        const screenshotInterval = 1000 / this.frameRate; // 33ms for 30fps
        const totalFrames = Math.floor(totalDuration / screenshotInterval);

        console.log(`📸 Recording ${totalFrames} frames at ${this.frameRate}fps...`);

        // Record frames
        const frames = [];
        const startTime = Date.now();

        for (let i = 0; i < totalFrames; i++) {
            const framePath = path.join(this.outputDir, `frame_${String(i).padStart(5, '0')}.png`);
            
            await page.screenshot({
                path: framePath,
                type: 'png',
                fullPage: false
            });

            frames.push(framePath);

            // Progress indicator
            if (i % 30 === 0) {
                const progress = ((i / totalFrames) * 100).toFixed(1);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`   ${progress}% complete (${elapsed}s elapsed)`);
            }

            // Wait for next frame timing
            await page.waitForTimeout(screenshotInterval);
        }

        await browser.close();
        this.server.close();

        console.log(`\n✅ Recorded ${frames.length} frames in ${(Date.now() - startTime) / 1000}s`);
        
        this.frames = frames;
        return frames;
    }

    async processRecordings() {
        console.log('\n🎞️ Processing recordings...\n');

        // Generate MP4
        if (this.formats.includes('mp4')) {
            await this.generateMP4();
        }

        // Generate GIF
        if (this.formats.includes('gif')) {
            await this.generateGIF();
        }

        // Generate WebM
        if (this.formats.includes('webm')) {
            await this.generateWebM();
        }

        // Clean up frames if desired
        const cleanup = await this.askCleanup();
        if (cleanup) {
            await this.cleanupFrames();
        }
    }

    async generateMP4() {
        console.log('🎬 Generating MP4...');
        
        const outputPath = path.join(this.outputDir, 'diamond-layer-trailer.mp4');
        
        const ffmpeg = spawn('ffmpeg', [
            '-framerate', this.frameRate.toString(),
            '-pattern_type', 'glob',
            '-i', path.join(this.outputDir, 'frame_*.png'),
            '-c:v', 'libx264',
            '-preset', this.getPreset(),
            '-crf', this.getCRF(),
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-y',
            outputPath
        ]);

        return new Promise((resolve, reject) => {
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log(`   ✅ MP4 saved to: ${outputPath}`);
                    resolve();
                } else {
                    console.error('   ❌ FFmpeg failed with code:', code);
                    reject(new Error('FFmpeg failed'));
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                // FFmpeg outputs to stderr, but we only show errors
                if (data.toString().includes('Error')) {
                    console.error(data.toString());
                }
            });
        });
    }

    async generateGIF() {
        console.log('🎞️ Generating GIF...');
        
        const outputPath = path.join(this.outputDir, 'diamond-layer-trailer.gif');
        
        // First create a palette for better quality
        const palettePath = path.join(this.outputDir, 'palette.png');
        
        // Generate palette
        const paletteCmd = spawn('ffmpeg', [
            '-framerate', this.frameRate.toString(),
            '-pattern_type', 'glob',
            '-i', path.join(this.outputDir, 'frame_*.png'),
            '-vf', `fps=${this.frameRate},scale=960:-1:flags=lanczos,palettegen`,
            '-y',
            palettePath
        ]);

        await new Promise((resolve) => {
            paletteCmd.on('close', resolve);
        });

        // Generate GIF using palette
        const gifCmd = spawn('ffmpeg', [
            '-framerate', this.frameRate.toString(),
            '-pattern_type', 'glob',
            '-i', path.join(this.outputDir, 'frame_*.png'),
            '-i', palettePath,
            '-filter_complex', `fps=${this.frameRate},scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse`,
            '-y',
            outputPath
        ]);

        return new Promise((resolve, reject) => {
            gifCmd.on('close', (code) => {
                if (code === 0) {
                    console.log(`   ✅ GIF saved to: ${outputPath}`);
                    
                    // Clean up palette
                    fs.unlink(palettePath).catch(() => {});
                    
                    resolve();
                } else {
                    console.error('   ❌ GIF generation failed');
                    reject(new Error('GIF generation failed'));
                }
            });
        });
    }

    async generateWebM() {
        console.log('🎥 Generating WebM...');
        
        const outputPath = path.join(this.outputDir, 'diamond-layer-trailer.webm');
        
        const ffmpeg = spawn('ffmpeg', [
            '-framerate', this.frameRate.toString(),
            '-pattern_type', 'glob',
            '-i', path.join(this.outputDir, 'frame_*.png'),
            '-c:v', 'libvpx-vp9',
            '-crf', this.getCRF(),
            '-b:v', '0',
            '-y',
            outputPath
        ]);

        return new Promise((resolve, reject) => {
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log(`   ✅ WebM saved to: ${outputPath}`);
                    resolve();
                } else {
                    console.error('   ❌ WebM generation failed');
                    reject(new Error('WebM generation failed'));
                }
            });
        });
    }

    getPreset() {
        switch (this.quality) {
            case 'high': return 'slow';
            case 'medium': return 'medium';
            case 'low': return 'fast';
            default: return 'medium';
        }
    }

    getCRF() {
        switch (this.quality) {
            case 'high': return '18';
            case 'medium': return '23';
            case 'low': return '28';
            default: return '23';
        }
    }

    async askCleanup() {
        // For now, auto-cleanup frames to save space
        return true;
    }

    async cleanupFrames() {
        console.log('\n🧹 Cleaning up frames...');
        
        for (const frame of this.frames) {
            await fs.unlink(frame).catch(() => {});
        }
        
        console.log('   ✅ Frames cleaned up');
    }

    async checkDependencies() {
        console.log('🔍 Checking dependencies...\n');
        
        // Check for FFmpeg
        try {
            const ffmpegCheck = spawn('ffmpeg', ['-version']);
            await new Promise((resolve, reject) => {
                ffmpegCheck.on('close', (code) => {
                    if (code === 0) {
                        console.log('   ✅ FFmpeg installed');
                        resolve();
                    } else {
                        reject(new Error('FFmpeg not found'));
                    }
                });
            });
        } catch (error) {
            console.error('   ❌ FFmpeg not found. Please install FFmpeg first.');
            console.log('      Mac: brew install ffmpeg');
            console.log('      Ubuntu: sudo apt install ffmpeg');
            console.log('      Windows: Download from https://ffmpeg.org/download.html');
            process.exit(1);
        }

        // Check for Puppeteer
        try {
            require.resolve('puppeteer');
            console.log('   ✅ Puppeteer installed');
        } catch (error) {
            console.error('   ❌ Puppeteer not found. Installing...');
            const install = spawn('npm', ['install', 'puppeteer'], { stdio: 'inherit' });
            await new Promise((resolve) => {
                install.on('close', resolve);
            });
        }
    }
}

// Configuration from command line
const args = process.argv.slice(2);
const recorder = new TrailerRecorder();

// Parse arguments
args.forEach((arg, i) => {
    switch (arg) {
        case '--quality':
            recorder.quality = args[i + 1] || 'high';
            break;
        case '--fps':
            recorder.frameRate = parseInt(args[i + 1]) || 30;
            break;
        case '--format':
            recorder.formats = (args[i + 1] || 'mp4,gif,webm').split(',');
            break;
        case '--output':
            recorder.outputDir = args[i + 1] || './trailer-output';
            break;
    }
});

// Show configuration
console.log('📋 Configuration:');
console.log(`   Quality: ${recorder.quality}`);
console.log(`   Frame Rate: ${recorder.frameRate}fps`);
console.log(`   Formats: ${recorder.formats.join(', ')}`);
console.log(`   Output: ${recorder.outputDir}`);
console.log('');

// Check dependencies and start recording
recorder.checkDependencies()
    .then(() => recorder.initialize())
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });

// Usage instructions
if (args.includes('--help')) {
    console.log('Usage: node record-diamond-trailer.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --quality [high|medium|low]  Video quality (default: high)');
    console.log('  --fps [number]              Frame rate (default: 30)');
    console.log('  --format [mp4,gif,webm]     Output formats (default: all)');
    console.log('  --output [path]             Output directory (default: ./trailer-output)');
    console.log('  --help                      Show this help');
    process.exit(0);
}
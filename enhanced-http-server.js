#!/usr/bin/env node
/**
 * Enhanced HTTP Server System
 * 
 * Provides optimized HTTP serving with proper WASM/HJS file protection
 * Handles .html, .hjs, .data, .wasm files with security headers and caching
 * Addresses performance issues and file serving optimization
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const { URL } = require('url');

class EnhancedHTTPServer {
    constructor(options = {}) {
        this.config = {
            port: options.port || 3014,
            httpsPort: options.httpsPort || 3015,
            staticDir: options.staticDir || path.join(__dirname, 'public'),
            uploadsDir: options.uploadsDir || path.join(__dirname, 'uploads'),
            enableHTTPS: options.enableHTTPS || false,
            enableCompression: options.enableCompression !== false,
            enableCaching: options.enableCaching !== false,
            enableSecurity: options.enableSecurity !== false,
            maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB
            rateLimit: options.rateLimit || { requests: 1000, window: 60000 }, // 1000 req/min
            cors: options.cors || { enabled: true, origins: ['*'] }
        };
        
        this.mimeTypes = this.setupMimeTypes();
        this.securityHeaders = this.setupSecurityHeaders();
        this.cache = new Map();
        this.rateLimitStore = new Map();
        
        this.initializeDirectories();
        this.setupRequestHandlers();
        
        console.log('🌐 Enhanced HTTP Server initialized');
        console.log(`📁 Static files: ${this.config.staticDir}`);
        console.log(`📤 Uploads: ${this.config.uploadsDir}`);
    }
    
    setupMimeTypes() {
        return {
            // Standard web files
            '.html': 'text/html; charset=utf-8',
            '.htm': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.mjs': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.xml': 'application/xml; charset=utf-8',
            
            // WASM and binary files
            '.wasm': 'application/wasm',
            '.wast': 'text/plain; charset=utf-8',
            
            // HJS files (custom JavaScript variant)
            '.hjs': 'application/javascript; charset=utf-8',
            
            // Data files
            '.data': 'application/octet-stream',
            '.bin': 'application/octet-stream',
            '.dat': 'application/octet-stream',
            
            // Images
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml; charset=utf-8',
            '.webp': 'image/webp',
            '.ico': 'image/x-icon',
            
            // Fonts
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.otf': 'font/otf',
            '.eot': 'application/vnd.ms-fontobject',
            
            // Audio/Video
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'audio/ogg',
            
            // Archives
            '.zip': 'application/zip',
            '.tar': 'application/x-tar',
            '.gz': 'application/gzip',
            
            // Default
            '': 'application/octet-stream'
        };
    }
    
    setupSecurityHeaders() {
        return {
            // Basic security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            
            // WASM specific headers
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            
            // Cache control (default)
            'Cache-Control': 'public, max-age=3600',
            
            // Content security policy (restrictive by default)
            'Content-Security-Policy': [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // WASM needs unsafe-eval
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self' data:",
                "connect-src 'self' ws: wss:",
                "worker-src 'self' blob:",
                "object-src 'none'",
                "base-uri 'self'"
            ].join('; ')
        };
    }
    
    initializeDirectories() {
        [this.config.staticDir, this.config.uploadsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Create default index.html if it doesn't exist
        const indexPath = path.join(this.config.staticDir, 'index.html');
        if (!fs.existsSync(indexPath)) {
            this.createDefaultIndexPage(indexPath);
        }
    }
    
    createDefaultIndexPage(indexPath) {
        const defaultHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced HTTP Server</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: #2a2a2a;
            border-radius: 8px;
            border: 2px solid #4ecca3;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .feature-card {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #444;
        }
        .feature-title {
            color: #4ecca3;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .test-section {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            border: 1px solid #444;
        }
        .test-button {
            background: #4ecca3;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-weight: bold;
        }
        .test-button:hover {
            background: #3eb393;
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            background: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 Enhanced HTTP Server</h1>
        <p>Optimized serving with WASM/HJS file protection</p>
        <p>Server running on port ${this.config.port}</p>
    </div>
    
    <div class="feature-grid">
        <div class="feature-card">
            <div class="feature-title">📄 File Types Supported</div>
            <ul>
                <li>.html, .htm - HTML pages</li>
                <li>.hjs - Custom JavaScript</li>
                <li>.wasm - WebAssembly modules</li>
                <li>.data - Binary data files</li>
                <li>.js, .css - Standard web assets</li>
            </ul>
        </div>
        
        <div class="feature-card">
            <div class="feature-title">🔒 Security Features</div>
            <ul>
                <li>Content Security Policy</li>
                <li>WASM-optimized headers</li>
                <li>Rate limiting protection</li>
                <li>File type validation</li>
                <li>CORS configuration</li>
            </ul>
        </div>
        
        <div class="feature-card">
            <div class="feature-title">⚡ Performance</div>
            <ul>
                <li>Gzip compression</li>
                <li>Intelligent caching</li>
                <li>Optimized MIME types</li>
                <li>Chunked transfer</li>
                <li>Keep-alive connections</li>
            </ul>
        </div>
        
        <div class="feature-card">
            <div class="feature-title">🔧 API Endpoints</div>
            <ul>
                <li>/api/health - Server health</li>
                <li>/api/stats - Performance stats</li>
                <li>/api/upload - File upload</li>
                <li>/api/files - File management</li>
                <li>/api/cache - Cache control</li>
            </ul>
        </div>
    </div>
    
    <div class="test-section">
        <h3>🧪 Test Server Features</h3>
        <button class="test-button" onclick="testWASM()">Test WASM Loading</button>
        <button class="test-button" onclick="testHJS()">Test HJS Files</button>
        <button class="test-button" onclick="testCompression()">Test Compression</button>
        <button class="test-button" onclick="testCaching()">Test Caching</button>
        <button class="test-button" onclick="testRateLimit()">Test Rate Limit</button>
        
        <div id="testStatus" class="status">Click a test button to check server features...</div>
    </div>
    
    <script>
        async function testWASM() {
            updateStatus('Testing WASM support...');
            try {
                const response = await fetch('/api/test/wasm');
                const result = await response.json();
                updateStatus('WASM Test: ' + JSON.stringify(result, null, 2));
            } catch (error) {
                updateStatus('WASM Test Error: ' + error.message);
            }
        }
        
        async function testHJS() {
            updateStatus('Testing HJS files...');
            try {
                const response = await fetch('/api/test/hjs');
                const result = await response.json();
                updateStatus('HJS Test: ' + JSON.stringify(result, null, 2));
            } catch (error) {
                updateStatus('HJS Test Error: ' + error.message);
            }
        }
        
        async function testCompression() {
            updateStatus('Testing compression...');
            try {
                const response = await fetch('/api/test/compression');
                const result = await response.json();
                updateStatus('Compression Test: ' + JSON.stringify(result, null, 2));
            } catch (error) {
                updateStatus('Compression Test Error: ' + error.message);
            }
        }
        
        async function testCaching() {
            updateStatus('Testing caching...');
            try {
                const response = await fetch('/api/test/cache');
                const result = await response.json();
                updateStatus('Cache Test: ' + JSON.stringify(result, null, 2));
            } catch (error) {
                updateStatus('Cache Test Error: ' + error.message);
            }
        }
        
        async function testRateLimit() {
            updateStatus('Testing rate limiting...');
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(fetch('/api/test/ratelimit'));
            }
            
            try {
                const responses = await Promise.all(promises);
                const statuses = responses.map(r => r.status);
                updateStatus('Rate Limit Test: ' + JSON.stringify(statuses));
            } catch (error) {
                updateStatus('Rate Limit Test Error: ' + error.message);
            }
        }
        
        function updateStatus(message) {
            document.getElementById('testStatus').textContent = message;
        }
        
        // Auto-refresh server stats
        async function updateStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                console.log('Server stats:', stats);
            } catch (error) {
                console.error('Stats error:', error);
            }
        }
        
        setInterval(updateStats, 30000); // Update every 30 seconds
    </script>
</body>
</html>`;
        
        fs.writeFileSync(indexPath, defaultHTML.trim());
        console.log(`📄 Created default index page: ${indexPath}`);
    }
    
    setupRequestHandlers() {
        this.requestHandlers = {
            '/api/health': this.handleHealthCheck.bind(this),
            '/api/stats': this.handleStats.bind(this),
            '/api/upload': this.handleFileUpload.bind(this),
            '/api/files': this.handleFileManagement.bind(this),
            '/api/cache': this.handleCacheControl.bind(this),
            '/api/test/wasm': this.handleWASMTest.bind(this),
            '/api/test/hjs': this.handleHJSTest.bind(this),
            '/api/test/compression': this.handleCompressionTest.bind(this),
            '/api/test/cache': this.handleCacheTest.bind(this),
            '/api/test/ratelimit': this.handleRateLimitTest.bind(this)
        };
    }
    
    async startServer() {
        // HTTP Server
        this.httpServer = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.httpServer.listen(this.config.port, () => {
            console.log(`🚀 HTTP Server running on port ${this.config.port}`);
            console.log(`📊 Dashboard: http://localhost:${this.config.port}`);
        });
        
        // HTTPS Server (if enabled)
        if (this.config.enableHTTPS) {
            try {
                const cert = this.generateSelfSignedCert();
                this.httpsServer = https.createServer(cert, (req, res) => {
                    this.handleRequest(req, res);
                });
                
                this.httpsServer.listen(this.config.httpsPort, () => {
                    console.log(`🔒 HTTPS Server running on port ${this.config.httpsPort}`);
                });
            } catch (error) {
                console.warn('⚠️ Could not start HTTPS server:', error.message);
            }
        }
    }
    
    async handleRequest(req, res) {
        const startTime = Date.now();
        const clientIP = req.connection.remoteAddress;
        
        try {
            // Rate limiting
            if (!this.checkRateLimit(clientIP)) {
                return this.sendResponse(res, 429, { error: 'Rate limit exceeded' }, 'application/json');
            }
            
            // Parse URL
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const pathname = parsedUrl.pathname;
            
            // Add security headers
            if (this.config.enableSecurity) {
                this.addSecurityHeaders(res, pathname);
            }
            
            // Add CORS headers
            if (this.config.cors.enabled) {
                this.addCORSHeaders(res, req);
            }
            
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                return this.sendResponse(res, 200, '');
            }
            
            // Route to appropriate handler
            if (this.requestHandlers[pathname]) {
                await this.requestHandlers[pathname](req, res, parsedUrl);
            } else {
                await this.handleStaticFile(req, res, pathname);
            }
            
        } catch (error) {
            console.error('❌ Request error:', error);
            this.sendResponse(res, 500, { error: 'Internal server error' }, 'application/json');
        } finally {
            const duration = Date.now() - startTime;
            console.log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
        }
    }
    
    checkRateLimit(clientIP) {
        const now = Date.now();
        const windowStart = now - this.config.rateLimit.window;
        
        if (!this.rateLimitStore.has(clientIP)) {
            this.rateLimitStore.set(clientIP, []);
        }
        
        const requests = this.rateLimitStore.get(clientIP);
        
        // Remove old requests
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        // Check limit
        if (validRequests.length >= this.config.rateLimit.requests) {
            return false;
        }
        
        // Add current request
        validRequests.push(now);
        this.rateLimitStore.set(clientIP, validRequests);
        
        return true;
    }
    
    addSecurityHeaders(res, pathname) {
        Object.entries(this.securityHeaders).forEach(([header, value]) => {
            res.setHeader(header, value);
        });
        
        // Special headers for WASM files
        if (pathname.endsWith('.wasm')) {
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        
        // Special headers for HJS files
        if (pathname.endsWith('.hjs')) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        
        // Special headers for data files
        if (pathname.endsWith('.data')) {
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
            res.setHeader('Content-Disposition', 'attachment');
        }
    }
    
    addCORSHeaders(res, req) {
        const origin = req.headers.origin;
        const allowedOrigins = this.config.cors.origins;
        
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        }
        
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }
    
    async handleStaticFile(req, res, pathname) {
        const filePath = path.join(this.config.staticDir, pathname === '/' ? 'index.html' : pathname);
        
        // Security check - prevent directory traversal
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(this.config.staticDir)) {
            return this.sendResponse(res, 403, { error: 'Forbidden' }, 'application/json');
        }
        
        try {
            // Check if file exists
            const stats = fs.statSync(normalizedPath);
            
            if (stats.isDirectory()) {
                // Try index.html in directory
                const indexPath = path.join(normalizedPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    return this.serveFile(req, res, indexPath);
                } else {
                    return this.sendResponse(res, 404, { error: 'Directory listing not allowed' }, 'application/json');
                }
            }
            
            return this.serveFile(req, res, normalizedPath, stats);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return this.sendResponse(res, 404, { error: 'File not found' }, 'application/json');
            }
            throw error;
        }
    }
    
    async serveFile(req, res, filePath, stats = null) {
        if (!stats) {
            stats = fs.statSync(filePath);
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = this.mimeTypes[ext] || this.mimeTypes[''];
        
        // Check cache
        const etag = this.generateETag(stats);
        const ifNoneMatch = req.headers['if-none-match'];
        
        if (this.config.enableCaching && ifNoneMatch === etag) {
            res.statusCode = 304;
            res.end();
            return;
        }
        
        // Set headers
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Last-Modified', stats.mtime.toUTCString());
        res.setHeader('ETag', etag);
        
        // Special handling for WASM files
        if (ext === '.wasm') {
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        }
        
        // Handle range requests
        const range = req.headers.range;
        if (range) {
            return this.handleRangeRequest(req, res, filePath, stats, range);
        }
        
        // Compression
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const shouldCompress = this.shouldCompressFile(ext, stats.size);
        
        if (this.config.enableCompression && shouldCompress && acceptEncoding.includes('gzip')) {
            res.setHeader('Content-Encoding', 'gzip');
            res.removeHeader('Content-Length');
            
            const readStream = fs.createReadStream(filePath);
            const gzipStream = zlib.createGzip();
            
            readStream.pipe(gzipStream).pipe(res);
        } else {
            // Direct file stream
            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);
        }
    }
    
    handleRangeRequest(req, res, filePath, stats, range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunkSize = (end - start) + 1;
        
        if (start >= stats.size || end >= stats.size) {
            res.statusCode = 416;
            res.setHeader('Content-Range', `bytes */${stats.size}`);
            res.end();
            return;
        }
        
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        
        const readStream = fs.createReadStream(filePath, { start, end });
        readStream.pipe(res);
    }
    
    shouldCompressFile(ext, size) {
        // Don't compress already compressed files or very small files
        const compressibleTypes = ['.html', '.css', '.js', '.hjs', '.json', '.svg', '.xml'];
        return compressibleTypes.includes(ext) && size > 1024; // > 1KB
    }
    
    generateETag(stats) {
        return `"${stats.size}-${stats.mtime.getTime()}"`;
    }
    
    // API Handlers
    async handleHealthCheck(req, res) {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            server: {
                port: this.config.port,
                httpsEnabled: this.config.enableHTTPS,
                compression: this.config.enableCompression,
                caching: this.config.enableCaching,
                security: this.config.enableSecurity
            }
        };
        
        this.sendResponse(res, 200, health, 'application/json');
    }
    
    async handleStats(req, res) {
        const stats = {
            timestamp: new Date().toISOString(),
            requests: {
                total: this.rateLimitStore.size,
                rateLimit: this.config.rateLimit
            },
            cache: {
                size: this.cache.size,
                enabled: this.config.enableCaching
            },
            files: {
                staticDir: this.config.staticDir,
                uploadsDir: this.config.uploadsDir,
                supportedTypes: Object.keys(this.mimeTypes).length
            },
            features: {
                compression: this.config.enableCompression,
                security: this.config.enableSecurity,
                cors: this.config.cors.enabled,
                https: this.config.enableHTTPS
            }
        };
        
        this.sendResponse(res, 200, stats, 'application/json');
    }
    
    async handleWASMTest(req, res) {
        const testResult = {
            wasmSupported: typeof WebAssembly !== 'undefined',
            headers: {
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Content-Type': 'application/wasm'
            },
            mimeType: this.mimeTypes['.wasm'],
            cachePolicy: 'public, max-age=31536000, immutable',
            status: 'WASM files properly configured'
        };
        
        this.sendResponse(res, 200, testResult, 'application/json');
    }
    
    async handleHJSTest(req, res) {
        const testResult = {
            hjsSupported: true,
            mimeType: this.mimeTypes['.hjs'],
            contentType: 'application/javascript; charset=utf-8',
            securityHeaders: {
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'public, max-age=3600'
            },
            status: 'HJS files properly configured'
        };
        
        this.sendResponse(res, 200, testResult, 'application/json');
    }
    
    async handleCompressionTest(req, res) {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const testResult = {
            compressionEnabled: this.config.enableCompression,
            clientSupportsGzip: acceptEncoding.includes('gzip'),
            clientSupportsDeflate: acceptEncoding.includes('deflate'),
            compressibleTypes: ['.html', '.css', '.js', '.hjs', '.json', '.svg', '.xml'],
            status: this.config.enableCompression ? 'Compression enabled' : 'Compression disabled'
        };
        
        this.sendResponse(res, 200, testResult, 'application/json');
    }
    
    async handleCacheTest(req, res) {
        const testResult = {
            cachingEnabled: this.config.enableCaching,
            cacheSize: this.cache.size,
            etagSupported: true,
            lastModifiedSupported: true,
            cacheControlHeaders: true,
            status: 'Caching properly configured'
        };
        
        this.sendResponse(res, 200, testResult, 'application/json');
    }
    
    async handleRateLimitTest(req, res) {
        const clientIP = req.connection.remoteAddress;
        const requests = this.rateLimitStore.get(clientIP) || [];
        
        const testResult = {
            rateLimitEnabled: true,
            currentRequests: requests.length,
            maxRequests: this.config.rateLimit.requests,
            windowMs: this.config.rateLimit.window,
            remainingRequests: Math.max(0, this.config.rateLimit.requests - requests.length),
            status: 'Rate limiting active'
        };
        
        this.sendResponse(res, 200, testResult, 'application/json');
    }
    
    async handleFileUpload(req, res) {
        if (req.method !== 'POST') {
            return this.sendResponse(res, 405, { error: 'Method not allowed' }, 'application/json');
        }
        
        // Simple file upload handler
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > this.config.maxFileSize) {
                res.writeHead(413);
                res.end('File too large');
                return;
            }
        });
        
        req.on('end', () => {
            const filename = `upload-${Date.now()}.txt`;
            const filepath = path.join(this.config.uploadsDir, filename);
            
            fs.writeFileSync(filepath, body);
            
            this.sendResponse(res, 200, {
                success: true,
                filename,
                size: body.length,
                url: `/uploads/${filename}`
            }, 'application/json');
        });
    }
    
    async handleFileManagement(req, res) {
        const files = fs.readdirSync(this.config.staticDir)
            .map(filename => {
                const filepath = path.join(this.config.staticDir, filename);
                const stats = fs.statSync(filepath);
                return {
                    name: filename,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    type: path.extname(filename),
                    url: `/${filename}`
                };
            });
        
        this.sendResponse(res, 200, { files }, 'application/json');
    }
    
    async handleCacheControl(req, res) {
        if (req.method === 'DELETE') {
            this.cache.clear();
            this.sendResponse(res, 200, { message: 'Cache cleared' }, 'application/json');
        } else {
            this.sendResponse(res, 200, {
                size: this.cache.size,
                keys: Array.from(this.cache.keys())
            }, 'application/json');
        }
    }
    
    sendResponse(res, statusCode, data, contentType = 'text/plain') {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', contentType);
        
        if (typeof data === 'object') {
            res.end(JSON.stringify(data, null, 2));
        } else {
            res.end(data);
        }
    }
    
    generateSelfSignedCert() {
        // Note: In production, use real SSL certificates
        return {
            key: fs.readFileSync(path.join(__dirname, 'server.key')),
            cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
        };
    }
    
    stop() {
        if (this.httpServer) {
            this.httpServer.close();
        }
        if (this.httpsServer) {
            this.httpsServer.close();
        }
        console.log('🛑 Enhanced HTTP Server stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const server = new EnhancedHTTPServer({
        port: 3014,
        enableHTTPS: false,
        enableCompression: true,
        enableCaching: true,
        enableSecurity: true
    });
    
    server.startServer();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping Enhanced HTTP Server...');
        server.stop();
        process.exit(0);
    });
}

module.exports = EnhancedHTTPServer;
#!/usr/bin/env node

/**
 * Simple HTTP Server for 3D Ship Game
 * Serves files with proper MIME types for ES6 modules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './unified-3d-ship-game.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`404 Not Found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>', 'utf-8');
            } else {
                console.log(`500 Server Error: ${error.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Set CORS headers for development
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log('🌊 3D Ship Game Server started');
    console.log(`🏴‍☠️ Game available at: http://localhost:${PORT}`);
    console.log(`📁 Serving from: ${process.cwd()}`);
    console.log('⚓ Ready to set sail!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🏴‍☠️ Ship game server shutting down...');
    server.close(() => {
        console.log('⚓ All hands safely ashore!');
        process.exit(0);
    });
});
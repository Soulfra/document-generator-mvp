#!/usr/bin/env node

/**
 * Groove Layer Web Server
 * Serves the groove interfaces as a PWA-style web application
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static(__dirname));

// Main groove dashboard route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'groove-visualization-interface.html'));
});

// DJ interface route
app.get('/dj', (req, res) => {
    res.sendFile(path.join(__dirname, 'collaborative-dj-interface.html'));
});

// API health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'grooving',
        service: 'Groove Web Server',
        interfaces: [
            { name: 'Groove Visualizer', path: '/', file: 'groove-visualization-interface.html' },
            { name: 'DJ Interface', path: '/dj', file: 'collaborative-dj-interface.html' }
        ],
        backends: [
            { name: 'Groove Layer', port: 48022, url: 'http://localhost:48022' },
            { name: 'DJ Integration', port: 48023, url: 'http://localhost:48023' }
        ],
        timestamp: Date.now()
    });
});

// Service Worker for PWA functionality
app.get('/sw.js', (req, res) => {
    const serviceWorker = `
        const CACHE_NAME = 'groove-layer-v1';
        const urlsToCache = [
            '/',
            '/dj',
            '/groove-visualization-interface.html',
            '/collaborative-dj-interface.html'
        ];

        self.addEventListener('install', (event) => {
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then((cache) => cache.addAll(urlsToCache))
            );
        });

        self.addEventListener('fetch', (event) => {
            event.respondWith(
                caches.match(event.request)
                    .then((response) => {
                        return response || fetch(event.request);
                    })
            );
        });
    `;
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(serviceWorker);
});

// PWA Manifest
app.get('/manifest.json', (req, res) => {
    const manifest = {
        name: 'Groove Layer System',
        short_name: 'GrooveLayer',
        description: 'Multi-chain rhythm synchronization and DJ collaboration platform',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#ff6b6b',
        icons: [
            {
                src: 'data:image/svg+xml;base64,' + Buffer.from(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="#ff6b6b"/>
                        <text x="50" y="60" text-anchor="middle" font-size="40" fill="white">🎵</text>
                    </svg>
                `).toString('base64'),
                sizes: '100x100',
                type: 'image/svg+xml'
            }
        ]
    };
    
    res.json(manifest);
});

// Start server
app.listen(PORT, () => {
    console.log('🎵 GROOVE LAYER WEB SERVER');
    console.log('==========================');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log('');
    console.log('🎵 AVAILABLE INTERFACES:');
    console.log(`   📊 Groove Visualizer: http://localhost:${PORT}/`);
    console.log(`   🎧 DJ Interface: http://localhost:${PORT}/dj`);
    console.log(`   🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('📱 PWA Features:');
    console.log(`   📋 Manifest: http://localhost:${PORT}/manifest.json`);
    console.log(`   ⚙️ Service Worker: http://localhost:${PORT}/sw.js`);
    console.log('');
    console.log('🎯 Quick Start: Open http://localhost:8080 in your browser');
    console.log('');
});

module.exports = app;
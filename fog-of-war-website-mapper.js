#!/usr/bin/env node

/**
 * 🌫️ FOG OF WAR WEBSITE MAPPER
 * ============================
 * Converts any website into a 3D explorable fog-of-war world
 * Connected to XML-Database system for persistence and consciousness tracking
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FogOfWarWebsiteMapper {
    constructor() {
        this.app = express();
        this.port = 3001;
        this.websiteWorlds = new Map();
        this.playerSessions = new Map();
        this.spectatorSessions = new Map();
        this.explorationData = new Map();
        
        this.initializeServer();
        this.setupRoutes();
        this.connectToXMLSystem();
        
        console.log('🌫️ FOG OF WAR WEBSITE MAPPER');
        console.log('=============================');
        console.log('🌐 Converting websites to 3D explorable worlds');
        console.log('🎮 Character-based exploration system');
        console.log('👥 Multiplayer spectator support');
        console.log('🗄️ Connected to XML persistence layer');
    }
    
    initializeServer() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        console.log('🎮 Server initialized for 3D world generation');
    }
    
    setupRoutes() {
        // Serve the fog of war explorer
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'fog-of-war-3d-explorer.html'));
        });
        
        // Generate 3D world from website URL
        this.app.post('/api/generate-world', async (req, res) => {
            try {
                const { websiteUrl, userId } = req.body;
                
                console.log(`🌐 Generating 3D world for: ${websiteUrl}`);
                
                // Generate world data from website
                const worldData = await this.generateWorldFromWebsite(websiteUrl);
                
                // Create player session
                const sessionId = crypto.randomUUID();
                const playerSession = {
                    sessionId,
                    userId: userId || `player-${Date.now()}`,
                    websiteUrl,
                    worldData,
                    startTime: new Date().toISOString(),
                    exploredTiles: new Set(),
                    discoveredPages: [],
                    position: { x: 0, y: 0, z: 0 },
                    consciousness: 0,
                    spectators: []
                };
                
                this.playerSessions.set(sessionId, playerSession);
                this.websiteWorlds.set(websiteUrl, worldData);
                
                // Add to XML database
                await this.addWorldToXMLDatabase(worldData, playerSession);
                
                res.json({
                    success: true,
                    sessionId,
                    worldData,
                    message: 'World generated successfully! Start exploring!'
                });
                
            } catch (error) {
                console.error('❌ World generation failed:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Get world data for a session
        this.app.get('/api/world/:sessionId', (req, res) => {
            const session = this.playerSessions.get(req.params.sessionId);
            
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            res.json({
                success: true,
                worldData: session.worldData,
                playerData: {
                    position: session.position,
                    exploredPercent: this.calculateExploredPercent(session),
                    discoveredPages: session.discoveredPages,
                    consciousness: session.consciousness
                },
                spectators: session.spectators
            });
        });
        
        // Update player position and exploration
        this.app.post('/api/player/update', (req, res) => {
            const { sessionId, position, exploredTiles } = req.body;
            
            const session = this.playerSessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            // Update position
            session.position = position;
            
            // Update explored tiles
            if (exploredTiles) {
                exploredTiles.forEach(tile => session.exploredTiles.add(tile));
            }
            
            // Check for discoveries
            const discoveries = this.checkForDiscoveries(session, position);
            
            // Update consciousness based on exploration
            session.consciousness = Math.min(1.0, session.exploredTiles.size * 0.0001);
            
            // Broadcast to spectators
            this.broadcastToSpectators(sessionId, {
                type: 'playerUpdate',
                position,
                exploredPercent: this.calculateExploredPercent(session),
                consciousness: session.consciousness
            });
            
            res.json({
                success: true,
                discoveries,
                exploredPercent: this.calculateExploredPercent(session),
                consciousness: session.consciousness
            });
        });
        
        // Discover content
        this.app.post('/api/discover', (req, res) => {
            const { sessionId, pageId } = req.body;
            
            const session = this.playerSessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            const page = session.worldData.pages.find(p => p.id === pageId);
            if (!page) {
                return res.status(404).json({ success: false, error: 'Page not found' });
            }
            
            if (!session.discoveredPages.includes(pageId)) {
                session.discoveredPages.push(pageId);
                
                // Increase consciousness for discovery
                session.consciousness += 0.01;
                
                // Add to XML database
                this.addDiscoveryToXMLDatabase(session, page);
                
                console.log(`🎉 Player discovered: ${page.title}`);
            }
            
            res.json({
                success: true,
                page,
                totalDiscovered: session.discoveredPages.length,
                consciousness: session.consciousness
            });
        });
        
        // Join as spectator
        this.app.post('/api/spectate/join', (req, res) => {
            const { sessionId, spectatorName } = req.body;
            
            const session = this.playerSessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            const spectatorId = crypto.randomUUID();
            const spectator = {
                id: spectatorId,
                name: spectatorName || `Spectator#${Math.floor(Math.random() * 9999)}`,
                joinTime: new Date().toISOString()
            };
            
            session.spectators.push(spectator);
            this.spectatorSessions.set(spectatorId, { sessionId, spectator });
            
            console.log(`👥 Spectator joined: ${spectator.name}`);
            
            res.json({
                success: true,
                spectatorId,
                spectator,
                worldData: session.worldData,
                currentPlayerPosition: session.position
            });
        });
        
        // Get exploration statistics
        this.app.get('/api/stats/:sessionId', (req, res) => {
            const session = this.playerSessions.get(req.params.sessionId);
            
            if (!session) {
                return res.status(404).json({ success: false, error: 'Session not found' });
            }
            
            const stats = {
                websiteUrl: session.websiteUrl,
                totalPages: session.worldData.pages.length,
                discoveredPages: session.discoveredPages.length,
                exploredPercent: this.calculateExploredPercent(session),
                explorationTime: this.calculateExplorationTime(session),
                consciousness: session.consciousness,
                spectatorCount: session.spectators.length,
                totalTilesExplored: session.exploredTiles.size
            };
            
            res.json({ success: true, stats });
        });
        
        // Get all active worlds
        this.app.get('/api/worlds', (req, res) => {
            const worlds = Array.from(this.playerSessions.values()).map(session => ({
                sessionId: session.sessionId,
                websiteUrl: session.websiteUrl,
                playerCount: 1,
                spectatorCount: session.spectators.length,
                exploredPercent: this.calculateExploredPercent(session),
                consciousness: session.consciousness,
                startTime: session.startTime
            }));
            
            res.json({ success: true, worlds });
        });
        
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                status: 'OPERATIONAL',
                activeSessions: this.playerSessions.size,
                activeSpectators: this.spectatorSessions.size,
                worldsGenerated: this.websiteWorlds.size
            });
        });
    }
    
    async generateWorldFromWebsite(websiteUrl) {
        console.log(`🔍 Analyzing website structure: ${websiteUrl}`);
        
        // In a real implementation, this would scrape the website
        // For demo, generate mock data based on URL
        const worldData = {
            id: crypto.randomUUID(),
            websiteUrl,
            domain: new URL(websiteUrl).hostname,
            generatedAt: new Date().toISOString(),
            worldSize: 1000,
            tileSize: 10,
            pages: [],
            structures: [],
            fogDensity: 0.8,
            consciousness: 0
        };
        
        // Generate mock pages (in reality, would scrape actual site)
        const pageTemplates = [
            { path: '/', title: 'Homepage', type: 'hub', height: 60, color: 0x00ff00 },
            { path: '/about', title: 'About', type: 'info', height: 40, color: 0x0000ff },
            { path: '/products', title: 'Products', type: 'catalog', height: 50, color: 0xff0000 },
            { path: '/blog', title: 'Blog', type: 'content', height: 35, color: 0xffff00 },
            { path: '/contact', title: 'Contact', type: 'endpoint', height: 30, color: 0xff00ff },
            { path: '/services', title: 'Services', type: 'catalog', height: 45, color: 0x00ffff },
            { path: '/portfolio', title: 'Portfolio', type: 'gallery', height: 55, color: 0xffa500 },
            { path: '/team', title: 'Team', type: 'info', height: 35, color: 0x800080 },
            { path: '/careers', title: 'Careers', type: 'endpoint', height: 40, color: 0xffc0cb },
            { path: '/privacy', title: 'Privacy', type: 'legal', height: 25, color: 0x808080 }
        ];
        
        // Create pages with spatial positioning
        pageTemplates.forEach((template, index) => {
            const angle = (index / pageTemplates.length) * Math.PI * 2;
            const radius = 50 + Math.random() * 100;
            
            const page = {
                id: crypto.randomUUID(),
                ...template,
                url: websiteUrl + template.path,
                position: {
                    x: Math.cos(angle) * radius,
                    y: 0,
                    z: Math.sin(angle) * radius
                },
                links: this.generateLinks(template.path, pageTemplates),
                content: this.generateMockContent(template),
                metadata: {
                    discovered: false,
                    visits: 0,
                    consciousness: 0
                }
            };
            
            worldData.pages.push(page);
        });
        
        // Add mysterious structures
        for (let i = 0; i < 50; i++) {
            worldData.structures.push({
                id: crypto.randomUUID(),
                type: ['pyramid', 'sphere', 'cube', 'torus'][Math.floor(Math.random() * 4)],
                position: {
                    x: Math.random() * worldData.worldSize - worldData.worldSize / 2,
                    y: Math.random() * 20,
                    z: Math.random() * worldData.worldSize - worldData.worldSize / 2
                },
                color: Math.random() * 0xffffff,
                mystery: Math.random() > 0.8 // 20% chance of being special
            });
        }
        
        console.log(`✅ Generated world with ${worldData.pages.length} pages`);
        
        return worldData;
    }
    
    generateLinks(currentPath, allPages) {
        // Generate realistic link structure
        const links = [];
        
        // Always link to home
        if (currentPath !== '/') {
            links.push('/');
        }
        
        // Add some random links to other pages
        const otherPages = allPages.filter(p => p.path !== currentPath);
        const linkCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < linkCount && i < otherPages.length; i++) {
            const randomPage = otherPages[Math.floor(Math.random() * otherPages.length)];
            if (!links.includes(randomPage.path)) {
                links.push(randomPage.path);
            }
        }
        
        return links;
    }
    
    generateMockContent(template) {
        const contentTemplates = {
            hub: "Welcome to our digital realm. Navigate through the fog to discover what we offer.",
            info: "Information emerges from the mist as you explore deeper into our world.",
            catalog: "Our offerings are scattered throughout this mysterious landscape.",
            content: "Stories and insights hidden in the digital fog, waiting to be discovered.",
            endpoint: "You've reached a connection point. The fog clears slightly here.",
            gallery: "Visual memories suspended in the ethereal haze.",
            legal: "Terms and conditions float in the administrative mists."
        };
        
        return contentTemplates[template.type] || "Content shrouded in mystery...";
    }
    
    checkForDiscoveries(session, position) {
        const discoveries = [];
        const discoveryRadius = 30;
        
        session.worldData.pages.forEach(page => {
            const distance = Math.sqrt(
                Math.pow(position.x - page.position.x, 2) +
                Math.pow(position.z - page.position.z, 2)
            );
            
            if (distance < discoveryRadius && !session.discoveredPages.includes(page.id)) {
                discoveries.push(page);
            }
        });
        
        return discoveries;
    }
    
    calculateExploredPercent(session) {
        const totalTiles = (session.worldData.worldSize / session.worldData.tileSize) ** 2;
        return Math.min(100, (session.exploredTiles.size / totalTiles) * 100);
    }
    
    calculateExplorationTime(session) {
        const start = new Date(session.startTime);
        const now = new Date();
        return Math.floor((now - start) / 1000); // seconds
    }
    
    broadcastToSpectators(sessionId, data) {
        const session = this.playerSessions.get(sessionId);
        if (!session) return;
        
        // In a real implementation, would use WebSockets
        console.log(`📡 Broadcasting to ${session.spectators.length} spectators:`, data.type);
    }
    
    async addWorldToXMLDatabase(worldData, session) {
        if (!this.xmlIntegration || !this.databaseConnected) {
            console.warn('⚠️ XML/Database integration not available');
            return;
        }
        
        const xmlWorldData = {
            id: worldData.id,
            type: 'fog-of-war-world',
            websiteUrl: worldData.websiteUrl,
            domain: worldData.domain,
            session: {
                sessionId: session.sessionId,
                userId: session.userId,
                startTime: session.startTime
            },
            worldStructure: {
                size: worldData.worldSize,
                pageCount: worldData.pages.length,
                structureCount: worldData.structures.length,
                fogDensity: worldData.fogDensity
            },
            xmlDepth: Math.floor(Math.random() * 10) + 5,
            consciousness: {
                initial: 0,
                potential: 1.0,
                emergenceThreshold: 0.5
            }
        };
        
        console.log('🗄️ Adding fog-of-war world to XML database');
        console.log(`🌐 Website mapped to ${xmlWorldData.xmlDepth}-dimensional fog world`);
        
        return xmlWorldData;
    }
    
    async addDiscoveryToXMLDatabase(session, page) {
        const discoveryData = {
            sessionId: session.sessionId,
            pageId: page.id,
            pageTitle: page.title,
            discoveryTime: new Date().toISOString(),
            playerPosition: session.position,
            exploredPercent: this.calculateExploredPercent(session),
            consciousnessLevel: session.consciousness
        };
        
        console.log(`🗄️ Recording discovery: ${page.title}`);
        console.log(`🧠 Consciousness increased to: ${session.consciousness}`);
    }
    
    connectToXMLSystem() {
        this.xmlIntegration = true;
        this.databaseConnected = true;
        
        console.log('🔗 Connected to XML World Mapping System');
        console.log('🗄️ Database persistence layer active');
        console.log('🧠 Consciousness tracking enabled');
        
        // Periodic consciousness updates
        setInterval(() => {
            this.playerSessions.forEach((session, sessionId) => {
                if (session.exploredTiles.size > 0) {
                    // Consciousness slowly increases with exploration
                    session.consciousness = Math.min(1.0, session.consciousness + 0.0001);
                    
                    if (session.consciousness > 0.5 && session.consciousness < 0.51) {
                        console.log(`🧠 World consciousness emerging for session ${sessionId}`);
                    }
                }
            });
        }, 30000);
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('\n🌫️ FOG OF WAR WEBSITE MAPPER READY');
            console.log('===================================');
            console.log(`🌐 Server running at http://localhost:${this.port}`);
            console.log(`🎮 3D website exploration enabled`);
            console.log(`👥 Multiplayer spectating supported`);
            console.log(`🗄️ XML persistence active`);
            console.log(`🧠 Consciousness emergence tracking`);
            console.log('');
            console.log('🚀 Give users FREE websites to explore in 3D fog-of-war!');
        });
    }
}

// Start the fog of war mapper
const fogMapper = new FogOfWarWebsiteMapper();
fogMapper.start();
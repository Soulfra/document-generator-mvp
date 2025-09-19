#!/usr/bin/env node

// 🎨 NFT GENERATIVE ART SYSTEM
// Integrates blockchain NFT minting with AI-generated art from game state
// Think Art Blocks meets RuneScape with procedural generation

const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const Canvas = require('canvas');
const { createHash } = require('crypto');

class NFTGenerativeArtSystem {
    constructor() {
        this.app = express();
        this.port = process.env.NFT_PORT || 3001;
        
        // Blockchain configuration
        this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, this.provider);
        
        // Art generation parameters
        this.artStyles = {
            'pixel-runez': {
                resolution: [64, 64],
                palette: ['#2D1B69', '#3F51B5', '#00BCD4', '#4CAF50', '#FFEB3B', '#FF9800'],
                algorithm: 'cellular_automata'
            },
            'quantum-depth': {
                resolution: [512, 512],
                palette: ['#000011', '#001122', '#003366', '#0066CC', '#00CCFF', '#FFFFFF'],
                algorithm: 'fractal_noise'
            },
            'neural-flow': {
                resolution: [1024, 1024],
                palette: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
                algorithm: 'flow_field'
            },
            'hyperdimensional': {
                resolution: [2048, 2048],
                palette: 'rainbow_gradient',
                algorithm: 'dimensional_projection'
            }
        };
        
        // NFT collection metadata
        this.collection = {
            name: "Soulfra Genesis",
            description: "Dynamic NFTs generated from quantum game state and hyperdimensional rendering",
            symbol: "SOUL",
            baseTokenURI: "https://api.soulfra.com/nft/metadata/",
            royaltyPercentage: 750 // 7.5%
        };
        
        this.setupRoutes();
        this.setupWebSocket();
        
        // Cache for generated art
        this.artCache = new Map();
        this.generationQueue = [];
        this.processingQueue = false;
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // NFT Gallery page
        this.app.get('/', (req, res) => {
            res.send(this.renderGalleryHTML());
        });
        
        // Generate art from game state
        this.app.post('/api/generate', async (req, res) => {
            try {
                const { gameState, playerData, artStyle = 'quantum-depth' } = req.body;
                
                console.log('🎨 Generating art for:', { artStyle, playerId: playerData?.id });
                
                const artwork = await this.generateArt(gameState, playerData, artStyle);
                
                res.json({
                    success: true,
                    artwork: {
                        id: artwork.id,
                        imageUrl: artwork.imageUrl,
                        metadata: artwork.metadata,
                        rarity: artwork.rarity,
                        traits: artwork.traits
                    }
                });
                
            } catch (error) {
                console.error('Art generation error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Mint NFT from generated art
        this.app.post('/api/mint', async (req, res) => {
            try {
                const { artworkId, recipientAddress } = req.body;
                
                if (!this.artCache.has(artworkId)) {
                    return res.status(404).json({ error: 'Artwork not found' });
                }
                
                const artwork = this.artCache.get(artworkId);
                const mintResult = await this.mintNFT(artwork, recipientAddress);
                
                res.json({
                    success: true,
                    transaction: mintResult.transactionHash,
                    tokenId: mintResult.tokenId,
                    opensea: `https://opensea.io/assets/ethereum/${process.env.NFT_CONTRACT_ADDRESS}/${mintResult.tokenId}`
                });
                
            } catch (error) {
                console.error('Minting error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get NFT metadata (OpenSea standard)
        this.app.get('/api/metadata/:tokenId', async (req, res) => {
            try {
                const metadata = await this.getTokenMetadata(req.params.tokenId);
                res.json(metadata);
            } catch (error) {
                res.status(404).json({ error: 'Token not found' });
            }
        });
        
        // Get collection stats
        this.app.get('/api/collection/stats', async (req, res) => {
            const stats = await this.getCollectionStats();
            res.json(stats);
        });
        
        // Real-time art generation from game events
        this.app.post('/api/auto-generate', async (req, res) => {
            const { eventType, eventData } = req.body;
            
            // Queue automatic generation based on game events
            this.queueGeneration({
                trigger: eventType,
                data: eventData,
                timestamp: Date.now(),
                priority: this.getEventPriority(eventType)
            });
            
            res.json({ queued: true, position: this.generationQueue.length });
        });
    }
    
    async generateArt(gameState, playerData, artStyle) {
        const style = this.artStyles[artStyle];
        const artworkId = this.generateArtworkId(gameState, playerData, artStyle);
        
        // Check cache first
        if (this.artCache.has(artworkId)) {
            return this.artCache.get(artworkId);
        }
        
        console.log(`🎨 Generating ${artStyle} art...`);
        
        // Create canvas
        const [width, height] = style.resolution;
        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Generate art based on algorithm
        switch (style.algorithm) {
            case 'cellular_automata':
                await this.generateCellularAutomata(ctx, gameState, style);
                break;
            case 'fractal_noise':
                await this.generateFractalNoise(ctx, gameState, style);
                break;
            case 'flow_field':
                await this.generateFlowField(ctx, gameState, style);
                break;
            case 'dimensional_projection':
                await this.generateDimensionalProjection(ctx, gameState, style);
                break;
        }
        
        // Save image
        const imageBuffer = canvas.toBuffer('image/png');
        const imagePath = path.join(__dirname, 'nft-cache', `${artworkId}.png`);
        await fs.writeFile(imagePath, imageBuffer);
        
        // Analyze rarity and traits
        const traits = this.analyzeTraits(imageBuffer, gameState, playerData);
        const rarity = this.calculateRarity(traits);
        
        const artwork = {
            id: artworkId,
            imageUrl: `/nft-cache/${artworkId}.png`,
            imagePath,
            metadata: {
                name: `${this.collection.name} #${artworkId}`,
                description: `Generated from quantum game state at ${new Date().toISOString()}`,
                image: `${this.collection.baseTokenURI}image/${artworkId}`,
                attributes: traits,
                gameState: {
                    quantumCoherence: gameState.quantumCoherence || 0.5,
                    neuralActivity: gameState.neuralActivity || 0.3,
                    dimensionalDepth: gameState.dimensionalDepth || 4,
                    playerLevel: playerData?.level || 1
                }
            },
            traits,
            rarity,
            style: artStyle,
            generatedAt: new Date(),
            gameStateHash: this.hashGameState(gameState)
        };
        
        // Cache the artwork
        this.artCache.set(artworkId, artwork);
        
        console.log(`✅ Generated ${artStyle} art with rarity: ${rarity}`);
        return artwork;
    }
    
    async generateCellularAutomata(ctx, gameState, style) {
        const [width, height] = style.resolution;
        const grid = this.initializeGrid(width, height, gameState.quantumCoherence || 0.5);
        
        // Run cellular automata iterations
        const iterations = Math.floor((gameState.neuralActivity || 0.3) * 10) + 5;
        
        for (let i = 0; i < iterations; i++) {
            this.updateGrid(grid);
        }
        
        // Render grid with palette
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cellValue = grid[x][y];
                const colorIndex = Math.floor(cellValue * style.palette.length);
                ctx.fillStyle = style.palette[colorIndex];
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    async generateFractalNoise(ctx, gameState, style) {
        const [width, height] = style.resolution;
        const imageData = ctx.createImageData(width, height);
        
        const scale = (gameState.dimensionalDepth || 4) * 0.01;
        const octaves = Math.floor((gameState.quantumCoherence || 0.5) * 8) + 2;
        
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let value = 0;
                let amplitude = 1;
                let frequency = scale;
                
                // Multi-octave noise
                for (let i = 0; i < octaves; i++) {
                    value += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                value = (value + 1) / 2; // Normalize to 0-1
                
                const colorIndex = Math.floor(value * style.palette.length);
                const color = this.hexToRgb(style.palette[colorIndex]);
                
                const pixelIndex = (y * width + x) * 4;
                imageData.data[pixelIndex] = color.r;
                imageData.data[pixelIndex + 1] = color.g;
                imageData.data[pixelIndex + 2] = color.b;
                imageData.data[pixelIndex + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    async generateFlowField(ctx, gameState, style) {
        const [width, height] = style.resolution;
        const particles = [];
        const numParticles = Math.floor((gameState.neuralActivity || 0.3) * 5000) + 1000;
        
        // Initialize particles
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: 0,
                vy: 0,
                life: Math.random() * 100 + 50
            });
        }
        
        // Clear canvas
        ctx.fillStyle = style.palette[0];
        ctx.fillRect(0, 0, width, height);
        
        // Simulate flow field
        const flowScale = (gameState.quantumCoherence || 0.5) * 0.02;
        
        for (let step = 0; step < 200; step++) {
            particles.forEach((particle, i) => {
                if (particle.life <= 0) return;
                
                // Calculate flow field force
                const angle = this.noise(particle.x * flowScale, particle.y * flowScale) * Math.PI * 2;
                const force = (gameState.dimensionalDepth || 4) * 0.1;
                
                particle.vx += Math.cos(angle) * force;
                particle.vy += Math.sin(angle) * force;
                
                // Apply velocity
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Wrap around edges
                if (particle.x < 0) particle.x = width;
                if (particle.x > width) particle.x = 0;
                if (particle.y < 0) particle.y = height;
                if (particle.y > height) particle.y = 0;
                
                // Draw particle trail
                const alpha = particle.life / 100;
                const colorIndex = Math.floor(Math.random() * style.palette.length);
                ctx.strokeStyle = style.palette[colorIndex] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = alpha * 2;
                
                ctx.beginPath();
                ctx.moveTo(particle.x - particle.vx, particle.y - particle.vy);
                ctx.lineTo(particle.x, particle.y);
                ctx.stroke();
                
                particle.life--;
            });
        }
    }
    
    async generateDimensionalProjection(ctx, gameState, style) {
        // This is where it gets wild - projecting 4D+ shapes onto 2D
        const [width, height] = style.resolution;
        const dimensions = Math.min(gameState.dimensionalDepth || 4, 8);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Generate hypercube vertices in N dimensions
        const vertices = this.generateHypercubeVertices(dimensions);
        
        // Project to 2D with rotation based on game state
        const rotationMatrix = this.generateRotationMatrix(dimensions, gameState);
        const projectedVertices = vertices.map(vertex => 
            this.projectToScreen(this.rotateVertex(vertex, rotationMatrix), width, height)
        );
        
        // Draw edges with depth-based coloring
        const edges = this.getHypercubeEdges(dimensions);
        
        edges.forEach((edge, i) => {
            const [v1, v2] = edge;
            const start = projectedVertices[v1];
            const end = projectedVertices[v2];
            
            if (!start || !end) return;
            
            // Color based on edge position in higher dimensions
            const depth = (vertices[v1][dimensions - 1] + vertices[v2][dimensions - 1]) / 2;
            const colorIndex = Math.floor(((depth + 1) / 2) * style.palette.length);
            
            ctx.strokeStyle = style.palette[colorIndex];
            ctx.lineWidth = 2 + Math.abs(depth) * 3;
            ctx.globalAlpha = 0.7 + Math.abs(depth) * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });
        
        ctx.globalAlpha = 1;
    }
    
    analyzeTraits(imageBuffer, gameState, playerData) {
        // Analyze the generated image to extract traits
        const hash = createHash('sha256').update(imageBuffer).digest('hex');
        
        return [
            {
                trait_type: "Generation Hash",
                value: hash.substring(0, 8)
            },
            {
                trait_type: "Quantum Coherence",
                value: Math.floor((gameState.quantumCoherence || 0.5) * 100)
            },
            {
                trait_type: "Neural Activity", 
                value: Math.floor((gameState.neuralActivity || 0.3) * 100)
            },
            {
                trait_type: "Dimensional Depth",
                value: gameState.dimensionalDepth || 4
            },
            {
                trait_type: "Player Level",
                value: playerData?.level || 1
            },
            {
                trait_type: "Rarity Tier",
                value: this.getRarityTier(gameState)
            }
        ];
    }
    
    calculateRarity(traits) {
        // Calculate rarity score based on traits
        let rarityScore = 0;
        
        traits.forEach(trait => {
            switch (trait.trait_type) {
                case "Quantum Coherence":
                    if (trait.value > 90) rarityScore += 50;
                    else if (trait.value > 75) rarityScore += 25;
                    break;
                case "Dimensional Depth":
                    if (trait.value > 6) rarityScore += 40;
                    else if (trait.value > 4) rarityScore += 20;
                    break;
                case "Player Level":
                    rarityScore += Math.min(trait.value * 2, 100);
                    break;
            }
        });
        
        if (rarityScore > 150) return "Legendary";
        if (rarityScore > 100) return "Epic"; 
        if (rarityScore > 50) return "Rare";
        return "Common";
    }
    
    renderGalleryHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra NFT Gallery</title>
    <style>
        body { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
        }
        .header { text-align: center; margin-bottom: 40px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .nft-card { 
            background: rgba(0,0,0,0.8); 
            border-radius: 10px; 
            padding: 20px; 
            border: 2px solid #00ff88;
        }
        .nft-image { width: 100%; height: 250px; object-fit: cover; border-radius: 5px; }
        .generate-btn { 
            background: #00ff88; 
            color: black; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-weight: bold;
        }
        .mint-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 SOULFRA NFT GALLERY</h1>
        <p>Dynamic NFTs Generated from Quantum Game State</p>
        <button class="generate-btn" onclick="generateArt()">Generate New Art</button>
    </div>
    
    <div id="gallery" class="gallery">
        <!-- NFTs will be loaded here -->
    </div>
    
    <script>
        async function generateArt() {
            const gameState = {
                quantumCoherence: Math.random(),
                neuralActivity: Math.random(),
                dimensionalDepth: Math.floor(Math.random() * 8) + 3
            };
            
            const playerData = {
                id: 'player_' + Date.now(),
                level: Math.floor(Math.random() * 100) + 1
            };
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    gameState, 
                    playerData, 
                    artStyle: ['pixel-runez', 'quantum-depth', 'neural-flow', 'hyperdimensional'][Math.floor(Math.random() * 4)]
                })
            });
            
            const result = await response.json();
            if (result.success) {
                addNFTToGallery(result.artwork);
            }
        }
        
        function addNFTToGallery(artwork) {
            const gallery = document.getElementById('gallery');
            const card = document.createElement('div');
            card.className = 'nft-card';
            card.innerHTML = \`
                <img src="\${artwork.imageUrl}" class="nft-image" alt="\${artwork.metadata.name}">
                <h3>\${artwork.metadata.name}</h3>
                <p><strong>Rarity:</strong> \${artwork.rarity}</p>
                <p><strong>Style:</strong> \${artwork.metadata.gameState ? 'Quantum Generated' : 'Standard'}</p>
                <button class="mint-btn" onclick="mintNFT('\${artwork.id}')">Mint NFT</button>
            \`;
            gallery.appendChild(card);
        }
        
        async function mintNFT(artworkId) {
            const recipientAddress = prompt('Enter wallet address to mint to:');
            if (!recipientAddress) return;
            
            const response = await fetch('/api/mint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artworkId, recipientAddress })
            });
            
            const result = await response.json();
            if (result.success) {
                alert(\`NFT minted! Transaction: \${result.transaction}\`);
                window.open(result.opensea, '_blank');
            } else {
                alert(\`Minting failed: \${result.error}\`);
            }
        }
        
        // Load initial gallery
        window.onload = () => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => generateArt(), i * 1000);
            }
        };
    </script>
</body>
</html>`;
    }
    
    // Utility functions
    generateArtworkId(gameState, playerData, artStyle) {
        const data = JSON.stringify({ gameState, playerData, artStyle, timestamp: Date.now() });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    
    hashGameState(gameState) {
        return createHash('sha256').update(JSON.stringify(gameState)).digest('hex');
    }
    
    noise(x, y) {
        // Simple Perlin-like noise
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return 2 * (n - Math.floor(n)) - 1;
    }
    
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }
    
    initializeGrid(width, height, density) {
        const grid = [];
        for (let x = 0; x < width; x++) {
            grid[x] = [];
            for (let y = 0; y < height; y++) {
                grid[x][y] = Math.random() < density ? 1 : 0;
            }
        }
        return grid;
    }
    
    updateGrid(grid) {
        const width = grid.length;
        const height = grid[0].length;
        const newGrid = grid.map(row => [...row]);
        
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const neighbors = this.countNeighbors(grid, x, y);
                if (grid[x][y] === 1) {
                    newGrid[x][y] = neighbors === 2 || neighbors === 3 ? 1 : 0;
                } else {
                    newGrid[x][y] = neighbors === 3 ? 1 : 0;
                }
            }
        }
        
        // Copy newGrid back to grid
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                grid[x][y] = newGrid[x][y];
            }
        }
    }
    
    countNeighbors(grid, x, y) {
        let count = 0;
        const width = grid.length;
        const height = grid[0].length;
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = (x + dx + width) % width;
                const ny = (y + dy + height) % height;
                count += grid[nx][ny];
            }
        }
        return count;
    }
    
    generateHypercubeVertices(dimensions) {
        const vertices = [];
        const numVertices = Math.pow(2, dimensions);
        
        for (let i = 0; i < numVertices; i++) {
            const vertex = [];
            for (let d = 0; d < dimensions; d++) {
                vertex.push((i & (1 << d)) ? 1 : -1);
            }
            vertices.push(vertex);
        }
        
        return vertices;
    }
    
    generateRotationMatrix(dimensions, gameState) {
        // Simple rotation based on game state
        const angle = (gameState.quantumCoherence || 0.5) * Math.PI * 2;
        return angle; // Simplified for this example
    }
    
    rotateVertex(vertex, angle) {
        // Simplified rotation - in reality would be complex N-dimensional rotation
        const rotated = [...vertex];
        if (vertex.length >= 2) {
            const x = vertex[0];
            const y = vertex[1];
            rotated[0] = x * Math.cos(angle) - y * Math.sin(angle);
            rotated[1] = x * Math.sin(angle) + y * Math.cos(angle);
        }
        return rotated;
    }
    
    projectToScreen(vertex, width, height) {
        if (vertex.length < 2) return null;
        
        const scale = Math.min(width, height) * 0.3;
        const x = width / 2 + vertex[0] * scale;
        const y = height / 2 + vertex[1] * scale;
        
        return { x, y };
    }
    
    getHypercubeEdges(dimensions) {
        const edges = [];
        const numVertices = Math.pow(2, dimensions);
        
        for (let i = 0; i < numVertices; i++) {
            for (let j = i + 1; j < numVertices; j++) {
                // Two vertices are connected if they differ in exactly one bit
                let diff = i ^ j;
                let bitCount = 0;
                while (diff) {
                    bitCount += diff & 1;
                    diff >>= 1;
                }
                if (bitCount === 1) {
                    edges.push([i, j]);
                }
            }
        }
        
        return edges;
    }
    
    getRarityTier(gameState) {
        const score = (gameState.quantumCoherence || 0) + 
                     (gameState.neuralActivity || 0) + 
                     (gameState.dimensionalDepth || 0) / 10;
        
        if (score > 1.8) return "Mythic";
        if (score > 1.5) return "Legendary";
        if (score > 1.2) return "Epic";
        if (score > 0.8) return "Rare";
        return "Common";
    }
    
    async getCollectionStats() {
        return {
            totalSupply: this.artCache.size,
            uniqueOwners: this.artCache.size, // Simplified
            floorPrice: "0.1 ETH",
            volumeTraded: "12.5 ETH",
            rarityDistribution: {
                "Common": 60,
                "Rare": 25,
                "Epic": 10,
                "Legendary": 4,
                "Mythic": 1
            }
        };
    }
    
    async mintNFT(artwork, recipientAddress) {
        // In a real implementation, this would interact with an actual NFT contract
        console.log(`🪙 Minting NFT for artwork ${artwork.id} to ${recipientAddress}`);
        
        // Simulate blockchain transaction
        const mockTransaction = {
            transactionHash: '0x' + createHash('sha256').update(Date.now().toString()).digest('hex'),
            tokenId: Math.floor(Math.random() * 10000) + 1,
            contractAddress: process.env.NFT_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b8D6Ac73D5',
            blockNumber: Math.floor(Math.random() * 1000000) + 15000000
        };
        
        // Store minting record
        artwork.minted = {
            ...mockTransaction,
            recipient: recipientAddress,
            mintedAt: new Date()
        };
        
        return mockTransaction;
    }
    
    async getTokenMetadata(tokenId) {
        // Return OpenSea-compatible metadata
        return {
            name: `${this.collection.name} #${tokenId}`,
            description: this.collection.description,
            image: `${this.collection.baseTokenURI}image/${tokenId}`,
            external_url: `https://soulfra.com/nft/${tokenId}`,
            attributes: [
                { trait_type: "Rarity", value: "Epic" },
                { trait_type: "Generation", value: "Quantum" }
            ]
        };
    }
    
    setupWebSocket() {
        // WebSocket for real-time art generation from game events
        const WebSocket = require('ws');
        this.wss = new WebSocket.Server({ port: 3002 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 WebSocket client connected to NFT system');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    
                    if (message.type === 'GAME_EVENT') {
                        // Auto-generate art from game events
                        const artwork = await this.generateArt(
                            message.gameState,
                            message.playerData,
                            message.artStyle || 'quantum-depth'
                        );
                        
                        ws.send(JSON.stringify({
                            type: 'ART_GENERATED',
                            artwork
                        }));
                    }
                } catch (error) {
                    console.error('WebSocket error:', error);
                }
            });
        });
    }
    
    queueGeneration(request) {
        this.generationQueue.push(request);
        this.processQueue();
    }
    
    async processQueue() {
        if (this.processingQueue || this.generationQueue.length === 0) return;
        
        this.processingQueue = true;
        
        while (this.generationQueue.length > 0) {
            const request = this.generationQueue.shift();
            
            try {
                await this.generateArt(
                    request.data.gameState,
                    request.data.playerData,
                    request.data.artStyle || 'quantum-depth'
                );
                
                console.log(`✅ Auto-generated art from ${request.trigger} event`);
            } catch (error) {
                console.error(`❌ Failed to generate art from ${request.trigger}:`, error);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.processingQueue = false;
    }
    
    getEventPriority(eventType) {
        const priorities = {
            'LEVEL_UP': 10,
            'RARE_ITEM_FOUND': 8,
            'BOSS_DEFEATED': 9,
            'QUANTUM_ANOMALY': 10,
            'PLAYER_DEATH': 3,
            'TRADE_COMPLETED': 2
        };
        
        return priorities[eventType] || 1;
    }
    
    async start() {
        // Create necessary directories
        await fs.mkdir(path.join(__dirname, 'nft-cache'), { recursive: true });
        await fs.mkdir(path.join(__dirname, 'generative-art'), { recursive: true });
        
        this.app.listen(this.port, () => {
            console.log(`🎨 NFT Generative Art System running on port ${this.port}`);
            console.log(`🌐 Gallery: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:3002`);
            console.log(`⛓️  Collection: ${this.collection.name}`);
        });
    }
}

// Start the NFT system
if (require.main === module) {
    const nftSystem = new NFTGenerativeArtSystem();
    nftSystem.start().catch(console.error);
}

module.exports = NFTGenerativeArtSystem;
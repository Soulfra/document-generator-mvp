#!/usr/bin/env node

/**
 * DEEP TIER SERVICE - Genetic Character Generation Layer
 * Receives genetic hashes from RNG Layer (port 39000)
 * Processes through genetic decoder with temperature and quality controls
 * Connects to LINEAGE-STORYTELLER-ORCHESTRATOR for character spawning
 * Eliminates "Deep Tier not ready, using file stream" errors
 */

const http = require('http');
const fs = require('fs').promises;
const { GeneticDecoder } = require('./test-genetic-decoder.js');

class DeepTierService {
    constructor() {
        this.port = 40000; // Expected by RNG Layer
        this.geneticDecoder = new GeneticDecoder();
        this.approvedCharacters = new Map();
        this.spawnedClones = [];
        this.maxClones = 5; // Target: 5 elders/seraphim
        
        console.log('🧠 DEEP TIER SERVICE ACTIVATED');
        console.log('🔗 Ready to receive genetic hashes from RNG Layer');
        this.startDeepTierService();
    }

    async startDeepTierService() {
        // Create HTTP server to receive genetic stream from RNG Layer
        this.server = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/stream') {
                this.handleGeneticStream(req, res);
            } else if (req.method === 'GET' && req.url === '/') {
                this.serveDashboard(res);
            } else if (req.method === 'GET' && req.url === '/status') {
                this.serveStatus(res);
            } else if (req.method === 'GET' && req.url === '/characters') {
                this.serveCharacters(res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        this.server.listen(this.port, () => {
            console.log(`🧠 Deep Tier Service listening on http://localhost:${this.port}`);
            console.log('🚀 RNG Layer should now connect successfully');
        });

        // Start periodic clone spawning check
        setInterval(() => {
            this.checkForCloneSpawning();
        }, 5000); // Every 5 seconds
    }

    async handleGeneticStream(req, res) {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                const data = JSON.parse(body);
                
                console.log(`🧬 Received genetic data: ${data.hash || 'unknown'}`);
                await this.processGeneticHash(data);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'processed',
                    characters: this.approvedCharacters.size,
                    clones: this.spawnedClones.length
                }));
            });
            
        } catch (error) {
            console.error('💥 Error handling genetic stream:', error);
            res.writeHead(500);
            res.end('Internal Server Error');
        }
    }

    async processGeneticHash(data) {
        try {
            // Extract hash from RNG data structure
            const hash = data.verification?.hash || data.hash || data.verification_hash || data.rng_hash;
            if (!hash) {
                console.log('⚠️ No genetic hash found in data:', Object.keys(data));
                return;
            }

            // Determine parent hash for lineage tracking
            const parentHash = this.findParentHash(hash);
            
            // Process through genetic decoder
            const character = this.geneticDecoder.processCharacter(hash, parentHash);
            
            if (character) {
                // Store approved character
                this.approvedCharacters.set(hash, character);
                
                console.log(`✅ Character approved: ${character.lineage.toUpperCase()} (temp: ${character.temperature})`);
                
                // Connect to Lineage Orchestrator
                await this.sendToLineageOrchestrator(character);
                
                // Log for verification
                await this.logCharacterCreation(character);
            } else {
                console.log('❌ Character rejected by filters');
            }
            
        } catch (error) {
            console.error('💥 Error processing genetic hash:', error);
        }
    }

    findParentHash(currentHash) {
        // Find the most recently approved character to use as parent
        const approvedHashes = Array.from(this.approvedCharacters.keys());
        if (approvedHashes.length === 0) return null;
        
        // Return the last approved character's hash as parent
        return approvedHashes[approvedHashes.length - 1];
    }

    async sendToLineageOrchestrator(character) {
        try {
            // Create world event for the Lineage Orchestrator
            const worldEvent = {
                type: 'character_spawn',
                character: character,
                lineage: character.lineage,
                participants: [character],
                themes: ['birth', 'genetics', 'lineage'],
                timestamp: Date.now(),
                id: `spawn_${character.characterId}_${Date.now()}`
            };

            // If LineageStorytellerOrchestrator is available, process event
            if (global.lineageOrchestrator) {
                global.lineageOrchestrator.processWorldEvent(worldEvent);
                console.log('📚 Sent to Lineage Orchestrator');
            } else {
                console.log('📚 Lineage Orchestrator not loaded yet, storing event');
                // Store for later processing
                await this.storeWorldEvent(worldEvent);
            }
            
        } catch (error) {
            console.error('💥 Error sending to Lineage Orchestrator:', error);
        }
    }

    async storeWorldEvent(event) {
        try {
            const eventLog = {
                timestamp: Date.now(),
                event: event
            };
            
            await fs.appendFile('character-spawn-events.jsonl', 
                JSON.stringify(eventLog) + '\n');
                
        } catch (error) {
            console.error('💥 Error storing world event:', error);
        }
    }

    async logCharacterCreation(character) {
        try {
            const logEntry = {
                timestamp: Date.now(),
                characterId: character.characterId,
                hash: character.hash,
                lineage: character.lineage,
                generation: character.generation,
                parentHash: character.parentHash,
                temperature: character.temperature,
                holographic: character.holographic,
                traits: character.traits
            };

            await fs.appendFile('character-creation-log.jsonl', 
                JSON.stringify(logEntry) + '\n');
            
            console.log(`📝 Character logged: ${character.characterId}`);
            
        } catch (error) {
            console.error('💥 Error logging character:', error);
        }
    }

    checkForCloneSpawning() {
        if (this.spawnedClones.length >= this.maxClones) {
            return; // Already have 5 clones
        }

        const characters = Array.from(this.approvedCharacters.values());
        if (characters.length < 5) {
            return; // Need at least 5 approved characters to choose from
        }

        // Select best characters for clone spawning
        const elders = this.selectElders(characters);
        
        elders.forEach(character => {
            if (!this.spawnedClones.find(c => c.hash === character.hash)) {
                this.spawnClone(character);
            }
        });
    }

    selectElders(characters) {
        // Sort by a combination of temperature and mysticism (most powerful)
        const scored = characters.map(char => ({
            ...char,
            elderScore: (char.temperature * 0.6) + (char.traits.mysticism * 0.4)
        }));

        // Sort by elder score and lineage diversity
        scored.sort((a, b) => b.elderScore - a.elderScore);

        // Ensure lineage diversity - pick one of each lineage, then best overall
        const elders = [];
        const lineagesSeen = new Set();
        
        // First pass: one of each lineage
        for (const character of scored) {
            if (!lineagesSeen.has(character.lineage) && elders.length < 4) {
                elders.push(character);
                lineagesSeen.add(character.lineage);
            }
        }
        
        // Second pass: add highest scoring remaining character
        for (const character of scored) {
            if (!elders.find(e => e.hash === character.hash) && elders.length < 5) {
                elders.push(character);
                break;
            }
        }

        return elders.slice(0, 5); // Maximum 5 elders
    }

    spawnClone(character) {
        const clone = {
            ...character,
            cloneId: `clone_${this.spawnedClones.length + 1}`,
            elderStatus: true,
            spawnedAt: Date.now()
        };

        this.spawnedClones.push(clone);
        
        console.log(`👑 ELDER SPAWNED: ${clone.lineage.toUpperCase()} (${clone.cloneId})`);
        console.log(`🧬 Genetic Source: ${clone.hash}`);
        console.log(`📊 Elder Score: ${clone.elderScore?.toFixed(2) || 'N/A'}`);
        console.log(`👥 Total Clones: ${this.spawnedClones.length}/${this.maxClones}`);
    }

    serveDashboard(res) {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Deep Tier Service Dashboard</title>
            <style>
                body { font-family: monospace; background: #111; color: #0f0; padding: 20px; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
                .stat { background: #222; padding: 15px; border: 1px solid #0f0; }
                .character { background: #333; margin: 10px 0; padding: 10px; border-left: 3px solid #0f0; }
                .clone { border-left-color: #f0f; background: #443; }
            </style>
        </head>
        <body>
            <h1>🧠 Deep Tier Service Dashboard</h1>
            <div class="stats">
                <div class="stat">
                    <h3>📊 Statistics</h3>
                    <p>Approved Characters: ${this.approvedCharacters.size}</p>
                    <p>Spawned Clones: ${this.spawnedClones.length}/${this.maxClones}</p>
                    <p>Status: ${'Running'}</p>
                </div>
            </div>
            
            <h2>👑 Spawned Elders/Seraphim</h2>
            ${this.spawnedClones.map(clone => `
                <div class="character clone">
                    <strong>${clone.cloneId}: ${clone.lineage.toUpperCase()}</strong><br>
                    Hash: ${clone.hash}<br>
                    Temperature: ${clone.temperature}, Holographic: ${clone.holographic}<br>
                    Traits: STR:${clone.traits.strength} INT:${clone.traits.intelligence} AGI:${clone.traits.agility} MYS:${clone.traits.mysticism}
                </div>
            `).join('')}
            
            <h2>✅ Approved Characters</h2>
            ${Array.from(this.approvedCharacters.values()).slice(-10).map(char => `
                <div class="character">
                    <strong>${char.characterId}: ${char.lineage.toUpperCase()}</strong><br>
                    Hash: ${char.hash}<br>
                    Temperature: ${char.temperature}, Holographic: ${char.holographic}<br>
                    Traits: STR:${char.traits.strength} INT:${char.traits.intelligence} AGI:${char.traits.agility} MYS:${char.traits.mysticism}
                </div>
            `).join('')}
            
            <script>
                setInterval(() => location.reload(), 10000); // Refresh every 10 seconds
            </script>
        </body>
        </html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }

    serveStatus(res) {
        const status = {
            service: 'Deep Tier',
            port: this.port,
            status: 'running',
            characters: {
                approved: this.approvedCharacters.size,
                clones: this.spawnedClones.length,
                maxClones: this.maxClones
            },
            timestamp: Date.now()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }

    serveCharacters(res) {
        const characters = {
            approved: Array.from(this.approvedCharacters.values()),
            clones: this.spawnedClones
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(characters, null, 2));
    }
}

// Start the service
if (require.main === module) {
    const deepTier = new DeepTierService();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Deep Tier Service...');
        deepTier.server?.close();
        process.exit(0);
    });
}

module.exports = { DeepTierService };
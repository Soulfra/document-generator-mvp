#!/usr/bin/env node

/**
 * STORY CRAWLER ENGINE
 * Web crawling presented as exploration quests
 * Data gathering becomes treasure hunting
 * API calls become character dialogues
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class StoryCrawlerEngine extends EventEmitter {
    constructor() {
        super();
        
        // Exploration state
        this.explorationState = {
            currentLocation: 'village_square',
            visitedLocations: new Set(['village_square']),
            treasuresFound: [],
            monstersEncountered: [],
            npcsMetn: [],
            mapProgress: 0
        };
        
        // Location types (URLs become locations)
        this.locationTypes = {
            'homepage': {
                narrative: 'Town Square',
                description: 'The bustling center where all paths begin',
                treasureChance: 0.3,
                monsterChance: 0.1
            },
            'api_endpoint': {
                narrative: 'Ancient Library',
                description: 'Scrolls of knowledge await those who speak the right words',
                treasureChance: 0.8,
                monsterChance: 0.2
            },
            'form_page': {
                narrative: 'Gatekeeper\'s Post',
                description: 'Answer correctly to pass through',
                treasureChance: 0.4,
                monsterChance: 0.3
            },
            'search_page': {
                narrative: 'Oracle\'s Chamber',
                description: 'Ask your questions, receive cryptic answers',
                treasureChance: 0.6,
                monsterChance: 0.2
            },
            'error_page': {
                narrative: 'Dark Alley',
                description: 'You\'ve wandered into dangerous territory',
                treasureChance: 0.1,
                monsterChance: 0.8
            },
            'media_content': {
                narrative: 'Art Gallery',
                description: 'Beautiful visions and moving pictures',
                treasureChance: 0.5,
                monsterChance: 0.1
            }
        };
        
        // Treasure types (data becomes treasure)
        this.treasureTypes = {
            'json_data': {
                name: 'Crystal of Knowledge',
                value: 100,
                description: 'Perfectly structured information'
            },
            'api_key': {
                name: 'Golden Key',
                value: 1000,
                description: 'Opens doors to secret chambers'
            },
            'user_data': {
                name: 'Soul Gem',
                value: 500,
                description: 'Contains the essence of a visitor'
            },
            'configuration': {
                name: 'Ancient Scroll',
                value: 300,
                description: 'Instructions for controlling the realm'
            },
            'media_file': {
                name: 'Enchanted Portrait',
                value: 200,
                description: 'A captured moment in time'
            }
        };
        
        // Monster types (errors and blocks become monsters)
        this.monsterTypes = {
            '404': {
                name: 'Lost Spirit',
                description: 'Wanders endlessly, never finding home',
                difficulty: 'easy',
                loot: { xp: 10, gold: 5 }
            },
            '403': {
                name: 'Guardian Golem',
                description: 'Blocks your path with stony resolve',
                difficulty: 'medium',
                loot: { xp: 25, gold: 15 }
            },
            '500': {
                name: 'Chaos Demon',
                description: 'Server instability made manifest',
                difficulty: 'hard',
                loot: { xp: 50, gold: 30 }
            },
            'rate_limit': {
                name: 'Time Warden',
                description: 'Punishes those who move too quickly',
                difficulty: 'medium',
                loot: { xp: 30, gold: 20 }
            },
            'captcha': {
                name: 'Riddle Sphinx',
                description: 'Prove you\'re human to pass',
                difficulty: 'hard',
                loot: { xp: 40, gold: 25 }
            }
        };
        
        // NPC types (APIs become characters)
        this.npcTypes = {
            'rest_api': {
                name: 'Data Merchant',
                personality: 'Precise and transactional',
                dialogue: {
                    greeting: 'State your request precisely, traveler.',
                    success: 'Here is what you seek. Use it wisely.',
                    failure: 'Your request is malformed. Try again.'
                }
            },
            'graphql': {
                name: 'Query Sage',
                personality: 'Flexible but demanding',
                dialogue: {
                    greeting: 'Ask for exactly what you need, nothing more.',
                    success: 'Your query has been fulfilled perfectly.',
                    failure: 'Your query structure confuses me.'
                }
            },
            'websocket': {
                name: 'Stream Keeper',
                personality: 'Constantly chattering',
                dialogue: {
                    greeting: 'Stay a while and listen to the flow of data!',
                    success: 'The stream flows endlessly for you.',
                    failure: 'The connection has been severed!'
                }
            }
        };
        
        // Quest objectives (crawling goals)
        this.questObjectives = {
            'data_harvest': {
                name: 'Harvest of Knowledge',
                description: 'Collect 10 data treasures',
                progress: 0,
                target: 10,
                reward: { xp: 500, title: 'Data Harvester' }
            },
            'monster_slayer': {
                name: 'Error Slayer',
                description: 'Defeat 5 error monsters',
                progress: 0,
                target: 5,
                reward: { xp: 300, title: 'Bug Hunter' }
            },
            'social_butterfly': {
                name: 'API Whisperer',
                description: 'Successfully interact with 3 different NPCs',
                progress: 0,
                target: 3,
                reward: { xp: 400, title: 'API Master' }
            },
            'cartographer': {
                name: 'Map the Realm',
                description: 'Visit 20 unique locations',
                progress: 0,
                target: 20,
                reward: { xp: 600, title: 'Web Cartographer' }
            }
        };
        
        // Initialize engine
        this.initializeEngine();
    }
    
    async initializeEngine() {
        console.log('🗺️  STORY CRAWLER ENGINE INITIALIZED');
        console.log('📍 Starting location:', this.explorationState.currentLocation);
        console.log('🎯 Active quests:', Object.keys(this.questObjectives).length);
        
        // Set up event handlers
        this.on('location_discovered', this.handleLocationDiscovery.bind(this));
        this.on('treasure_found', this.handleTreasureFound.bind(this));
        this.on('monster_encountered', this.handleMonsterEncounter.bind(this));
        this.on('npc_interaction', this.handleNPCInteraction.bind(this));
    }
    
    /**
     * Main crawling function wrapped in narrative
     */
    async exploreLocation(url, options = {}) {
        console.log(`\n🚶 BEGINNING EXPLORATION TO: ${url}`);
        
        // Parse URL to determine location type
        const location = this.urlToLocation(url);
        console.log(`📍 You arrive at: ${location.narrative}`);
        console.log(`📜 ${location.description}`);
        
        // Check if we've been here before
        if (this.explorationState.visitedLocations.has(url)) {
            console.log('💭 This place seems familiar...');
        } else {
            this.explorationState.visitedLocations.add(url);
            this.emit('location_discovered', { url, location });
        }
        
        // Attempt to explore (make HTTP request)
        try {
            const explorationResult = await this.performExploration(url, options);
            
            // Determine what we found
            const discoveries = await this.analyzeDiscoveries(explorationResult, location);
            
            // Narrate the discoveries
            await this.narrateDiscoveries(discoveries);
            
            // Update quest progress
            await this.updateQuestProgress(discoveries);
            
            return {
                success: true,
                location,
                discoveries,
                narrative: this.generateExplorationSummary(discoveries)
            };
            
        } catch (error) {
            // Errors become monster encounters
            const monster = this.errorToMonster(error);
            console.log(`\n⚔️  MONSTER ENCOUNTERED: ${monster.name}!`);
            console.log(`👹 ${monster.description}`);
            
            this.emit('monster_encountered', { monster, location });
            
            return {
                success: false,
                location,
                monster,
                narrative: `Defeated by ${monster.name} at ${location.narrative}`
            };
        }
    }
    
    /**
     * Convert URL to narrative location
     */
    urlToLocation(url) {
        const parsedUrl = new URL(url);
        
        // Determine location type based on URL patterns
        if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
            return this.locationTypes.homepage;
        } else if (parsedUrl.pathname.includes('/api/')) {
            return this.locationTypes.api_endpoint;
        } else if (parsedUrl.pathname.includes('search')) {
            return this.locationTypes.search_page;
        } else if (parsedUrl.pathname.includes('form') || parsedUrl.pathname.includes('login')) {
            return this.locationTypes.form_page;
        } else if (parsedUrl.pathname.match(/\.(jpg|png|gif|mp4|webm)/i)) {
            return this.locationTypes.media_content;
        } else {
            // Random location type
            const types = Object.values(this.locationTypes);
            return types[Math.floor(Math.random() * types.length)];
        }
    }
    
    /**
     * Perform actual HTTP exploration
     */
    async performExploration(url, options) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'Story-Crawler-Engine/1.0 (Narrative Web Explorer)',
                    ...options.headers
                }
            };
            
            const req = protocol.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data,
                        url: url
                    });
                });
            });
            
            req.on('error', reject);
            req.end();
        });
    }
    
    /**
     * Analyze what we discovered during exploration
     */
    async analyzeDiscoveries(result, location) {
        const discoveries = {
            treasures: [],
            npcs: [],
            links: [],
            clues: []
        };
        
        // Check for treasures based on content
        if (result.headers['content-type']?.includes('application/json')) {
            discoveries.treasures.push({
                type: 'json_data',
                ...this.treasureTypes.json_data,
                data: result.body
            });
        }
        
        // Look for API endpoints (NPCs)
        if (result.body.includes('api') || result.body.includes('endpoint')) {
            discoveries.npcs.push({
                type: 'rest_api',
                ...this.npcTypes.rest_api
            });
        }
        
        // Extract links for further exploration
        const linkRegex = /href=["']([^"']+)["']/g;
        let match;
        while ((match = linkRegex.exec(result.body)) !== null) {
            discoveries.links.push(match[1]);
        }
        
        // Random treasure chance based on location
        if (Math.random() < location.treasureChance) {
            const treasureType = Object.keys(this.treasureTypes)[
                Math.floor(Math.random() * Object.keys(this.treasureTypes).length)
            ];
            discoveries.treasures.push({
                type: treasureType,
                ...this.treasureTypes[treasureType]
            });
        }
        
        return discoveries;
    }
    
    /**
     * Convert errors to monster encounters
     */
    errorToMonster(error) {
        if (error.code === 'ENOTFOUND') {
            return {
                ...this.monsterTypes['404'],
                originalError: error
            };
        } else if (error.code === 'ECONNREFUSED') {
            return {
                ...this.monsterTypes['403'],
                originalError: error
            };
        } else if (error.message?.includes('rate limit')) {
            return {
                ...this.monsterTypes.rate_limit,
                originalError: error
            };
        } else {
            return {
                ...this.monsterTypes['500'],
                originalError: error
            };
        }
    }
    
    /**
     * Narrate discoveries in story form
     */
    async narrateDiscoveries(discoveries) {
        if (discoveries.treasures.length > 0) {
            console.log('\n✨ TREASURES FOUND:');
            discoveries.treasures.forEach(treasure => {
                console.log(`  💎 ${treasure.name} (Value: ${treasure.value} gold)`);
                console.log(`     "${treasure.description}"`);
                this.emit('treasure_found', treasure);
            });
        }
        
        if (discoveries.npcs.length > 0) {
            console.log('\n👤 NPCS ENCOUNTERED:');
            discoveries.npcs.forEach(npc => {
                console.log(`  🗣️  ${npc.name}: "${npc.dialogue.greeting}"`);
                this.emit('npc_interaction', npc);
            });
        }
        
        if (discoveries.links.length > 0) {
            console.log(`\n🚪 PATHS DISCOVERED: ${discoveries.links.length} new routes to explore`);
        }
    }
    
    /**
     * Update quest progress based on discoveries
     */
    async updateQuestProgress(discoveries) {
        // Data harvest quest
        if (discoveries.treasures.length > 0) {
            this.questObjectives.data_harvest.progress += discoveries.treasures.length;
            if (this.questObjectives.data_harvest.progress >= this.questObjectives.data_harvest.target) {
                console.log(`\n🎉 QUEST COMPLETE: ${this.questObjectives.data_harvest.name}!`);
            }
        }
        
        // Cartographer quest
        this.questObjectives.cartographer.progress = this.explorationState.visitedLocations.size;
        if (this.questObjectives.cartographer.progress >= this.questObjectives.cartographer.target) {
            console.log(`\n🎉 QUEST COMPLETE: ${this.questObjectives.cartographer.name}!`);
        }
    }
    
    /**
     * Handle location discovery event
     */
    handleLocationDiscovery(event) {
        this.explorationState.mapProgress++;
        console.log(`📍 New location added to map! (${this.explorationState.mapProgress} total)`);
    }
    
    /**
     * Handle treasure found event
     */
    handleTreasureFound(treasure) {
        this.explorationState.treasuresFound.push(treasure);
    }
    
    /**
     * Handle monster encounter event
     */
    handleMonsterEncounter(event) {
        this.explorationState.monstersEncountered.push(event.monster);
        this.questObjectives.monster_slayer.progress++;
    }
    
    /**
     * Handle NPC interaction event
     */
    handleNPCInteraction(npc) {
        if (!this.explorationState.npcsMetn.find(n => n.type === npc.type)) {
            this.explorationState.npcsMetn.push(npc);
            this.questObjectives.social_butterfly.progress++;
        }
    }
    
    /**
     * Generate exploration summary
     */
    generateExplorationSummary(discoveries) {
        const treasureCount = discoveries.treasures.length;
        const npcCount = discoveries.npcs.length;
        const pathCount = discoveries.links.length;
        
        let summary = 'Your exploration ';
        
        if (treasureCount > 0) {
            summary += `yielded ${treasureCount} treasure${treasureCount > 1 ? 's' : ''} `;
        }
        
        if (npcCount > 0) {
            summary += `and you met ${npcCount} character${npcCount > 1 ? 's' : ''} `;
        }
        
        if (pathCount > 0) {
            summary += `discovering ${pathCount} new path${pathCount > 1 ? 's' : ''} to explore`;
        }
        
        if (treasureCount === 0 && npcCount === 0 && pathCount === 0) {
            summary += 'revealed little of interest, but the journey continues';
        }
        
        return summary + '.';
    }
    
    /**
     * Get current exploration state
     */
    getExplorationState() {
        return {
            ...this.explorationState,
            questProgress: Object.entries(this.questObjectives).map(([id, quest]) => ({
                id,
                name: quest.name,
                progress: `${quest.progress}/${quest.target}`,
                completed: quest.progress >= quest.target
            }))
        };
    }
    
    /**
     * Generate exploration report
     */
    generateExplorationReport() {
        console.log('\n📊 EXPLORATION REPORT\n');
        console.log('🗺️  LOCATIONS VISITED:', this.explorationState.visitedLocations.size);
        console.log('💎 TREASURES FOUND:', this.explorationState.treasuresFound.length);
        console.log('⚔️  MONSTERS ENCOUNTERED:', this.explorationState.monstersEncountered.length);
        console.log('👥 NPCS MET:', this.explorationState.npcsMetn.length);
        
        console.log('\n🎯 QUEST PROGRESS:');
        Object.entries(this.questObjectives).forEach(([id, quest]) => {
            const percentage = Math.floor((quest.progress / quest.target) * 100);
            console.log(`  ${quest.name}: ${percentage}% (${quest.progress}/${quest.target})`);
        });
        
        // Calculate total value
        const totalValue = this.explorationState.treasuresFound.reduce((sum, t) => sum + t.value, 0);
        console.log(`\n💰 TOTAL TREASURE VALUE: ${totalValue} gold`);
        
        return {
            locationsVisited: this.explorationState.visitedLocations.size,
            treasuresFound: this.explorationState.treasuresFound.length,
            totalValue,
            questsCompleted: Object.values(this.questObjectives).filter(q => q.progress >= q.target).length
        };
    }
}

// Export for use in other systems
module.exports = StoryCrawlerEngine;

// Demo functionality
if (require.main === module) {
    async function runDemo() {
        console.log('🎮 STORY CRAWLER ENGINE DEMO\n');
        
        const crawler = new StoryCrawlerEngine();
        
        // Demo URLs to explore (narrative style)
        const locations = [
            'https://api.github.com/users/octocat',
            'https://httpbin.org/json',
            'https://jsonplaceholder.typicode.com/posts/1',
            'https://example.com/404', // This will fail and create a monster
            'https://httpbin.org/delay/2'
        ];
        
        console.log('🗺️  Your adventure begins! You have several locations marked on your map...\n');
        
        for (const url of locations) {
            console.log(`\n${'='.repeat(60)}`);
            try {
                const result = await crawler.exploreLocation(url);
                console.log('\n📜 Summary:', result.narrative);
            } catch (error) {
                console.log('\n❌ Exploration failed:', error.message);
            }
            
            // Small delay for narrative pacing
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Generate final report
        console.log(`\n${'='.repeat(60)}`);
        crawler.generateExplorationReport();
        
        console.log('\n✨ Your exploration adventure concludes... for now!');
    }
    
    runDemo().catch(console.error);
}
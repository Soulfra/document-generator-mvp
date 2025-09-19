#!/usr/bin/env node

/**
 * 🎭📢 DEATHTODATA CHARACTER FORUMS
 * Each crawler/centipede gets their own private and public phpBB forum
 * Like each OSRS player having their own clan chat
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const MatrixPhpBBControlPanel = require('./matrix-phpbb-control-panel');

class DeathtodataCharacterForums extends EventEmitter {
    constructor() {
        super();
        
        console.log('🎭📢 DEATHTODATA CHARACTER FORUMS');
        console.log('==================================');
        console.log('Every crawler gets their own forum');
        console.log('Private for strategy, public for show');
        console.log('');
        
        // Master forum system
        this.masterForum = new MatrixPhpBBControlPanel();
        
        // Character-specific forums
        this.characterForums = new Map();
        
        // Forum templates
        this.forumTemplates = {
            private: {
                boards: {
                    'personal-log': {
                        name: '📝 Personal Search Log',
                        description: 'Private thoughts and discoveries',
                        visibility: 'private',
                        rules: 'Your eyes only. Be honest.'
                    },
                    'strategy-notes': {
                        name: '🎯 Strategy & Tactics',
                        description: 'Plans for upcoming raids',
                        visibility: 'private',
                        rules: 'Document what works.'
                    },
                    'loot-tracker': {
                        name: '💰 Loot & Rewards',
                        description: 'Track your earnings',
                        visibility: 'private',
                        rules: 'Every coin counts.'
                    },
                    'death-log': {
                        name: '💀 Death Analysis',
                        description: 'Learn from failures',
                        visibility: 'private',
                        rules: 'No shame in death, only in not learning.'
                    }
                }
            },
            public: {
                boards: {
                    'achievements': {
                        name: '🏆 Achievements',
                        description: 'Show off your victories',
                        visibility: 'public',
                        rules: 'Brag responsibly.'
                    },
                    'raid-stories': {
                        name: '⚔️ Epic Raid Stories',
                        description: 'Share your adventures',
                        visibility: 'public',
                        rules: 'Make it entertaining.'
                    },
                    'trade-offers': {
                        name: '🤝 Trade & Exchange',
                        description: 'Offer trades with other crawlers',
                        visibility: 'public',
                        rules: 'Fair trades only.'
                    },
                    'clan-recruitment': {
                        name: '👥 Join My Raids',
                        description: 'Recruit for group raids',
                        visibility: 'public',
                        rules: 'Team players wanted.'
                    }
                }
            }
        };
        
        // Wiki structure for documentation
        this.wikiStructure = {
            'raid-mechanics': {
                title: '⚔️ Raid Mechanics Guide',
                sections: [
                    'Basic Search Raids',
                    'Boss Phases Explained',
                    'BPM Risk/Reward System',
                    'Death and Respawn',
                    'Loot Distribution'
                ]
            },
            'search-api': {
                title: '🔍 Search API Documentation',
                sections: [
                    'Query Syntax',
                    'Advanced Operators',
                    'Emoji Encoding',
                    'Response Formats',
                    'Rate Limits'
                ]
            },
            'crawler-guide': {
                title: '🤖 Crawler Agent Guide',
                sections: [
                    'Creating Your Agent',
                    'Leveling System',
                    'Skills and Abilities',
                    'Equipment and Upgrades',
                    'Trading System'
                ]
            },
            'boss-compendium': {
                title: '👹 Boss Compendium',
                sections: [
                    'URL Boss Types',
                    'Attack Patterns',
                    'Weakness Analysis',
                    'Recommended Strategies',
                    'Loot Tables'
                ]
            }
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing Character Forums...\n');
        
        try {
            // Initialize master forum
            await this.masterForum.initialize();
            
            // Create wiki sections
            await this.createWiki();
            
            console.log('✅ Character Forums system ready!');
            this.emit('forums:ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    async createCharacterForum(characterData) {
        console.log(`\n📢 Creating forums for ${characterData.name}...`);
        
        const forumId = characterData.id || crypto.randomUUID();
        
        const characterForum = {
            id: forumId,
            character: characterData,
            private: this.createForumStructure('private', characterData),
            public: this.createForumStructure('public', characterData),
            stats: {
                totalPosts: 0,
                privatePosts: 0,
                publicPosts: 0,
                lastActivity: Date.now()
            },
            createdAt: Date.now()
        };
        
        this.characterForums.set(forumId, characterForum);
        
        // Create welcome posts
        await this.createWelcomePosts(characterForum);
        
        console.log(`  ✅ Private forum created: ${characterData.name}-private`);
        console.log(`  ✅ Public forum created: ${characterData.name}-public`);
        
        this.emit('forum:created', {
            characterId: forumId,
            character: characterData
        });
        
        return characterForum;
    }
    
    createForumStructure(type, characterData) {
        const template = this.forumTemplates[type];
        const boards = {};
        
        for (const [boardId, boardTemplate] of Object.entries(template.boards)) {
            boards[boardId] = {
                ...boardTemplate,
                posts: [],
                lastPost: null,
                moderator: characterData.name,
                characterId: characterData.id
            };
        }
        
        return {
            type: type,
            name: `${characterData.name}'s ${type} forum`,
            boards: boards,
            members: type === 'private' ? [characterData.id] : [], // Public forums have open membership
            banned: [],
            settings: {
                allowGuests: type === 'public',
                requireApproval: false,
                postCooldown: 5000, // 5 seconds between posts
                maxPostLength: 5000
            }
        };
    }
    
    async createWelcomePosts(characterForum) {
        const character = characterForum.character;
        
        // Private forum welcome post
        await this.createPost(characterForum.id, 'private', 'personal-log', {
            author: character.name,
            subject: 'My Search Journey Begins',
            content: `This is my private search log. Here I'll document my raids, discoveries, and strategies.\n\n` +
                    `Starting stats:\n` +
                    `- Level: ${character.level || 1}\n` +
                    `- Strategy: ${character.strategy || 'explorer'}\n` +
                    `- Starting balance: ${character.wallet?.balance || 100}\n\n` +
                    `Let the raids begin!`,
            sticky: true
        });
        
        // Public forum welcome post
        await this.createPost(characterForum.id, 'public', 'achievements', {
            author: character.name,
            subject: `${character.name} has entered the search arena!`,
            content: `Greetings fellow crawlers! I'm ${character.name}, ` +
                    `a ${character.strategy || 'explorer'} type agent ready to raid the web!\n\n` +
                    `Looking forward to sharing victories and forming raid parties.\n\n` +
                    `May the search odds be ever in your favor! ${character.searchCapabilities?.emoji || '🤖'}`,
            sticky: true
        });
    }
    
    async createPost(characterId, forumType, boardId, postData) {
        const forum = this.characterForums.get(characterId);
        if (!forum) {
            throw new Error(`Forum not found for character: ${characterId}`);
        }
        
        const forumSection = forum[forumType];
        const board = forumSection.boards[boardId];
        
        if (!board) {
            throw new Error(`Board not found: ${boardId} in ${forumType} forum`);
        }
        
        const post = {
            id: crypto.randomUUID(),
            author: postData.author,
            authorId: postData.authorId || characterId,
            subject: postData.subject,
            content: postData.content,
            timestamp: Date.now(),
            edited: null,
            sticky: postData.sticky || false,
            locked: postData.locked || false,
            replies: [],
            views: 0,
            likes: 0
        };
        
        board.posts.push(post);
        board.lastPost = post;
        
        // Update stats
        forum.stats.totalPosts++;
        forum.stats[`${forumType}Posts`]++;
        forum.stats.lastActivity = Date.now();
        
        console.log(`  📝 Post created in ${forumType}/${boardId}: "${post.subject}"`);
        
        this.emit('post:created', {
            characterId,
            forumType,
            boardId,
            post
        });
        
        return post;
    }
    
    async createReply(characterId, forumType, boardId, postId, replyData) {
        const forum = this.characterForums.get(characterId);
        if (!forum) throw new Error(`Forum not found for character: ${characterId}`);
        
        const board = forum[forumType].boards[boardId];
        const post = board.posts.find(p => p.id === postId);
        
        if (!post) throw new Error(`Post not found: ${postId}`);
        
        const reply = {
            id: crypto.randomUUID(),
            author: replyData.author,
            authorId: replyData.authorId,
            content: replyData.content,
            timestamp: Date.now(),
            edited: null
        };
        
        post.replies.push(reply);
        board.lastPost = { ...post, lastReply: reply };
        
        forum.stats.totalPosts++;
        forum.stats.lastActivity = Date.now();
        
        return reply;
    }
    
    async createRaidReport(characterId, raidData) {
        // Post raid results to both private and public forums
        
        // Private detailed analysis
        await this.createPost(characterId, 'private', 'personal-log', {
            author: raidData.characterName,
            subject: `Raid Report: ${raidData.query}`,
            content: `Raid completed at ${new Date().toISOString()}\n\n` +
                    `Target: ${raidData.query}\n` +
                    `Duration: ${raidData.duration}ms\n` +
                    `Phases completed: ${raidData.phasesCompleted}/${raidData.totalPhases}\n` +
                    `Damage dealt: ${raidData.damageDealt}\n` +
                    `BPM reached: ${raidData.maxBPM}\n` +
                    `Deaths: ${raidData.deaths}\n\n` +
                    `Discoveries:\n${raidData.discoveries.map(d => `- ${d}`).join('\n')}\n\n` +
                    `Lessons learned: ${raidData.lessons || 'Still analyzing...'}`
        });
        
        // Public brag post (if successful)
        if (raidData.success) {
            await this.createPost(characterId, 'public', 'raid-stories', {
                author: raidData.characterName,
                subject: `💀 BOSS DEFEATED: ${raidData.query}`,
                content: `Just demolished a ${raidData.difficulty} difficulty boss!\n\n` +
                        `Boss: ${raidData.query}\n` +
                        `Time: ${Math.round(raidData.duration / 1000)} seconds\n` +
                        `Max BPM: ${raidData.maxBPM} 🎵\n` +
                        `Deaths: ${raidData.deaths} (${raidData.deaths === 0 ? 'FLAWLESS!' : 'but I persevered!')}\n\n` +
                        `${raidData.epicMoment || 'Another boss bites the dust!'}`
            });
        }
    }
    
    async createDeathLog(characterId, deathData) {
        await this.createPost(characterId, 'private', 'death-log', {
            author: deathData.characterName,
            subject: `Death #${deathData.deathCount}: ${deathData.cause}`,
            content: `Died at ${new Date().toISOString()}\n\n` +
                    `Location: ${deathData.location}\n` +
                    `BPM at death: ${deathData.bpm}\n` +
                    `Death chance was: ${deathData.deathChance}%\n` +
                    `Lost rewards: ${deathData.lostRewards}\n\n` +
                    `What went wrong: ${deathData.analysis}\n` +
                    `Next time: ${deathData.improvement}`
        });
    }
    
    async createTradeOffer(characterId, tradeData) {
        await this.createPost(characterId, 'public', 'trade-offers', {
            author: tradeData.characterName,
            subject: `[${tradeData.type}] ${tradeData.title}`,
            content: `${tradeData.type === 'WTS' ? 'Selling' : tradeData.type === 'WTB' ? 'Buying' : 'Trading'}:\n\n` +
                    `Item: ${tradeData.item}\n` +
                    `Quantity: ${tradeData.quantity}\n` +
                    `Price: ${tradeData.price}\n\n` +
                    `${tradeData.description || 'PM me for details!'}\n\n` +
                    `Contact: @${tradeData.characterName}`
        });
    }
    
    async createWiki() {
        console.log('📚 Creating wiki documentation...');
        
        for (const [sectionId, section] of Object.entries(this.wikiStructure)) {
            // Create wiki board in master forum
            this.masterForum.boards[`wiki-${sectionId}`] = {
                name: section.title,
                description: 'Official documentation',
                posts: [],
                lastPost: null,
                moderator: 'SYSTEM',
                rules: 'Read-only reference material'
            };
            
            // Create section posts
            for (const subsection of section.sections) {
                const post = {
                    id: crypto.randomUUID(),
                    author: 'WikiBot',
                    subject: subsection,
                    content: this.generateWikiContent(sectionId, subsection),
                    timestamp: Date.now(),
                    sticky: true,
                    locked: true,
                    replies: [],
                    views: 0
                };
                
                this.masterForum.boards[`wiki-${sectionId}`].posts.push(post);
            }
            
            console.log(`  ✅ Wiki section created: ${section.title}`);
        }
    }
    
    generateWikiContent(sectionId, subsection) {
        // Generate appropriate wiki content based on section
        const content = {
            'raid-mechanics': {
                'Basic Search Raids': `# Basic Search Raids\n\n` +
                    `Search raids are the core gameplay loop. Enter a URL or search query to spawn a boss.\n\n` +
                    `## Phases\n` +
                    `1. **Reconnaissance** - Initial analysis\n` +
                    `2. **Torrent Layer** - Deep web access\n` +
                    `3. **Wormhole Analysis** - Link mapping\n` +
                    `4. **Anomaly Detection** - Pattern finding\n` +
                    `5. **AI Collaboration** - Get AI assistance\n\n` +
                    `Complete all phases to defeat the boss!`,
                    
                'BPM Risk/Reward System': `# BPM Risk/Reward System\n\n` +
                    `The faster you go, the more you risk - and the more you gain!\n\n` +
                    `## BPM Ranges\n` +
                    `- **60-80**: Safe Zone (1% death chance)\n` +
                    `- **81-120**: Moderate Risk (2-7% death chance)\n` +
                    `- **121-160**: Danger Zone (10-30% death chance)\n` +
                    `- **161-180**: Extreme Risk (30-70% death chance)\n` +
                    `- **181-200**: Infernal Mode (80-99% death chance)\n\n` +
                    `Rewards scale exponentially with BPM!`
            },
            'search-api': {
                'Emoji Encoding': `# Emoji Encoding System\n\n` +
                    `Emojis are mapped to operations for faster processing:\n\n` +
                    `## Operation Emojis\n` +
                    `- ✨ Create/Search\n` +
                    `- 👁️ Read/Analyze\n` +
                    `- 🔄 Update/Refresh\n` +
                    `- 🗑️ Delete/Destroy\n` +
                    `- ⚡ Attack/Speed\n\n` +
                    `## Logic Emojis\n` +
                    `- ✅ True\n` +
                    `- ❌ False\n` +
                    `- 🤝 AND\n` +
                    `- 🤷 OR\n` +
                    `- 🚫 NOT`
            }
        };
        
        return content[sectionId]?.[subsection] || 
               `# ${subsection}\n\nDocumentation coming soon...`;
    }
    
    // Public API methods
    getCharacterForum(characterId) {
        return this.characterForums.get(characterId);
    }
    
    getPublicPosts(characterId, boardId) {
        const forum = this.characterForums.get(characterId);
        if (!forum) return [];
        
        return forum.public.boards[boardId]?.posts || [];
    }
    
    getRecentActivity(limit = 10) {
        const allPosts = [];
        
        for (const [characterId, forum] of this.characterForums) {
            // Collect public posts
            for (const [boardId, board] of Object.entries(forum.public.boards)) {
                board.posts.forEach(post => {
                    allPosts.push({
                        characterId,
                        characterName: forum.character.name,
                        forumType: 'public',
                        boardId,
                        post
                    });
                });
            }
        }
        
        // Sort by timestamp and return most recent
        return allPosts
            .sort((a, b) => b.post.timestamp - a.post.timestamp)
            .slice(0, limit);
    }
    
    searchPosts(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const [characterId, forum] of this.characterForums) {
            // Search public posts only
            for (const [boardId, board] of Object.entries(forum.public.boards)) {
                board.posts.forEach(post => {
                    if (post.subject.toLowerCase().includes(queryLower) ||
                        post.content.toLowerCase().includes(queryLower)) {
                        results.push({
                            characterId,
                            characterName: forum.character.name,
                            boardId,
                            post
                        });
                    }
                });
            }
        }
        
        return results;
    }
}

// Export for use
module.exports = DeathtodataCharacterForums;

// Run if called directly
if (require.main === module) {
    const forums = new DeathtodataCharacterForums();
    
    forums.initialize()
        .then(async () => {
            console.log('\n🎭 CHARACTER FORUMS SYSTEM ACTIVE');
            console.log('=================================\n');
            
            // Create example character forums
            const exampleCharacters = [
                {
                    id: 'crawler-001',
                    name: 'SearchSpider-001',
                    level: 5,
                    strategy: 'explorer',
                    searchCapabilities: { emoji: '🕷️' }
                },
                {
                    id: 'centipede-002',
                    name: 'DataCentipede-002',
                    level: 3,
                    strategy: 'trader',
                    searchCapabilities: { emoji: '🐛' }
                }
            ];
            
            for (const character of exampleCharacters) {
                await forums.createCharacterForum(character);
            }
            
            // Simulate some activity
            setTimeout(async () => {
                // Raid report
                await forums.createRaidReport('crawler-001', {
                    characterName: 'SearchSpider-001',
                    query: 'government grants',
                    duration: 45000,
                    phasesCompleted: 5,
                    totalPhases: 5,
                    damageDealt: 1337,
                    maxBPM: 145,
                    deaths: 1,
                    discoveries: ['Hidden grant portal', 'Application backdoor', 'Secret eligibility'],
                    success: true,
                    difficulty: 'Hard',
                    epicMoment: 'Dodged the CAPTCHA boss at 1HP!'
                });
                
                // Trade offer
                await forums.createTradeOffer('centipede-002', {
                    characterName: 'DataCentipede-002',
                    type: 'WTS',
                    title: 'Rare URL coordinates',
                    item: 'Deep Web Coordinates',
                    quantity: 3,
                    price: '500 search points each',
                    description: 'Found during last night\'s raid. Verified working!'
                });
            }, 2000);
            
            // Show recent activity
            setInterval(() => {
                const activity = forums.getRecentActivity(5);
                if (activity.length > 0) {
                    console.log('\n📋 RECENT FORUM ACTIVITY:');
                    activity.forEach(item => {
                        console.log(`  ${item.characterName} in ${item.boardId}: "${item.post.subject}"`);
                    });
                }
            }, 10000);
        })
        .catch(error => {
            console.error('Failed to start:', error);
            process.exit(1);
        });
}
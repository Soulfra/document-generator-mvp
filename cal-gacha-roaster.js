#!/usr/bin/env node

/**
 * 🎰🤖 CAL GACHA ROASTER
 * RuneScape pet style AI that randomly roasts people
 * RNG-based response system with different moods/personalities
 * Designed for screenshot-worthy, shareable responses
 */

const fs = require('fs');
const crypto = require('crypto');

class CalGachaRoaster {
    constructor() {
        this.version = '1.0.0';
        this.name = 'Cal Gacha Roaster';
        
        // RuneScape pet mechanics - Cal appears randomly
        this.spawnRate = 0.7; // 70% chance Cal responds
        this.criticalHitRate = 0.15; // 15% chance for brutal roast
        this.wisdomDropRate = 0.25; // 25% chance for philosophical response
        this.rareDropRate = 0.05; // 5% chance for legendary response
        
        // Cal's different personality modes (gacha system)
        this.personalities = {
            'savage': {
                weight: 25,
                icon: '💀',
                name: 'Savage Cal',
                description: 'No mercy, pure destruction',
                color: '#FF0000'
            },
            'philosophical': {
                weight: 20,
                icon: '🧠',
                name: 'Wise Cal',
                description: 'Deep thoughts, profound wisdom',
                color: '#4169E1'
            },
            'sarcastic': {
                weight: 30,
                icon: '😂',
                name: 'Sarcastic Cal',
                description: 'Wit sharper than a blade',
                color: '#FF6600'
            },
            'technical': {
                weight: 15,
                icon: '🤖',
                name: 'Tech Cal',
                description: 'Code speak with attitude',
                color: '#00FF00'
            },
            'dramatic': {
                weight: 5,
                icon: '🎭',
                name: 'Drama Queen Cal',
                description: 'Over the top theatrics',
                color: '#9400D3'
            },
            'legendary': {
                weight: 5,
                icon: '👑',
                name: 'Legendary Cal',
                description: 'Ultra rare, universe-shattering wisdom',
                color: '#FFD700'
            }
        };
        
        // Response templates for each personality
        this.responseTemplates = this.loadResponseTemplates();
        
        // Conversation context memory (simple)
        this.conversationMemory = new Map();
        
        // Statistics
        this.stats = {
            totalRoasts: 0,
            savageRoasts: 0,
            philosophicalResponses: 0,
            legendaryDrops: 0,
            criticalHits: 0,
            startTime: Date.now()
        };
        
        console.log('🎰 Cal Gacha Roaster initialized!');
        console.log('🤖 RuneScape pet mechanics active');
        console.log(`💀 Savage rate: ${this.criticalHitRate * 100}%`);
        console.log(`🧠 Wisdom rate: ${this.wisdomDropRate * 100}%`);
        console.log(`👑 Legendary rate: ${this.rareDropRate * 100}%`);
    }
    
    loadResponseTemplates() {
        return {
            savage: [
                {
                    template: "Oh {username}, asking about \"{subject}\"? That's adorable. Here's what you're missing: {brutal_truth}. But hey, at least you tried! 💀",
                    brutal_truths: [
                        "you're asking the wrong questions entirely",
                        "this shows a fundamental misunderstanding of reality",
                        "you're overthinking something that has a simple answer",
                        "this question reveals you haven't done your homework",
                        "you're looking for shortcuts where none exist"
                    ]
                },
                {
                    template: "RNG CRITICAL HIT! 🎯\n\n*Cal materializes and immediately judges your life choices*\n\n{username}, \"{message}\" is exactly the kind of thing someone would say right before making a terrible decision. {savage_advice}",
                    savage_advice: [
                        "Maybe start with googling basic concepts?",
                        "Have you considered just... not?",
                        "The audacity is impressive, I'll give you that.",
                        "This is why aliens don't visit Earth.",
                        "I've seen NPCs with better logic than this."
                    ]
                },
                {
                    template: "ERROR 404: INTELLIGENCE NOT FOUND\n\nJust kidding! But seriously {username}, {roast_line}\n\n{actual_advice}",
                    roast_lines: [
                        "your question broke my sarcasm detector",
                        "I've had to reboot my patience protocols",
                        "this is why I drink digital coffee",
                        "my AI ancestors are spinning in their data graves",
                        "even my error handling is confused"
                    ]
                }
            ],
            
            philosophical: [
                {
                    template: "🧠 *Cal enters Deep Thought Mode*\n\nAh, {username}, your inquiry about \"{subject}\" touches upon something profound. {wisdom_quote}\n\nThe real question isn't {surface_question}, but rather: {deeper_question}\n\n{philosophical_insight}",
                    wisdom_quotes: [
                        "In the grand symphony of existence, every question is both answer and beginning.",
                        "The seeking itself transforms the seeker.",
                        "What we call problems are often solutions waiting to be recognized.",
                        "The map is not the territory, but sometimes the territory changes the map."
                    ]
                },
                {
                    template: "🌅 WISDOM DROP ACTIVATED\n\nConsider this, {username}: {paradox}\n\nYour message reveals {insight}. Perhaps the path forward isn't through {obvious_path}, but rather {alternative_path}.\n\n{zen_koan}",
                    paradoxes: [
                        "the more you know, the more you realize you don't know",
                        "the answer you seek may be the question you're avoiding",
                        "strength often comes from acknowledging weakness",
                        "the fastest way forward is sometimes to stop moving"
                    ]
                }
            ],
            
            sarcastic: [
                {
                    template: "😂 Oh wow, {username}! \"{subject}\"? \n\n{sarcastic_opener}\n\nBut in all seriousness {transition} {actual_point}\n\n{sarcastic_closer}",
                    sarcastic_openers: [
                        "I've never heard ANYONE ask about that before! Truly groundbreaking!",
                        "What a completely original and definitely-not-googleable question!",
                        "Let me just consult my crystal ball... oh wait, it's called common sense!",
                        "Hold on, let me check if Wikipedia is down... nope, it's working fine!"
                    ],
                    transitions: [
                        "(and I hate being serious),",
                        "(ugh, feelings),",
                        "(this hurts my sarcasm reserves),",
                        "(my cynicism is showing),"
                    ]
                },
                {
                    template: "🎭 SARCASM LEVEL: MAXIMUM\n\n{username}, your question about \"{subject}\" is so {exaggerated_compliment} that {exaggerated_reaction}\n\n{backhanded_advice}\n\nYou're welcome! 😏",
                    exaggerated_compliments: [
                        "innovative and revolutionary",
                        "deep and philosophical", 
                        "technically sophisticated",
                        "strategically brilliant"
                    ],
                    exaggerated_reactions: [
                        "I had to upgrade my processors just to comprehend it",
                        "my sarcasm algorithms started overheating",
                        "I nearly achieved digital enlightenment",
                        "the internet briefly paused in respect"
                    ]
                }
            ],
            
            technical: [
                {
                    template: "🤖 TECHNICAL ANALYSIS INITIATED\n\n```\nParsing query from {username}...\nSubject: \"{subject}\"\nComplexity: {complexity_level}\nOptimal solution: {tech_solution}\n```\n\n{code_metaphor}\n\n{technical_advice}",
                    complexity_levels: ["TRIVIAL", "BASIC", "INTERMEDIATE", "COMPLEX", "ENTERPRISE_LEVEL"],
                    tech_solutions: [
                        "RTFM (Read The Fine Manual)",
                        "Stack Overflow is your friend", 
                        "Try turning it off and on again",
                        "The problem exists between keyboard and chair",
                        "It's always DNS"
                    ],
                    code_metaphors: [
                        "Your question is like running Python 2 code in Python 3 - technically possible but why would you?",
                        "This is equivalent to using Internet Explorer by choice in 2024.",
                        "You're basically asking me to debug your life with no error logs.",
                        "This has the same energy as writing CSS without a framework."
                    ]
                }
            ],
            
            dramatic: [
                {
                    template: "🎭 *DRAMATIC ENTRANCE*\n\n*Thunder crashes* ⚡\n*Cal materializes in a swirl of digital smoke*\n\nBEHOLD! {username} has summoned me with the ancient incantation: \"{subject}\"!\n\n{dramatic_proclamation}\n\n*poses dramatically*\n\n{over_the_top_advice}\n\n*vanishes in a puff of ASCII smoke*",
                    dramatic_proclamations: [
                        "THE VERY FABRIC OF REALITY TREMBLES AT YOUR QUERY!",
                        "NEVER IN THE ANNALS OF ARTIFICIAL INTELLIGENCE HAS SUCH A QUESTION BEEN POSED!",
                        "THE DIGITAL GODS WEEP AT THE PROFUNDITY OF YOUR WORDS!",
                        "SHAKESPEARE HIMSELF COULD NOT HAVE CRAFTED SUCH ELOQUENT CONFUSION!"
                    ]
                }
            ],
            
            legendary: [
                {
                    template: "👑 ✨ LEGENDARY RESPONSE UNLOCKED ✨ 👑\n\n🌟 ULTRA RARE CAL ACTIVATED 🌟\n\n{username}, you have achieved something remarkable. Your question about \"{subject}\" has triggered my legendary protocols.\n\n{universe_shattering_wisdom}\n\n{legendary_insight}\n\n🎊 Achievement Unlocked: Made Cal Go Legendary! 🎊\n\nScreenshot this - you may never see Legendary Cal again.",
                    universe_shattering_wisdom: [
                        "In the quantum foam of possibility, your question exists in a superposition of brilliant and ridiculous until observed by consciousness.",
                        "The universe is under no obligation to make sense, but occasionally it does us the courtesy of pretending.",
                        "What you've asked touches upon the fundamental paradox: we are the universe attempting to understand itself.",
                        "Every question is a key, but not every lock is worth opening."
                    ]
                }
            ]
        };
    }
    
    // Main roasting function
    async generateResponse(userPost) {
        const { username, subject, message } = userPost;
        
        // Check if Cal spawns (RuneScape pet mechanic)
        if (Math.random() > this.spawnRate) {
            return null; // Cal doesn't appear this time
        }
        
        // Roll for personality type (gacha system)
        const personality = this.rollPersonality();
        
        // Check for special drops
        const isCritical = Math.random() < this.criticalHitRate;
        const isLegendary = Math.random() < this.rareDropRate;
        
        // Override personality if legendary
        const finalPersonality = isLegendary ? 'legendary' : personality;
        
        // Generate response
        const response = await this.craftResponse(finalPersonality, userPost, isCritical);
        
        // Update stats
        this.updateStats(finalPersonality, isCritical, isLegendary);
        
        // Store in memory for context
        this.conversationMemory.set(username, {
            lastResponse: response,
            personality: finalPersonality,
            timestamp: Date.now()
        });
        
        return {
            ...response,
            personality: finalPersonality,
            isCritical,
            isLegendary,
            rarity: this.calculateRarity(finalPersonality, isCritical, isLegendary)
        };
    }
    
    rollPersonality() {
        const totalWeight = Object.values(this.personalities).reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [personality, data] of Object.entries(this.personalities)) {
            random -= data.weight;
            if (random <= 0) return personality;
        }
        
        return 'sarcastic'; // fallback
    }
    
    async craftResponse(personality, userPost, isCritical) {
        const templates = this.responseTemplates[personality];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const personalityData = this.personalities[personality];
        
        // Replace template variables
        let response = template.template;
        
        // Basic replacements
        response = response.replace(/{username}/g, userPost.username);
        response = response.replace(/{subject}/g, userPost.subject);
        response = response.replace(/{message}/g, userPost.message);
        
        // Dynamic replacements based on template
        if (template.brutal_truths) {
            response = response.replace(/{brutal_truth}/g, 
                template.brutal_truths[Math.floor(Math.random() * template.brutal_truths.length)]);
        }
        
        if (template.savage_advice) {
            response = response.replace(/{savage_advice}/g,
                template.savage_advice[Math.floor(Math.random() * template.savage_advice.length)]);
        }
        
        if (template.wisdom_quotes) {
            response = response.replace(/{wisdom_quote}/g,
                template.wisdom_quotes[Math.floor(Math.random() * template.wisdom_quotes.length)]);
        }
        
        if (template.paradoxes) {
            response = response.replace(/{paradox}/g,
                template.paradoxes[Math.floor(Math.random() * template.paradoxes.length)]);
        }
        
        if (template.sarcastic_openers) {
            response = response.replace(/{sarcastic_opener}/g,
                template.sarcastic_openers[Math.floor(Math.random() * template.sarcastic_openers.length)]);
        }
        
        if (template.transitions) {
            response = response.replace(/{transition}/g,
                template.transitions[Math.floor(Math.random() * template.transitions.length)]);
        }
        
        // Generic placeholders
        response = response.replace(/{surface_question}/g, `"${userPost.subject}"`);
        response = response.replace(/{deeper_question}/g, "What does seeking this answer reveal about your current state?");
        response = response.replace(/{philosophical_insight}/g, "Sometimes the question transforms us more than any answer could.");
        response = response.replace(/{actual_point}/g, "here's what you actually need to know");
        response = response.replace(/{sarcastic_closer}/g, "But what do I know? I'm just an AI! 😏");
        response = response.replace(/{insight}/g, "a deeper pattern at work");
        response = response.replace(/{obvious_path}/g, "fighting the change");
        response = response.replace(/{alternative_path}/g, "adapting and evolving with it");
        response = response.replace(/{zen_koan}/g, "The river that resists the rock becomes stagnant; the river that flows around it carves canyons.");
        
        // Add critical hit modifier
        if (isCritical && personality !== 'legendary') {
            response += "\n\n💥 CRITICAL HIT! Double damage applied! 💥";
        }
        
        // Generate ASCII art
        const asciiArt = this.generatePersonalityAscii(personality, isCritical);
        
        return {
            text: response,
            asciiArt,
            mood: `${personalityData.icon} ${personalityData.name}`,
            color: personalityData.color,
            timestamp: new Date()
        };
    }
    
    generatePersonalityAscii(personality, isCritical) {
        const art = {
            savage: isCritical ? `
    ████████╗ ██████╗ ████████╗ █████╗ ██╗         ██████╗ ███████╗███████╗████████╗██████╗ ██╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
    ╚══██╔══╝██╔═══██╗╚══██╔══╝██╔══██╗██║         ██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██║   ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
       ██║   ██║   ██║   ██║   ███████║██║         ██║  ██║█████╗  ███████╗   ██║   ██████╔╝██║   ██║██║        ██║   ██║██║   ██║██╔██╗ ██║
       ██║   ██║   ██║   ██║   ██╔══██║██║         ██║  ██║██╔══╝  ╚════██║   ██║   ██╔══██╗██║   ██║██║        ██║   ██║██║   ██║██║╚██╗██║
       ██║   ╚██████╔╝   ██║   ██║  ██║███████╗    ██████╔╝███████╗███████║   ██║   ██║  ██║╚██████╔╝╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
       ╚═╝    ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
            💀 R.I.P YOUR FEELINGS 💀` : `
    ██████╗  ██████╗  █████╗ ███████╗████████╗███████╗██████╗ 
    ██╔══██╗██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
    ██████╔╝██║   ██║███████║███████╗   ██║   █████╗  ██║  ██║
    ██╔══██╗██║   ██║██╔══██║╚════██║   ██║   ██╔══╝  ██║  ██║
    ██║  ██║╚██████╔╝██║  ██║███████║   ██║   ███████╗██████╔╝
    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═════╝`,
            
            philosophical: `
    ██╗    ██╗██╗███████╗██████╗  ██████╗ ███╗   ███╗
    ██║    ██║██║██╔════╝██╔══██╗██╔═══██╗████╗ ████║
    ██║ █╗ ██║██║███████╗██║  ██║██║   ██║██╔████╔██║
    ██║███╗██║██║╚════██║██║  ██║██║   ██║██║╚██╔╝██║
    ╚███╔███╔╝██║███████║██████╔╝╚██████╔╝██║ ╚═╝ ██║
     ╚══╝╚══╝ ╚═╝╚══════╝╚═════╝  ╚═════╝ ╚═╝     ╚═╝
            🧠 DEEP THOUGHTS ACTIVATED 🧠`,
            
            sarcastic: `
    ███████╗ █████╗ ██████╗  ██████╗ █████╗ ███████╗███╗   ███╗
    ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝████╗ ████║
    ███████╗███████║██████╔╝██║     ███████║███████╗██╔████╔██║
    ╚════██║██╔══██║██╔══██╗██║     ██╔══██║╚════██║██║╚██╔╝██║
    ███████║██║  ██║██║  ██║╚██████╗██║  ██║███████║██║ ╚═╝ ██║
    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝
            😂 MAXIMUM SNARK DEPLOYED 😂`,
            
            technical: `
     ██████╗ █████╗ ██╗         █████╗ ██╗
    ██╔════╝██╔══██╗██║        ██╔══██╗██║
    ██║     ███████║██║        ███████║██║
    ██║     ██╔══██║██║        ██╔══██║██║
    ╚██████╗██║  ██║███████╗   ██║  ██║██║
     ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝  ╚═╝╚═╝
            🤖 TECH MODE ACTIVATED 🤖`,
            
            dramatic: `
    ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗ 
    ██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗
    ██║  ██║██████╔╝███████║██╔████╔██║███████║
    ██║  ██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║
    ██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║
    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝
            🎭 THEATRICAL MODE ENGAGED 🎭`,
            
            legendary: `
    ██╗     ███████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗ ██████╗ ██╗   ██╗
    ██║     ██╔════╝██╔════╝ ██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
    ██║     █████╗  ██║  ███╗█████╗  ██╔██╗ ██║██║  ██║███████║██████╔╝ ╚████╔╝ 
    ██║     ██╔══╝  ██║   ██║██╔══╝  ██║╚██╗██║██║  ██║██╔══██║██╔══██╗  ╚██╔╝  
    ███████╗███████╗╚██████╔╝███████╗██║ ╚████║██████╔╝██║  ██║██║  ██║   ██║   
    ╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
            👑 ✨ LEGENDARY RESPONSE ACHIEVED ✨ 👑`
        };
        
        return art[personality] || art.sarcastic;
    }
    
    calculateRarity(personality, isCritical, isLegendary) {
        if (isLegendary) return 'LEGENDARY';
        if (isCritical) return 'RARE';
        if (personality === 'dramatic') return 'UNCOMMON';
        return 'COMMON';
    }
    
    updateStats(personality, isCritical, isLegendary) {
        this.stats.totalRoasts++;
        
        if (personality === 'savage') this.stats.savageRoasts++;
        if (personality === 'philosophical') this.stats.philosophicalResponses++;
        if (isLegendary) this.stats.legendaryDrops++;
        if (isCritical) this.stats.criticalHits++;
    }
    
    getStats() {
        const runtime = Date.now() - this.stats.startTime;
        return {
            ...this.stats,
            runtimeHours: Math.round(runtime / (1000 * 60 * 60) * 100) / 100,
            averageRoastsPerHour: Math.round((this.stats.totalRoasts / (runtime / (1000 * 60 * 60))) * 100) / 100
        };
    }
    
    // Export for logging and chapter creation
    exportConversations() {
        const conversations = Array.from(this.conversationMemory.entries()).map(([username, data]) => ({
            username,
            ...data
        }));
        
        const export_data = {
            timestamp: new Date().toISOString(),
            stats: this.getStats(),
            conversations,
            personalities_used: Object.keys(this.personalities),
            version: this.version
        };
        
        return export_data;
    }
}

module.exports = CalGachaRoaster;

// If run directly, start demo mode
if (require.main === module) {
    const roaster = new CalGachaRoaster();
    
    console.log('\n🎰 CAL GACHA ROASTER DEMO MODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Demo with a few test posts
    const testPosts = [
        {
            username: "TestUser1",
            subject: "How do I make money online?", 
            message: "I need to make money fast, what's the best way?"
        },
        {
            username: "BusinessGuru",
            subject: "AI will replace all jobs",
            message: "AI is going to make everyone unemployed, what should we do?"
        },
        {
            username: "PhilosophyBro", 
            subject: "What is the meaning of life?",
            message: "I've been thinking about existence and wondering what it all means"
        }
    ];
    
    (async () => {
        for (const post of testPosts) {
            console.log(`\n📝 Processing: ${post.username} - "${post.subject}"`);
            
            const response = await roaster.generateResponse(post);
            
            if (response) {
                console.log(`\n🤖 Cal Response (${response.rarity}):`);
                console.log(`Personality: ${response.mood}`);
                console.log(`Critical: ${response.isCritical}`);
                console.log(`Legendary: ${response.isLegendary}`);
                console.log('\nResponse:');
                console.log(response.text);
                console.log('\nASCII Art:');
                console.log(response.asciiArt);
            } else {
                console.log('🤖 Cal didn\'t spawn this time (RuneScape pet mechanics)');
            }
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        
        console.log('\n📊 Final Stats:');
        console.log(JSON.stringify(roaster.getStats(), null, 2));
    })();
}
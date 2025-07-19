"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storytellingService = exports.StorytellingService = void 0;
const logger_1 = require("../../utils/logger");
class StorytellingService {
    narrativeTemplates;
    characterBank;
    metaphorLibrary;
    constructor() {
        this.narrativeTemplates = new Map();
        this.characterBank = new Map();
        this.metaphorLibrary = new Map();
        this.initializeStorytellingAssets();
    }
    initializeStorytellingAssets() {
        this.narrativeTemplates.set('e-commerce', {
            adventure: {
                setting: 'A bustling marketplace in an ancient kingdom',
                hero: 'A merchant seeking to build the perfect trading post',
                challenge: 'Creating a system where travelers can safely gather and examine goods before committing to purchase',
                tools: 'Magical containers that hold items until payment is complete'
            },
            'fairy-tale': {
                setting: 'A magical forest where woodland creatures trade enchanted items',
                hero: 'A clever fox who runs the forest\'s first organized trading system',
                challenge: 'Helping animals collect the perfect combination of magical items for their quests',
                tools: 'Enchanted baskets that never drop their contents'
            }
        });
        this.narrativeTemplates.set('authentication', {
            adventure: {
                setting: 'A fortress city with multiple gates and guards',
                hero: 'A guild master organizing access to secret chambers',
                challenge: 'Ensuring only authorized members can enter while keeping the process smooth',
                tools: 'Magical tokens that prove identity and grant passage'
            },
            mystery: {
                setting: 'A detective agency with classified case files',
                hero: 'A master detective creating the perfect security system',
                challenge: 'Allowing investigators access to cases while protecting sensitive information',
                tools: 'Special keys that change based on who holds them'
            }
        });
        this.characterBank.set('tech-concepts', {
            database: { name: 'The Librarian', role: 'Keeper of infinite scrolls and records' },
            api: { name: 'The Messenger', role: 'Swift courier between kingdoms' },
            frontend: { name: 'The Artist', role: 'Master of beautiful facades and displays' },
            backend: { name: 'The Engineer', role: 'Builder of hidden mechanisms and systems' },
            cache: { name: 'The Memory Keeper', role: 'Guardian of frequently needed wisdom' },
            server: { name: 'The Foundation', role: 'Steady ground upon which everything stands' }
        });
        this.metaphorLibrary.set('common-patterns', {
            'data-flow': {
                river: 'Information flows like a river from source to destination',
                pipeline: 'Data moves through a series of processing stations like an assembly line',
                mail: 'Each piece of information is like a letter being delivered to its destination'
            },
            'user-interaction': {
                conversation: 'The interface is like a friendly conversation between user and system',
                journey: 'Using the app is like following a well-marked trail through a forest',
                dance: 'User and system move together in a choreographed dance of actions and responses'
            }
        });
    }
    async createStoryResponse(context) {
        try {
            logger_1.logger.info('Creating story response', { domain: context.domain });
            const narrativeStyle = this.selectNarrativeStyle(context);
            const technicalConcepts = this.extractTechnicalConcepts(context.technicalResponse);
            const storyMapping = this.mapConceptsToStory(technicalConcepts, context.domain || 'general');
            const narrative = await this.generateNarrative(context, narrativeStyle, storyMapping);
            const characters = this.extractCharacters(storyMapping);
            const metaphors = this.extractMetaphors(storyMapping);
            const moral = this.extractMoral(context, narrative);
            const response = {
                narrative,
                characters,
                metaphors,
                moral,
                technicalMapping: storyMapping.conceptMap,
                memorabilityScore: this.calculateMemorabilityScore(narrative, storyMapping)
            };
            logger_1.logger.info('Story response created', {
                memorabilityScore: response.memorabilityScore,
                characterCount: characters.length
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Failed to create story response', { error, context });
            throw new Error('Story generation failed');
        }
    }
    selectNarrativeStyle(context) {
        if (context.userProfile?.preferredStyle) {
            return context.userProfile.preferredStyle;
        }
        const domain = context.domain || 'general';
        const complexity = context.userProfile?.complexityLevel || 'intermediate';
        if (domain === 'e-commerce')
            return 'adventure';
        if (domain === 'authentication')
            return 'mystery';
        if (domain === 'database')
            return 'modern';
        if (complexity === 'beginner')
            return 'fairy-tale';
        return 'adventure';
    }
    extractTechnicalConcepts(technicalResponse) {
        const concepts = [];
        const conceptPatterns = [
            /\b(database|db|sql|nosql|postgres|mongodb)\b/gi,
            /\b(api|endpoint|rest|graphql|http)\b/gi,
            /\b(authentication|auth|login|jwt|token)\b/gi,
            /\b(frontend|ui|interface|component|react|vue)\b/gi,
            /\b(backend|server|service|microservice)\b/gi,
            /\b(cache|caching|redis|memory)\b/gi,
            /\b(cart|shopping|e-commerce|payment)\b/gi,
            /\b(security|encryption|https|ssl)\b/gi
        ];
        for (const pattern of conceptPatterns) {
            const matches = technicalResponse.match(pattern);
            if (matches) {
                concepts.push(...matches.map(m => m.toLowerCase()));
            }
        }
        return [...new Set(concepts)];
    }
    mapConceptsToStory(concepts, domain) {
        const mapping = {
            conceptMap: {},
            characters: [],
            setting: '',
            conflict: '',
            resolution: ''
        };
        concepts.forEach(concept => {
            const character = this.characterBank.get('tech-concepts')?.[concept];
            if (character) {
                mapping.characters.push(character);
                mapping.conceptMap[concept] = character.name;
            }
            else {
                mapping.conceptMap[concept] = this.generateMetaphorFor(concept);
            }
        });
        const template = this.narrativeTemplates.get(domain)?.adventure ||
            this.narrativeTemplates.get('general')?.adventure;
        if (template) {
            mapping.setting = template.setting;
            mapping.conflict = template.challenge;
            mapping.resolution = template.tools;
        }
        return mapping;
    }
    generateMetaphorFor(concept) {
        const metaphors = {
            'component': 'a specialized craftsperson in the village',
            'state': 'the current mood of the kingdom',
            'props': 'messages passed between villagers',
            'hook': 'a magical ability that appears when needed',
            'array': 'a caravan of similar items traveling together',
            'object': 'a treasure chest containing related valuables',
            'function': 'a reliable helper who performs specific tasks',
            'variable': 'a container that can hold different treasures',
            'loop': 'a magical circle that repeats actions until complete',
            'condition': 'a wise sage who makes decisions based on circumstances'
        };
        return metaphors[concept] || `a mysterious ${concept} with special powers`;
    }
    async generateNarrative(context, style, storyMapping) {
        const opening = this.generateOpening(context, style, storyMapping);
        const journey = this.generateJourney(context, storyMapping);
        const resolution = this.generateResolution(context, storyMapping);
        const wisdom = this.generateWisdom(context);
        return `${opening}\n\n${journey}\n\n${resolution}\n\n${wisdom}`;
    }
    generateOpening(context, style, storyMapping) {
        const templates = {
            adventure: `🏰 In ${storyMapping.setting}, there lived a ${this.getMainCharacter(storyMapping)} who faced an interesting challenge...`,
            'fairy-tale': `✨ Once upon a time, in a land where technology worked like magic, there was a quest to solve: "${context.question}"`,
            modern: `🌟 Imagine you're the architect of a digital city, and someone just asked you: "${context.question}"`,
            'sci-fi': `🚀 In the vast network of the digital universe, a challenge arose that would test the limits of our virtual reality...`,
            mystery: `🔍 A peculiar case landed on the desk of our digital detective. The mystery: "${context.question}"`
        };
        return templates[style] || templates.adventure;
    }
    generateJourney(context, storyMapping) {
        const characters = storyMapping.characters.map(c => c.name).join(', ');
        const concepts = Object.keys(storyMapping.conceptMap);
        let journey = `The solution required assembling a team of specialists: ${characters}. `;
        if (concepts.includes('database') || concepts.includes('db')) {
            journey += `The Librarian would organize and safely store all the important information. `;
        }
        if (concepts.includes('api') || concepts.includes('endpoint')) {
            journey += `The Messenger would create reliable pathways for communication between different parts of the system. `;
        }
        if (concepts.includes('frontend') || concepts.includes('ui')) {
            journey += `The Artist would craft beautiful and intuitive interfaces that users would love to interact with. `;
        }
        journey += `Together, they would transform the complex technical requirements into an elegant, working solution.`;
        return journey;
    }
    generateResolution(context, storyMapping) {
        return `🎯 The breakthrough came when they realized that ${storyMapping.conflict} could be solved by ${storyMapping.resolution}. What seemed like an impossible technical challenge became a natural, flowing process that users would find intuitive and enjoyable.`;
    }
    generateWisdom(context) {
        return `💡 **The Moral of the Story**: Just as every great tale needs memorable characters and a clear journey, every great technical solution needs well-defined components working together toward a common goal. The magic isn't in the complexity—it's in making the complex feel simple and natural.`;
    }
    getMainCharacter(storyMapping) {
        if (storyMapping.characters.length > 0) {
            return storyMapping.characters[0].name;
        }
        return 'clever developer';
    }
    extractCharacters(storyMapping) {
        return storyMapping.characters.map(c => c.name);
    }
    extractMetaphors(storyMapping) {
        return Object.values(storyMapping.conceptMap);
    }
    extractMoral(context, narrative) {
        const moralMatch = narrative.match(/\*\*The Moral[^:]*:\*\*\s*([^*]+)/);
        return moralMatch?.[1]?.trim() || 'Every complex problem has an elegant solution waiting to be discovered.';
    }
    calculateMemorabilityScore(narrative, storyMapping) {
        let score = 5.0;
        if (narrative.includes('Once upon a time') || narrative.includes('In a land'))
            score += 1.0;
        if (storyMapping.characters.length > 2)
            score += 0.5;
        if (narrative.includes('🏰') || narrative.includes('✨') || narrative.includes('🌟'))
            score += 0.5;
        if (narrative.length > 200 && narrative.length < 800)
            score += 1.0;
        if (narrative.includes('moral') || narrative.includes('wisdom'))
            score += 0.5;
        const metaphorCount = storyMapping.conceptMap ? Object.keys(storyMapping.conceptMap).length : 0;
        score += Math.min(metaphorCount * 0.2, 1.0);
        return Math.min(score, 10.0);
    }
    async enhanceWithStory(question, technicalResponse, userPreferences) {
        const context = {
            question,
            technicalResponse,
            userProfile: userPreferences,
            domain: this.detectDomain(question)
        };
        return this.createStoryResponse(context);
    }
    detectDomain(question) {
        const lowerQuestion = question.toLowerCase();
        if (lowerQuestion.includes('shopping') || lowerQuestion.includes('cart') || lowerQuestion.includes('ecommerce')) {
            return 'e-commerce';
        }
        if (lowerQuestion.includes('login') || lowerQuestion.includes('auth') || lowerQuestion.includes('user')) {
            return 'authentication';
        }
        if (lowerQuestion.includes('database') || lowerQuestion.includes('data') || lowerQuestion.includes('store')) {
            return 'database';
        }
        return 'general';
    }
}
exports.StorytellingService = StorytellingService;
exports.storytellingService = new StorytellingService();
//# sourceMappingURL=storytelling.service.js.map
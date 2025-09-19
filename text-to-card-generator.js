#!/usr/bin/env node

/**
 * 🃏 TEXT TO CARD GENERATOR
 * 
 * Converts any text input into collectible trading cards
 * Generates game assets from natural language descriptions
 * Implements rarity, value, and special abilities
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class TextToCardGenerator extends EventEmitter {
    constructor(entityRegistry) {
        super();
        
        this.registry = entityRegistry;
        this.generatorId = `CARDGEN-${Date.now()}`;
        
        // Card configuration
        this.cardConfig = {
            rarities: {
                common: { chance: 0.60, multiplier: 1.0, color: '#808080' },
                uncommon: { chance: 0.25, multiplier: 1.5, color: '#00FF00' },
                rare: { chance: 0.10, multiplier: 3.0, color: '#0080FF' },
                epic: { chance: 0.04, multiplier: 5.0, color: '#9932CC' },
                legendary: { chance: 0.01, multiplier: 10.0, color: '#FFD700' }
            },
            
            types: {
                creature: { attackRange: [1, 10], defenseRange: [1, 10] },
                spell: { powerRange: [1, 20], costRange: [1, 5] },
                artifact: { durabilityRange: [1, 10], effectRange: [1, 5] },
                location: { influenceRange: [1, 15], capacityRange: [1, 5] },
                character: { skillRange: [1, 10], healthRange: [10, 100] },
                concept: { wisdomRange: [1, 20], complexityRange: [1, 10] }
            },
            
            abilities: [
                'flying', 'stealth', 'regeneration', 'haste', 'shield',
                'pierce', 'multicast', 'lifesteal', 'freeze', 'burn',
                'inspire', 'educate', 'discover', 'transform', 'duplicate'
            ]
        };
        
        // Card templates for different content types
        this.templates = {
            programming: {
                namePatterns: ['Code', 'Algorithm', 'Function', 'Variable', 'Loop'],
                abilities: ['debug', 'optimize', 'refactor', 'compile', 'execute']
            },
            
            security: {
                namePatterns: ['Firewall', 'Encryption', 'Exploit', 'Patch', 'Audit'],
                abilities: ['protect', 'detect', 'prevent', 'analyze', 'defend']
            },
            
            economics: {
                namePatterns: ['Market', 'Trade', 'Arbitrage', 'Investment', 'Currency'],
                abilities: ['profit', 'hedge', 'leverage', 'liquidate', 'compound']
            },
            
            education: {
                namePatterns: ['Lesson', 'Knowledge', 'Wisdom', 'Insight', 'Discovery'],
                abilities: ['teach', 'learn', 'inspire', 'enlighten', 'master']
            }
        };
        
        // Card value factors
        this.valuationFactors = {
            rarityWeight: 0.4,
            statsWeight: 0.3,
            abilitiesWeight: 0.2,
            uniquenessWeight: 0.1
        };
        
        // Generation statistics
        this.stats = {
            totalGenerated: 0,
            byRarity: new Map(),
            byType: new Map(),
            totalValue: 0,
            uniqueCards: new Set()
        };
    }
    
    /**
     * Generate card from text input
     */
    async generateCard(text, options = {}) {
        console.log('🃏 Generating card from text...');
        
        // Extract concepts and keywords
        const analysis = await this.analyzeText(text);
        
        // Determine card properties
        const rarity = this.determineRarity(analysis, options.forceRarity);
        const cardType = this.determineCardType(analysis, options.forceType);
        const template = this.selectTemplate(analysis);
        
        // Generate card ID
        const cardId = this.generateCardId(text);
        
        // Check for duplicates
        if (this.stats.uniqueCards.has(cardId) && !options.allowDuplicates) {
            console.log('⚠️ Duplicate card detected, enhancing...');
            return this.enhanceExistingCard(cardId, analysis);
        }
        
        // Build card
        const card = {
            id: cardId,
            universalId: null, // Will be set after registration
            
            // Basic properties
            name: this.generateCardName(analysis, template),
            description: this.generateDescription(text, analysis),
            flavorText: this.generateFlavorText(analysis),
            
            // Type and rarity
            type: cardType,
            rarity: rarity,
            set: options.set || 'core',
            
            // Visual properties
            image: this.generateImagePrompt(analysis, cardType, rarity),
            borderColor: this.cardConfig.rarities[rarity].color,
            foil: rarity === 'legendary' || Math.random() < 0.1,
            
            // Stats based on type
            ...this.generateStats(cardType, rarity, analysis),
            
            // Abilities
            abilities: this.generateAbilities(cardType, rarity, template),
            keywords: analysis.keywords,
            
            // Cost and requirements
            cost: this.calculateCost(cardType, rarity),
            requirements: this.generateRequirements(analysis),
            
            // Trading properties
            tradeable: options.tradeable !== false,
            soulbound: options.soulbound || false,
            
            // Value
            baseValue: 0, // Will be calculated
            marketValue: 0, // Dynamic based on supply/demand
            
            // Metadata
            source: {
                text: text.substring(0, 200),
                generator: this.generatorId,
                analysis: analysis
            },
            
            // Generation info
            generated: Date.now(),
            generatedBy: options.generatedBy || 'system',
            
            // Game mechanics
            playable: true,
            deckLimit: rarity === 'legendary' ? 1 : 3,
            
            // Collection info
            collectorNumber: this.stats.totalGenerated + 1,
            totalPrinted: 0, // Tracks how many exist
            
            // Special properties
            isPromo: options.isPromo || false,
            isEvent: options.isEvent || false
        };
        
        // Calculate base value
        card.baseValue = this.calculateBaseValue(card);
        card.marketValue = card.baseValue; // Initial market value
        
        // Register with entity registry if available
        if (this.registry) {
            const entity = this.registry.registerEntity('card', cardId, {
                name: card.name,
                description: card.description,
                tags: [...card.keywords, card.rarity, card.type],
                properties: {
                    rarity: card.rarity,
                    type: card.type,
                    value: card.baseValue
                }
            });
            
            card.universalId = entity.universalId;
        }
        
        // Update statistics
        this.updateStatistics(card);
        
        console.log(`✅ Generated ${card.rarity} ${card.type}: ${card.name}`);
        
        this.emit('card:generated', card);
        
        return card;
    }
    
    /**
     * Generate card pack
     */
    async generatePack(packSize = 5, guaranteedRarity = null) {
        console.log(`📦 Generating pack of ${packSize} cards...`);
        
        const cards = [];
        
        // If guaranteed rarity, ensure at least one
        if (guaranteedRarity) {
            const guaranteedCard = await this.generateCard(
                this.generateRandomPrompt(),
                { forceRarity: guaranteedRarity }
            );
            cards.push(guaranteedCard);
            packSize--;
        }
        
        // Generate remaining cards
        for (let i = 0; i < packSize; i++) {
            const card = await this.generateCard(this.generateRandomPrompt());
            cards.push(card);
        }
        
        // Calculate pack value
        const packValue = cards.reduce((sum, card) => sum + card.baseValue, 0);
        
        return {
            id: `PACK-${Date.now()}`,
            cards,
            size: cards.length,
            value: packValue,
            rarities: this.countRarities(cards),
            generated: Date.now()
        };
    }
    
    /**
     * Convert MVP/document to card collection
     */
    async generateCollectionFromDocument(document, options = {}) {
        console.log('📚 Generating card collection from document...');
        
        // Split document into sections
        const sections = this.splitDocument(document);
        const collection = {
            id: `COLLECTION-${Date.now()}`,
            name: options.collectionName || 'Document Collection',
            cards: [],
            themes: new Set(),
            totalValue: 0
        };
        
        // Generate cards for each section
        for (const section of sections) {
            if (section.content.length > 50) { // Minimum content length
                const card = await this.generateCard(section.content, {
                    set: collection.id,
                    ...options
                });
                
                collection.cards.push(card);
                card.keywords.forEach(keyword => collection.themes.add(keyword));
            }
        }
        
        // Generate special collection cards
        if (collection.cards.length >= 5) {
            // Collection completion bonus card
            const bonusCard = await this.generateCard(
                `Master of ${options.collectionName || 'Knowledge'}: Collected all wisdom`,
                {
                    forceRarity: 'legendary',
                    set: collection.id,
                    isPromo: true
                }
            );
            collection.cards.push(bonusCard);
        }
        
        collection.totalValue = collection.cards.reduce((sum, card) => sum + card.baseValue, 0);
        
        console.log(`✅ Generated collection with ${collection.cards.length} cards`);
        
        return collection;
    }
    
    /**
     * Analyze text for card generation
     */
    async analyzeText(text) {
        const analysis = {
            length: text.length,
            words: text.split(/\s+/).filter(w => w.length > 0),
            keywords: [],
            concepts: [],
            sentiment: 'neutral',
            complexity: 1,
            category: 'general'
        };
        
        // Extract keywords (simple implementation)
        const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an']);
        analysis.keywords = analysis.words
            .filter(w => w.length > 4 && !commonWords.has(w.toLowerCase()))
            .map(w => w.toLowerCase())
            .filter((w, i, arr) => arr.indexOf(w) === i) // Unique
            .slice(0, 10);
        
        // Detect concepts
        const conceptPatterns = {
            programming: /code|function|algorithm|variable|loop|array|class/i,
            security: /security|encryption|firewall|hack|protect|vulnerability/i,
            economics: /market|trade|money|investment|profit|economy/i,
            education: /learn|teach|knowledge|understand|discover|study/i,
            combat: /attack|defend|battle|fight|warrior|damage/i,
            magic: /spell|magic|wizard|enchant|mystical|arcane/i
        };
        
        for (const [concept, pattern] of Object.entries(conceptPatterns)) {
            if (pattern.test(text)) {
                analysis.concepts.push(concept);
            }
        }
        
        // Determine complexity
        analysis.complexity = Math.min(10, Math.floor(analysis.words.length / 20) + 1);
        
        // Determine category
        if (analysis.concepts.length > 0) {
            analysis.category = analysis.concepts[0];
        }
        
        return analysis;
    }
    
    /**
     * Determine card rarity
     */
    determineRarity(analysis, forceRarity = null) {
        if (forceRarity && this.cardConfig.rarities[forceRarity]) {
            return forceRarity;
        }
        
        // Factors that increase rarity
        let rarityScore = 0;
        rarityScore += analysis.complexity * 0.1;
        rarityScore += analysis.keywords.length * 0.05;
        rarityScore += analysis.concepts.length * 0.15;
        
        // Add randomness
        rarityScore += Math.random() * 0.5;
        
        // Determine rarity based on score
        if (rarityScore > 0.99) return 'legendary';
        if (rarityScore > 0.95) return 'epic';
        if (rarityScore > 0.85) return 'rare';
        if (rarityScore > 0.60) return 'uncommon';
        return 'common';
    }
    
    /**
     * Determine card type
     */
    determineCardType(analysis, forceType = null) {
        if (forceType && this.cardConfig.types[forceType]) {
            return forceType;
        }
        
        // Map concepts to card types
        const typeMapping = {
            programming: 'spell',
            security: 'artifact',
            economics: 'location',
            education: 'concept',
            combat: 'creature',
            magic: 'spell'
        };
        
        // Check concepts
        for (const concept of analysis.concepts) {
            if (typeMapping[concept]) {
                return typeMapping[concept];
            }
        }
        
        // Check keywords
        if (analysis.keywords.some(k => k.includes('place') || k.includes('location'))) {
            return 'location';
        }
        
        if (analysis.keywords.some(k => k.includes('person') || k.includes('character'))) {
            return 'character';
        }
        
        // Default based on complexity
        if (analysis.complexity > 7) return 'concept';
        if (analysis.complexity > 4) return 'spell';
        return 'creature';
    }
    
    /**
     * Select template based on analysis
     */
    selectTemplate(analysis) {
        for (const concept of analysis.concepts) {
            if (this.templates[concept]) {
                return this.templates[concept];
            }
        }
        
        return this.templates.education; // Default template
    }
    
    /**
     * Generate card name
     */
    generateCardName(analysis, template) {
        const adjectives = [
            'Ancient', 'Mystic', 'Digital', 'Quantum', 'Cyber',
            'Ethereal', 'Corrupted', 'Purified', 'Forbidden', 'Sacred'
        ];
        
        const baseNoun = template.namePatterns[
            Math.floor(Math.random() * template.namePatterns.length)
        ];
        
        // Use keyword if available
        const keyword = analysis.keywords[0];
        if (keyword && Math.random() > 0.5) {
            return `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${baseNoun}`;
        }
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        return `${adjective} ${baseNoun}`;
    }
    
    /**
     * Generate card description
     */
    generateDescription(text, analysis) {
        const intro = [
            'A powerful artifact that',
            'An ancient technique for',
            'A mysterious force that',
            'A legendary method to',
            'A rare ability that'
        ];
        
        const action = [
            'harnesses the power of',
            'channels energy through',
            'manipulates reality using',
            'transforms knowledge into',
            'converts understanding to'
        ];
        
        const introPhrase = intro[Math.floor(Math.random() * intro.length)];
        const actionPhrase = action[Math.floor(Math.random() * action.length)];
        
        // Create description from text excerpt
        const excerpt = text.substring(0, 100).trim();
        
        return `${introPhrase} ${actionPhrase} ${analysis.category}. "${excerpt}..."`;
    }
    
    /**
     * Generate flavor text
     */
    generateFlavorText(analysis) {
        const templates = [
            '"In knowledge, power. In power, responsibility."',
            '"The wise learn from everything and everyone."',
            '"Every master was once a student who never gave up."',
            '"Code is poetry, algorithms are music."',
            '"Security is not a product, but a process."',
            `"To understand ${analysis.category} is to shape reality."`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    /**
     * Generate stats based on card type
     */
    generateStats(cardType, rarity, analysis) {
        const config = this.cardConfig.types[cardType];
        const rarityMultiplier = this.cardConfig.rarities[rarity].multiplier;
        
        const stats = {};
        
        switch (cardType) {
            case 'creature':
                stats.attack = Math.floor(
                    this.randomInRange(config.attackRange) * rarityMultiplier
                );
                stats.defense = Math.floor(
                    this.randomInRange(config.defenseRange) * rarityMultiplier
                );
                stats.health = stats.defense * 2;
                break;
                
            case 'spell':
                stats.power = Math.floor(
                    this.randomInRange(config.powerRange) * rarityMultiplier
                );
                stats.manaCost = Math.max(1, Math.floor(stats.power / 4));
                break;
                
            case 'artifact':
                stats.durability = Math.floor(
                    this.randomInRange(config.durabilityRange) * rarityMultiplier
                );
                stats.effect = Math.floor(
                    this.randomInRange(config.effectRange) * rarityMultiplier
                );
                break;
                
            case 'location':
                stats.influence = Math.floor(
                    this.randomInRange(config.influenceRange) * rarityMultiplier
                );
                stats.capacity = Math.floor(
                    this.randomInRange(config.capacityRange) * rarityMultiplier
                );
                break;
                
            case 'character':
                stats.skill = Math.floor(
                    this.randomInRange(config.skillRange) * rarityMultiplier
                );
                stats.health = Math.floor(
                    this.randomInRange(config.healthRange) * rarityMultiplier
                );
                stats.loyalty = Math.floor(Math.random() * 10) + 1;
                break;
                
            case 'concept':
                stats.wisdom = Math.floor(
                    this.randomInRange(config.wisdomRange) * rarityMultiplier
                );
                stats.complexity = Math.floor(
                    this.randomInRange(config.complexityRange) * rarityMultiplier
                );
                break;
        }
        
        // Add complexity modifier
        Object.keys(stats).forEach(stat => {
            stats[stat] = Math.floor(stats[stat] * (1 + analysis.complexity * 0.05));
        });
        
        return stats;
    }
    
    /**
     * Generate abilities
     */
    generateAbilities(cardType, rarity, template) {
        const abilities = [];
        
        // Number of abilities based on rarity
        const abilityCount = {
            common: 0,
            uncommon: 1,
            rare: 1,
            epic: 2,
            legendary: 3
        }[rarity];
        
        // Select from template abilities first
        const availableAbilities = [
            ...template.abilities,
            ...this.cardConfig.abilities
        ];
        
        for (let i = 0; i < abilityCount && availableAbilities.length > 0; i++) {
            const index = Math.floor(Math.random() * availableAbilities.length);
            abilities.push(availableAbilities[index]);
            availableAbilities.splice(index, 1);
        }
        
        return abilities;
    }
    
    /**
     * Calculate card cost
     */
    calculateCost(cardType, rarity) {
        const baseCost = {
            creature: 3,
            spell: 2,
            artifact: 4,
            location: 5,
            character: 4,
            concept: 3
        }[cardType];
        
        const rarityModifier = {
            common: 0,
            uncommon: 1,
            rare: 2,
            epic: 3,
            legendary: 4
        }[rarity];
        
        return baseCost + rarityModifier;
    }
    
    /**
     * Generate requirements
     */
    generateRequirements(analysis) {
        const requirements = [];
        
        // Level requirements based on complexity
        if (analysis.complexity > 5) {
            requirements.push({
                type: 'level',
                value: analysis.complexity,
                description: `Requires level ${analysis.complexity}`
            });
        }
        
        // Skill requirements based on concepts
        for (const concept of analysis.concepts) {
            if (Math.random() > 0.5) {
                requirements.push({
                    type: 'skill',
                    skill: concept,
                    value: Math.floor(Math.random() * 5) + 1,
                    description: `${concept} skill level 1+`
                });
            }
        }
        
        return requirements;
    }
    
    /**
     * Calculate base value
     */
    calculateBaseValue(card) {
        let value = 10; // Base value
        
        // Rarity value
        const rarityValues = {
            common: 10,
            uncommon: 25,
            rare: 100,
            epic: 500,
            legendary: 2500
        };
        
        value = rarityValues[card.rarity];
        
        // Stat bonus
        const statTotal = Object.values(card)
            .filter(v => typeof v === 'number' && v > 0)
            .reduce((sum, stat) => sum + stat, 0);
        
        value += statTotal * 2;
        
        // Ability bonus
        value += card.abilities.length * 50;
        
        // Foil bonus
        if (card.foil) value *= 2;
        
        // Promo bonus
        if (card.isPromo) value *= 1.5;
        
        return Math.floor(value);
    }
    
    /**
     * Generate image prompt
     */
    generateImagePrompt(analysis, cardType, rarity) {
        const style = {
            common: 'simple sketch',
            uncommon: 'detailed drawing',
            rare: 'digital painting',
            epic: 'masterful artwork',
            legendary: 'breathtaking masterpiece'
        }[rarity];
        
        const typeDescription = {
            creature: 'fantastical creature',
            spell: 'magical energy',
            artifact: 'mystical object',
            location: 'enchanted place',
            character: 'heroic figure',
            concept: 'abstract visualization'
        }[cardType];
        
        return `A ${style} of a ${typeDescription} representing ${analysis.category}, ` +
               `featuring ${analysis.keywords.slice(0, 3).join(', ')}, ` +
               `${rarity} card game art style`;
    }
    
    /**
     * Generate card ID
     */
    generateCardId(text) {
        return `CARD-${crypto.createHash('sha256')
            .update(text)
            .digest('hex')
            .substring(0, 8)
            .toUpperCase()}`;
    }
    
    /**
     * Enhance existing card
     */
    async enhanceExistingCard(cardId, analysis) {
        // In production, would fetch and enhance existing card
        // For demo, generate variant
        return this.generateCard(
            `Enhanced version: ${analysis.keywords.join(' ')}`,
            { allowDuplicates: true }
        );
    }
    
    /**
     * Update statistics
     */
    updateStatistics(card) {
        this.stats.totalGenerated++;
        this.stats.uniqueCards.add(card.id);
        this.stats.totalValue += card.baseValue;
        
        // Update rarity count
        this.stats.byRarity.set(
            card.rarity,
            (this.stats.byRarity.get(card.rarity) || 0) + 1
        );
        
        // Update type count
        this.stats.byType.set(
            card.type,
            (this.stats.byType.get(card.type) || 0) + 1
        );
    }
    
    /**
     * Helper methods
     */
    
    randomInRange(range) {
        const [min, max] = range;
        return Math.random() * (max - min) + min;
    }
    
    generateRandomPrompt() {
        const prompts = [
            'A powerful algorithm that optimizes code performance',
            'An ancient firewall that protects digital realms',
            'A market analysis tool that predicts future trends',
            'A learning technique that accelerates understanding',
            'A debugging spell that reveals hidden errors',
            'A cryptographic key that unlocks secret knowledge',
            'A trading strategy that maximizes profits',
            'A teaching method that inspires students'
        ];
        
        return prompts[Math.floor(Math.random() * prompts.length)];
    }
    
    splitDocument(document) {
        // Simple document splitter - in production would be more sophisticated
        const sections = [];
        const paragraphs = document.split(/\n\n+/);
        
        for (const paragraph of paragraphs) {
            if (paragraph.trim().length > 0) {
                sections.push({
                    content: paragraph.trim(),
                    type: 'paragraph'
                });
            }
        }
        
        return sections;
    }
    
    countRarities(cards) {
        const counts = {};
        for (const card of cards) {
            counts[card.rarity] = (counts[card.rarity] || 0) + 1;
        }
        return counts;
    }
    
    /**
     * Get generator statistics
     */
    getStatistics() {
        return {
            totalGenerated: this.stats.totalGenerated,
            uniqueCards: this.stats.uniqueCards.size,
            totalValue: this.stats.totalValue,
            averageValue: this.stats.totalValue / this.stats.totalGenerated,
            byRarity: Object.fromEntries(this.stats.byRarity),
            byType: Object.fromEntries(this.stats.byType)
        };
    }
}

module.exports = TextToCardGenerator;

// CLI Demo
if (require.main === module) {
    const UniversalEntityRegistry = require('./universal-entity-registry');
    const registry = new UniversalEntityRegistry();
    const generator = new TextToCardGenerator(registry);
    
    async function demo() {
        console.log('\n🃏 TEXT TO CARD GENERATOR DEMO\n');
        
        // Generate single card
        console.log('📝 Generating card from text...');
        const card1 = await generator.generateCard(
            'A revolutionary algorithm that uses quantum computing to solve previously impossible optimization problems'
        );
        console.log('\nGenerated Card:');
        console.log(JSON.stringify(card1, null, 2));
        
        // Generate pack
        console.log('\n📦 Generating card pack...');
        const pack = await generator.generatePack(5, 'rare');
        console.log(`Generated pack with ${pack.cards.length} cards:`);
        pack.cards.forEach(card => {
            console.log(`  - ${card.rarity} ${card.type}: ${card.name} (Value: ${card.baseValue})`);
        });
        
        // Generate collection from document
        console.log('\n📚 Generating collection from document...');
        const document = `
Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience.

Neural Networks

Neural networks are computing systems inspired by biological neural networks. They form the foundation of deep learning.

Training Process

The training process involves feeding data to the algorithm and adjusting weights to minimize error.
        `;
        
        const collection = await generator.generateCollectionFromDocument(document, {
            collectionName: 'ML Fundamentals'
        });
        
        console.log(`\nGenerated collection "${collection.name}":`);
        console.log(`  Total cards: ${collection.cards.length}`);
        console.log(`  Total value: ${collection.totalValue}`);
        console.log(`  Themes: ${Array.from(collection.themes).join(', ')}`);
        
        // Show statistics
        console.log('\n📊 Generator Statistics:');
        console.log(JSON.stringify(generator.getStatistics(), null, 2));
    }
    
    demo().catch(console.error);
}
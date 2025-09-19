#!/usr/bin/env node

/**
 * 🎨🎮 BITMAP QUERY EXAMPLES 🎮🎨
 * 
 * Pre-built queries for common bitmap requests
 * Castle Crashers style character generation
 * 2D sprite sheet generation examples
 */

const crypto = require('crypto');
const fs = require('fs').promises;

class BitmapQueryExamples {
    constructor() {
        this.exampleId = crypto.randomBytes(16).toString('hex');
        
        console.log('🎨🎮 BITMAP QUERY EXAMPLES');
        console.log('==========================');
        console.log('Pre-built queries and sprite generation examples');
        console.log('');
        
        this.initializeExamples();
    }
    
    initializeExamples() {
        console.log('🎮 Initializing bitmap query examples...');
        
        // Castle Crashers style characters
        this.castleCrashersCharacters = {
            knight: {
                query: 'draw a knight in Castle Crashers style',
                sprite: `
     ⚔️
    ▄█▄
   ▐███▌  
   ▐███▌  
   ▐▀ ▀▌  
    ▌ ▐`,
                colors: ['#silver', '#blue', '#gold'],
                animations: ['idle', 'walk', 'attack', 'jump']
            },
            
            wizard: {
                query: 'draw a wizard in Castle Crashers style',
                sprite: `
     🎩
    ▄█▄
   ▐█⚡█▌  
   ▐███▌  
   ▐▀ ▀▌  
    ╱ ╲`,
                colors: ['#purple', '#blue', '#starry'],
                animations: ['idle', 'cast', 'float', 'teleport']
            },
            
            archer: {
                query: 'draw an archer in Castle Crashers style',
                sprite: `
     🏹
    ▄█▄
   ◄███▌  
   ▐███▌  
   ▐▀ ▀▌  
    ╱ ╲`,
                colors: ['#green', '#brown', '#gold'],
                animations: ['idle', 'aim', 'shoot', 'roll']
            },
            
            barbarian: {
                query: 'draw a barbarian in Castle Crashers style',
                sprite: `
     🪓
    ▄█▄
   ▐███▌💪
   ▐███▌  
   ▐▀ ▀▌  
    ╱ ╲`,
                colors: ['#red', '#brown', '#steel'],
                animations: ['idle', 'rage', 'smash', 'charge']
            }
        };
        
        // ChronoQuest style elements
        this.chronoQuestElements = {
            timePortal: {
                query: 'draw a time portal ChronoQuest style',
                sprite: `
    ╱◯◯◯╲
   ◯ ⚡⚡ ◯
  ◯  🌀  ◯
   ◯ ⚡⚡ ◯
    ╲◯◯◯╱`,
                effects: ['swirl', 'lightning', 'glow']
            },
            
            ancientScroll: {
                query: 'draw an ancient scroll ChronoQuest style',
                sprite: `
  ╔═══════╗
  ║ ◊ ◊ ◊ ║
  ║▓▓▓▓▓▓▓║
  ║ ∞ ∞ ∞ ║
  ╚═══════╝`,
                properties: ['readable', 'magical', 'quest-item']
            },
            
            timeGem: {
                query: 'draw a time gem ChronoQuest style',
                sprite: `
    ◆
   ◆◆◆
  ◆◆◆◆◆
   ◆◆◆
    ◆`,
                colors: ['#cyan', '#temporal', '#glowing']
            }
        };
        
        // Side-scrolling level elements
        this.levelElements = {
            platform: {
                query: 'draw a platform for side-scrolling game',
                sprite: `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`,
                variations: ['grass', 'stone', 'ice', 'lava']
            },
            
            ladder: {
                query: 'draw a ladder for platformer',
                sprite: `
  ╠═╬═╣
  ╠═╬═╣
  ╠═╬═╣
  ╠═╬═╣`,
                properties: ['climbable', 'background']
            },
            
            coin: {
                query: 'draw a collectible coin',
                sprite: `◉`,
                animations: ['spin', 'sparkle']
            },
            
            spikes: {
                query: 'draw danger spikes',
                sprite: `▲▲▲▲▲`,
                properties: ['hazard', 'instant-death']
            }
        };
        
        // Boss sprites
        this.bossSprites = {
            handBoss: {
                query: 'draw Master Hand boss',
                sprite: `
     ╱◯╲
    ╱◯◯◯╲
   │◯◯◯◯◯│
   │◯◯◯◯◯│
    ╲╲╲╱╱`,
                attacks: ['grab', 'slam', 'finger-bullets', 'punch']
            },
            
            dragonBoss: {
                query: 'draw a dragon boss pixel art',
                sprite: `
    ╱\\__/\\
   (  ⚡⚡  )
  <( ▼▼▼▼▼ )>
   \\  ~~~  /
    ╲/\\/\\/╱`,
                attacks: ['fire-breath', 'tail-swipe', 'fly', 'roar']
            },
            
            robotBoss: {
                query: 'draw a robot boss',
                sprite: `
   ┌─▀─┐
   │◯ ◯│
   ├───┤
   │███│
   └─┬─┘`,
                attacks: ['laser', 'missiles', 'transform', 'shield']
            }
        };
        
        // Sprite sheet examples
        this.spriteSheets = {
            walkCycle: {
                query: 'draw character walk cycle sprite sheet',
                frames: [
                    `  ◯     ◯     ◯     ◯  
                     ╱│╲   ╱│╲   ╱│╲   ╱│╲ 
                     ╱ ╲   │ ╲   ╲ │   ╱ ╲`,
                ],
                frameCount: 4,
                loop: true
            },
            
            attackAnimation: {
                query: 'draw sword attack animation',
                frames: [
                    `  ◯╱    ◯──   ◯     ◯  
                     ╱│     ╱│╲    │╲    ╱│╲ 
                     ╱ ╲    ╱ ╲   ╱ ╲   ╱ ╲`,
                ],
                frameCount: 4,
                loop: false
            }
        };
        
        console.log('✅ Bitmap query examples loaded!');
        console.log(`  • ${Object.keys(this.castleCrashersCharacters).length} Castle Crashers characters`);
        console.log(`  • ${Object.keys(this.chronoQuestElements).length} ChronoQuest elements`);
        console.log(`  • ${Object.keys(this.levelElements).length} Level elements`);
        console.log(`  • ${Object.keys(this.bossSprites).length} Boss sprites`);
    }
    
    // Get example by category and name
    getExample(category, name) {
        const categories = {
            'castle-crashers': this.castleCrashersCharacters,
            'chronoquest': this.chronoQuestElements,
            'level': this.levelElements,
            'boss': this.bossSprites,
            'sprite-sheet': this.spriteSheets
        };
        
        const categoryData = categories[category];
        if (!categoryData) {
            console.error(`❌ Unknown category: ${category}`);
            return null;
        }
        
        const example = categoryData[name];
        if (!example) {
            console.error(`❌ Unknown example: ${name} in category ${category}`);
            return null;
        }
        
        return example;
    }
    
    // Generate complete character with variations
    generateCharacterVariations(characterType) {
        const base = this.castleCrashersCharacters[characterType];
        if (!base) {
            console.error(`❌ Unknown character type: ${characterType}`);
            return null;
        }
        
        console.log(`\n🎨 Generating ${characterType} variations...`);
        
        const variations = {
            base: base.sprite,
            colors: {},
            animations: {}
        };
        
        // Generate color variations
        base.colors.forEach(color => {
            variations.colors[color] = this.applyColorToSprite(base.sprite, color);
        });
        
        // Generate animation frames
        base.animations.forEach(animation => {
            variations.animations[animation] = this.generateAnimation(characterType, animation);
        });
        
        return variations;
    }
    
    // Apply color styling to sprite (simulated)
    applyColorToSprite(sprite, color) {
        // In real implementation, this would apply actual color
        return `${sprite} [${color}]`;
    }
    
    // Generate animation frames
    generateAnimation(characterType, animationType) {
        const animations = {
            idle: ['standing', 'breathing'],
            walk: ['left-foot', 'right-foot'],
            attack: ['wind-up', 'strike', 'follow-through'],
            jump: ['crouch', 'ascend', 'descend', 'land']
        };
        
        return animations[animationType] || ['frame1', 'frame2'];
    }
    
    // Generate complete sprite sheet
    generateSpriteSheet(characterType) {
        console.log(`\n📋 Generating sprite sheet for: ${characterType}`);
        
        const character = this.castleCrashersCharacters[characterType];
        if (!character) return null;
        
        const spriteSheet = {
            name: characterType,
            query: character.query,
            dimensions: '64x64',
            frames: []
        };
        
        // Generate all animation frames
        character.animations.forEach(animation => {
            const frames = this.generateAnimation(characterType, animation);
            frames.forEach((frame, index) => {
                spriteSheet.frames.push({
                    animation,
                    frame: index,
                    sprite: character.sprite,
                    offset: { x: index * 64, y: 0 }
                });
            });
        });
        
        return spriteSheet;
    }
    
    // Show all available examples
    showAllExamples() {
        console.log('\n🎮 ALL BITMAP QUERY EXAMPLES');
        console.log('============================');
        
        console.log('\n⚔️ CASTLE CRASHERS CHARACTERS:');
        Object.entries(this.castleCrashersCharacters).forEach(([name, data]) => {
            console.log(`\n${name.toUpperCase()}: "${data.query}"`);
            console.log(data.sprite);
        });
        
        console.log('\n⏰ CHRONOQUEST ELEMENTS:');
        Object.entries(this.chronoQuestElements).forEach(([name, data]) => {
            console.log(`\n${name.toUpperCase()}: "${data.query}"`);
            console.log(data.sprite);
        });
        
        console.log('\n🏃 LEVEL ELEMENTS:');
        Object.entries(this.levelElements).forEach(([name, data]) => {
            console.log(`\n${name.toUpperCase()}: "${data.query}"`);
            console.log(data.sprite);
        });
        
        console.log('\n👹 BOSS SPRITES:');
        Object.entries(this.bossSprites).forEach(([name, data]) => {
            console.log(`\n${name.toUpperCase()}: "${data.query}"`);
            console.log(data.sprite);
        });
    }
    
    // Export examples to JSON
    async exportToJSON() {
        const allExamples = {
            metadata: {
                version: '1.0.0',
                generatedAt: new Date().toISOString(),
                totalExamples: 0
            },
            castleCrashers: this.castleCrashersCharacters,
            chronoQuest: this.chronoQuestElements,
            levelElements: this.levelElements,
            bosses: this.bossSprites,
            spriteSheets: this.spriteSheets
        };
        
        // Count total examples
        Object.values(allExamples).forEach(category => {
            if (typeof category === 'object' && !Array.isArray(category)) {
                allExamples.metadata.totalExamples += Object.keys(category).length;
            }
        });
        
        const json = JSON.stringify(allExamples, null, 2);
        await fs.writeFile('bitmap-query-examples.json', json);
        
        console.log('\n✅ Examples exported to: bitmap-query-examples.json');
        return allExamples;
    }
    
    // Generate query documentation
    generateQueryDocumentation() {
        const docs = [];
        
        docs.push('# BITMAP QUERY DOCUMENTATION');
        docs.push('============================\n');
        
        docs.push('## Basic Query Format:');
        docs.push('"draw a [subject] in [style] style"\n');
        
        docs.push('## Available Styles:');
        docs.push('- Castle Crashers (cartoon, colorful)');
        docs.push('- ChronoQuest (mystical, time-themed)');
        docs.push('- Pixel Art (retro, 8-bit)');
        docs.push('- Side-scrolling (platformer elements)\n');
        
        docs.push('## Example Queries:\n');
        
        // Add all example queries
        const allCategories = [
            { name: 'Characters', data: this.castleCrashersCharacters },
            { name: 'Elements', data: this.chronoQuestElements },
            { name: 'Level Parts', data: this.levelElements },
            { name: 'Bosses', data: this.bossSprites }
        ];
        
        allCategories.forEach(category => {
            docs.push(`### ${category.name}:`);
            Object.values(category.data).forEach(item => {
                docs.push(`- "${item.query}"`);
            });
            docs.push('');
        });
        
        return docs.join('\n');
    }
}

// Export for use
module.exports = BitmapQueryExamples;

// Run if called directly
if (require.main === module) {
    const examples = new BitmapQueryExamples();
    
    // Show all examples
    examples.showAllExamples();
    
    // Demo character variations
    console.log('\n🎨 DEMO: Character Variations');
    console.log('=============================');
    const knightVariations = examples.generateCharacterVariations('knight');
    console.log('Knight variations generated:', knightVariations);
    
    // Demo sprite sheet generation
    console.log('\n📋 DEMO: Sprite Sheet Generation');
    console.log('================================');
    const wizardSheet = examples.generateSpriteSheet('wizard');
    console.log('Wizard sprite sheet:', wizardSheet);
    
    // Generate documentation
    const docs = examples.generateQueryDocumentation();
    console.log('\n📚 Generated Documentation Preview:');
    console.log('==================================');
    console.log(docs.substring(0, 500) + '...');
    
    // Export examples
    examples.exportToJSON().then(() => {
        console.log('\n✅ All bitmap query examples ready for use!');
    });
}
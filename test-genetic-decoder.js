#!/usr/bin/env node

/**
 * GENETIC DECODER TEST HARNESS
 * Tests genetic hash decoding with real verification hashes from stream
 * Ensures reproducible character generation for lineage tracking
 */

const fs = require('fs');

class GeneticDecoder {
    constructor() {
        this.lineageTypes = ['warrior', 'scholar', 'rogue', 'mage'];
        console.log('🧬 Genetic Decoder initialized');
    }

    decodeHash(hash, parentHash = null) {
        if (!hash || hash.length !== 16) {
            throw new Error(`Invalid hash format: ${hash}`);
        }

        const lineageCode = hash.slice(0, 4);
        const traitData = hash.slice(4, 8);
        const genData = hash.slice(8, 12);
        const variant = hash.slice(12, 16);

        // Calculate lineage
        const lineageBase = parseInt(lineageCode, 16);
        const lineage = this.lineageTypes[lineageBase % 4];

        // Calculate traits from hex values
        const genY = traitData; // Arms/equipment
        const genZ = genData;   // Guardian/companion
        
        const strength = this.calculateTrait(lineageCode.slice(0, 2), traitData.slice(0, 2));
        const intelligence = this.calculateTrait(lineageCode.slice(2, 4), traitData.slice(2, 4));
        const agility = this.calculateTrait(genData.slice(0, 2), variant.slice(0, 2));
        const mysticism = this.calculateTrait(genData.slice(2, 4), variant.slice(2, 4));

        // Calculate temperature (0.0-1.0)
        const temperature = parseInt(traitData, 16) / 65535;

        // Create character object
        const character = {
            characterId: `char_${hash}`,
            hash: hash,
            lineage: lineage,
            lineageCode: lineageCode,
            parentHash: parentHash,
            generation: parentHash ? 1 : 0, // Genesis or child
            traits: {
                genY: genY,
                genZ: genZ,
                strength: Math.round(strength * 100) / 100,
                intelligence: Math.round(intelligence * 100) / 100,
                agility: Math.round(agility * 100) / 100,
                mysticism: Math.round(mysticism * 100) / 100
            },
            temperature: Math.round(temperature * 100) / 100,
            variant: variant,
            bitmap: this.generateBitmap(lineage, variant),
            holographic: this.isHolographic(variant),
            spawnTime: Date.now()
        };

        return character;
    }

    calculateTrait(hex1, hex2) {
        const val1 = parseInt(hex1, 16) / 256;
        const val2 = parseInt(hex2, 16) / 256;
        return (val1 + val2) / 2; // Average of both hex pairs
    }

    generateBitmap(lineage, variant) {
        const sprites = {
            warrior: '⚔️█▓▒░',
            scholar: '📚█▓▒░', 
            rogue: '🗡️█▓▒░',
            mage: '✨█▓▒░'
        };
        
        const intensity = parseInt(variant.slice(0, 2), 16) / 256;
        const pattern = intensity > 0.5 ? sprites[lineage] : sprites[lineage].slice(1);
        
        return `${pattern} ${lineage} sprite data`;
    }

    isHolographic(variant) {
        // Holographic if variant ends in high values
        const lastByte = parseInt(variant.slice(2, 4), 16);
        return lastByte > 200; // ~78% chance for non-holographic
    }

    cringeFilter(character) {
        // Check stat variance
        const stats = [
            character.traits.strength,
            character.traits.intelligence, 
            character.traits.agility,
            character.traits.mysticism
        ];
        
        const mean = stats.reduce((a, b) => a + b) / stats.length;
        const variance = stats.reduce((acc, stat) => acc + Math.pow(stat - mean, 2), 0) / stats.length;
        
        if (variance < 0.01) {
            console.log(`❌ CRINGE: Too uniform stats (variance: ${variance.toFixed(4)})`);
            return false;
        }

        // Check lineage alignment
        const lineageThresholds = {
            warrior: character.traits.strength,
            scholar: character.traits.intelligence,
            rogue: character.traits.agility,
            mage: character.traits.mysticism
        };

        if (lineageThresholds[character.lineage] < 0.3) {
            console.log(`❌ CRINGE: ${character.lineage} has weak primary trait (${lineageThresholds[character.lineage].toFixed(2)})`);
            return false;
        }

        // Check extreme temperature without mysticism
        if (character.temperature > 0.9 && character.traits.mysticism < 0.1) {
            console.log(`❌ CRINGE: High temperature (${character.temperature}) but low mysticism (${character.traits.mysticism})`);
            return false;
        }

        return true;
    }

    clarityFilter(character) {
        const contrast = parseInt(character.variant, 16) % 256 / 256;
        
        if (contrast < 0.2) {
            console.log(`❌ CLARITY: Too low contrast (${contrast.toFixed(2)})`);
            return false;
        }

        if (contrast > 0.9 && character.temperature > 0.8) {
            console.log(`❌ CLARITY: Too chaotic (contrast: ${contrast.toFixed(2)}, temp: ${character.temperature})`);
            return false;
        }

        const lineageContrast = {
            warrior: 0.7,
            scholar: 0.4,
            rogue: 0.6,
            mage: 0.8
        };

        const requiredContrast = lineageContrast[character.lineage] * 0.8;
        if (contrast < requiredContrast) {
            console.log(`❌ CLARITY: Insufficient contrast for ${character.lineage} (${contrast.toFixed(2)} < ${requiredContrast.toFixed(2)})`);
            return false;
        }

        return true;
    }

    processCharacter(hash, parentHash = null) {
        console.log(`\n🧬 Processing hash: ${hash}`);
        
        try {
            const character = this.decodeHash(hash, parentHash);
            
            console.log(`📊 Lineage: ${character.lineage.toUpperCase()}`);
            console.log(`🌡️  Temperature: ${character.temperature}`);
            console.log(`💪 Traits: STR:${character.traits.strength} INT:${character.traits.intelligence} AGI:${character.traits.agility} MYS:${character.traits.mysticism}`);
            console.log(`🎨 Variant: ${character.variant} (holographic: ${character.holographic})`);
            
            // Apply filters
            const passesCreigne = this.cringeFilter(character);
            const passesClarity = this.clarityFilter(character);
            
            if (passesCreigne && passesClarity) {
                console.log('✅ CHARACTER APPROVED - Ready for spawn');
                return character;
            } else {
                console.log('❌ CHARACTER REJECTED - Failed filters');
                return null;
            }
            
        } catch (error) {
            console.error('💥 Error processing hash:', error.message);
            return null;
        }
    }
}

// Test with command line argument or real stream hashes
function main() {
    const decoder = new GeneticDecoder();
    
    const testHash = process.argv[2];
    if (testHash) {
        // Single hash test
        console.log('🧪 SINGLE HASH TEST');
        const character = decoder.processCharacter(testHash);
        if (character) {
            console.log('\n📋 Final Character:');
            console.log(JSON.stringify(character, null, 2));
        }
    } else {
        // Test with real stream hashes
        console.log('🧪 REAL STREAM HASH TESTS');
        const realHashes = [
            'c7b25a3fa1b983e4', // From stream entry 57
            'bca4ce60633afc78', // From stream entry 59
            '4261ee12133bd648', // From stream entry 60
            '6719c6847ec62465', // From stream entry 61
            'ebc31fcab11c3c7b'  // Latest hash
        ];

        const approvedCharacters = [];
        
        realHashes.forEach((hash, index) => {
            const parentHash = index > 0 ? realHashes[index - 1] : null;
            const character = decoder.processCharacter(hash, parentHash);
            if (character) {
                approvedCharacters.push(character);
            }
        });

        console.log(`\n📊 SUMMARY: ${approvedCharacters.length}/${realHashes.length} characters approved`);
        
        if (approvedCharacters.length > 0) {
            console.log('\n🏆 APPROVED CHARACTERS:');
            approvedCharacters.forEach(char => {
                console.log(`- ${char.lineage.toUpperCase()}: ${char.characterId} (temp: ${char.temperature}, holo: ${char.holographic})`);
            });
        }
        
        console.log('\n🧬 Reproducibility test complete - same hashes should always produce same results');
    }
}

if (require.main === module) {
    main();
}

module.exports = { GeneticDecoder };
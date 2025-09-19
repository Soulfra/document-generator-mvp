#!/usr/bin/env node

/**
 * TEST LINEAGE SPAWNING SYSTEM
 * Validates deterministic DNA generation and offspring creation
 * Tests the full reproduction chain: tournament → DNA → spawn → next generation
 */

const TournamentGeneticIntegration = require('./tournament-genetic-integration');

class LineageSpawningTest {
    constructor() {
        this.genetic = new TournamentGeneticIntegration();
        console.log('🧪 Lineage Spawning Test Suite initialized');
    }
    
    async runAllTests() {
        console.log('\n🎯 LINEAGE SPAWNING TEST SUITE');
        console.log('===============================\n');
        
        const tests = [
            this.testDeterministicDNA.bind(this),
            this.testLineageSpawning.bind(this),
            this.testBloodlineTracking.bind(this),
            this.testGenerationalInheritance.bind(this),
            this.testFullReproductionChain.bind(this)
        ];
        
        let passed = 0;
        let total = tests.length;
        
        for (const test of tests) {
            try {
                const result = await test();
                if (result) passed++;
            } catch (error) {
                console.error(`❌ Test failed:`, error.message);
            }
        }
        
        console.log(`\n📊 FINAL RESULTS: ${passed}/${total} tests passed (${(passed/total*100).toFixed(1)}%)`);
        
        if (passed === total) {
            console.log('✅ ALL TESTS PASSED - Lineage spawning system is ready!');
            return true;
        } else {
            console.log('❌ Some tests failed - Lineage spawning needs fixes');
            return false;
        }
    }
    
    /**
     * Test 1: Deterministic DNA Generation
     */
    async testDeterministicDNA() {
        console.log('🧬 Test 1: Deterministic DNA Generation');
        console.log('--------------------------------------');
        
        // Create identical tournament results
        const mockTournament = {
            tournamentId: 'test-deterministic-123',
            winner: {
                id: 'synthesis-master',
                name: 'Synthesis Master',
                approach: 'synthesis',
                confidence: 0.85,
                inventory: [
                    ['base-query', 'test'],
                    ['eliminated-unit1', { name: 'Unit 1' }],
                    ['eliminated-unit2', { name: 'Unit 2' }]
                ]
            },
            duration: 15000,
            rounds: 3,
            participants: 8
        };
        
        // Generate DNA multiple times
        const dna1 = await this.genetic.generateTournamentDNA(mockTournament);
        const dna2 = await this.genetic.generateTournamentDNA(mockTournament);
        const dna3 = await this.genetic.generateTournamentDNA(mockTournament);
        
        // Check if all DNA results are identical
        const allMatch = (dna1.tournamentDNA === dna2.tournamentDNA) && 
                        (dna2.tournamentDNA === dna3.tournamentDNA);
        
        console.log(`   DNA 1: ${dna1.tournamentDNA.substr(0, 40)}...`);
        console.log(`   DNA 2: ${dna2.tournamentDNA.substr(0, 40)}...`);
        console.log(`   DNA 3: ${dna3.tournamentDNA.substr(0, 40)}...`);
        console.log(`   Match: ${allMatch ? '✅ PASS' : '❌ FAIL'}`);
        
        // Also check genetic sequence consistency
        const geneticMatch = (dna1.geneticSequence === dna2.geneticSequence) &&
                            (dna2.geneticSequence === dna3.geneticSequence);
        
        console.log(`   Genetic Sequence Match: ${geneticMatch ? '✅ PASS' : '❌ FAIL'}`);
        
        return allMatch && geneticMatch;
    }
    
    /**
     * Test 2: Lineage Spawning
     */
    async testLineageSpawning() {
        console.log('\n🐣 Test 2: Lineage Spawning');
        console.log('-------------------------');
        
        // Create parent tournament
        const parentTournament = {
            tournamentId: 'parent-tournament-456',
            winner: {
                id: 'critical-warrior',
                name: 'Critical Warrior',
                approach: 'critical',
                confidence: 0.92,
                inventory: Array(15).fill().map((_, i) => [`item${i}`, `value${i}`])
            },
            duration: 20000,
            rounds: 4,
            participants: 16,
            generation: 0
        };
        
        // Generate parent DNA
        const parentDNA = await this.genetic.generateTournamentDNA(parentTournament);
        console.log(`   Parent DNA: ${parentDNA.tournamentDNA.substr(0, 40)}...`);
        
        // Spawn offspring
        const offspring = await this.genetic.spawnFromTournamentDNA(
            parentDNA.tournamentDNA, 
            parentTournament
        );
        
        // Validate offspring properties
        const validSpawn = offspring && 
                          offspring.type === 'tournament_offspring' &&
                          offspring.parentDNA === parentDNA.tournamentDNA &&
                          offspring.generation === 1 &&
                          offspring.inheritedTraits.primaryApproach === 'critical';
        
        console.log(`   Offspring Type: ${offspring.type}`);
        console.log(`   Generation: ${offspring.generation}`);
        console.log(`   Lineage: ${offspring.lineage}`);
        console.log(`   Bloodline: ${offspring.bloodline}`);
        console.log(`   Knowledge Capacity: ${offspring.knowledgeCapacity}`);
        console.log(`   Valid Spawn: ${validSpawn ? '✅ PASS' : '❌ FAIL'}`);
        
        return validSpawn;
    }
    
    /**
     * Test 3: Bloodline Tracking
     */
    async testBloodlineTracking() {
        console.log('\n🩸 Test 3: Bloodline Tracking');
        console.log('----------------------------');
        
        // Create tournaments with same approach but different characteristics
        const tournaments = [
            {
                tournamentId: 'bloodline-1',
                winner: { id: 'analytical-1', approach: 'analytical', confidence: 0.8, inventory: [] },
                rounds: 2, participants: 4, generation: 0
            },
            {
                tournamentId: 'bloodline-2', 
                winner: { id: 'analytical-2', approach: 'analytical', confidence: 0.9, inventory: [] },
                rounds: 3, participants: 8, generation: 0
            },
            {
                tournamentId: 'bloodline-3',
                winner: { id: 'creative-1', approach: 'creative', confidence: 0.7, inventory: [] },
                rounds: 2, participants: 4, generation: 0
            }
        ];
        
        const bloodlines = [];
        
        for (const tournament of tournaments) {
            const dna = await this.genetic.generateTournamentDNA(tournament);
            const offspring = await this.genetic.spawnFromTournamentDNA(dna.tournamentDNA, tournament);
            bloodlines.push({
                approach: tournament.winner.approach,
                bloodline: offspring.bloodline,
                offspring
            });
        }
        
        // Check bloodline patterns
        const analyticalBloodlines = bloodlines.filter(b => b.approach === 'analytical');
        const sameApproachDifferentBloodlines = analyticalBloodlines[0].bloodline !== analyticalBloodlines[1].bloodline;
        const differentApproachBloodlines = bloodlines[0].bloodline !== bloodlines[2].bloodline;
        
        console.log(`   Analytical 1: ${analyticalBloodlines[0].bloodline}`);
        console.log(`   Analytical 2: ${analyticalBloodlines[1].bloodline}`);
        console.log(`   Creative 1: ${bloodlines[2].bloodline}`);
        console.log(`   Same approach, different bloodlines: ${sameApproachDifferentBloodlines ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Different approaches have different bloodlines: ${differentApproachBloodlines ? '✅ PASS' : '❌ FAIL'}`);
        
        return sameApproachDifferentBloodlines && differentApproachBloodlines;
    }
    
    /**
     * Test 4: Generational Inheritance
     */
    async testGenerationalInheritance() {
        console.log('\n🧬 Test 4: Generational Inheritance');
        console.log('---------------------------------');
        
        // Create first generation
        const gen1Tournament = {
            tournamentId: 'gen1-789',
            winner: {
                id: 'synthesis-founder',
                name: 'Synthesis Founder',
                approach: 'synthesis',
                confidence: 0.95,
                inventory: Array(20).fill().map((_, i) => [`gen1-item${i}`, `value${i}`])
            },
            duration: 25000,
            rounds: 5,
            participants: 32,
            generation: 0
        };
        
        // Generate first generation offspring
        const gen1DNA = await this.genetic.generateTournamentDNA(gen1Tournament);
        const gen1Offspring = await this.genetic.spawnFromTournamentDNA(gen1DNA.tournamentDNA, gen1Tournament);
        
        // Create second generation tournament using first generation offspring
        const gen2Tournament = {
            ...gen1Tournament,
            tournamentId: 'gen2-789',
            generation: 1,
            winner: {
                ...gen1Tournament.winner,
                id: gen1Offspring.characterId,
                approach: gen1Offspring.tournamentApproach,
                inventory: Array(gen1Offspring.knowledgeCapacity).fill().map((_, i) => [`gen2-item${i}`, `value${i}`])
            }
        };
        
        // Generate second generation offspring
        const gen2DNA = await this.genetic.generateTournamentDNA(gen2Tournament);
        const gen2Offspring = await this.genetic.spawnFromTournamentDNA(gen2DNA.tournamentDNA, gen2Tournament);
        
        // Validate generational progression
        const validInheritance = gen1Offspring.generation === 1 &&
                               gen2Offspring.generation === 2 &&
                               gen2Offspring.knowledgeCapacity >= gen1Offspring.knowledgeCapacity &&
                               gen1Offspring.bloodline !== gen2Offspring.bloodline; // Different bloodlines
        
        console.log(`   Gen 1 Generation: ${gen1Offspring.generation}`);
        console.log(`   Gen 2 Generation: ${gen2Offspring.generation}`);
        console.log(`   Gen 1 Knowledge Capacity: ${gen1Offspring.knowledgeCapacity}`);
        console.log(`   Gen 2 Knowledge Capacity: ${gen2Offspring.knowledgeCapacity}`);
        console.log(`   Gen 1 Bloodline: ${gen1Offspring.bloodline}`);
        console.log(`   Gen 2 Bloodline: ${gen2Offspring.bloodline}`);
        console.log(`   Valid Inheritance: ${validInheritance ? '✅ PASS' : '❌ FAIL'}`);
        
        return validInheritance;
    }
    
    /**
     * Test 5: Full Reproduction Chain
     */
    async testFullReproductionChain() {
        console.log('\n🔗 Test 5: Full Reproduction Chain');
        console.log('--------------------------------');
        
        const chainSteps = [];
        
        // Step 1: Tournament → DNA
        const originalTournament = {
            tournamentId: 'chain-test-999',
            winner: {
                id: 'pattern-master',
                name: 'Pattern Master',
                approach: 'pattern-matching',
                confidence: 0.88,
                inventory: Array(10).fill().map((_, i) => [`chain-item${i}`, `value${i}`])
            },
            duration: 18000,
            rounds: 3,
            participants: 8,
            generation: 0
        };
        
        const originalDNA = await this.genetic.generateTournamentDNA(originalTournament);
        chainSteps.push(`Tournament → DNA: ${originalDNA.tournamentDNA.substr(0, 20)}...`);
        
        // Step 2: DNA → Offspring
        const offspring = await this.genetic.spawnFromTournamentDNA(originalDNA.tournamentDNA, originalTournament);
        chainSteps.push(`DNA → Offspring: ${offspring.lineage} (${offspring.characterId.substr(0, 15)}...)`);
        
        // Step 3: Offspring → New Tournament (simulate)
        const nextTournament = {
            ...originalTournament,
            tournamentId: 'chain-next-999',
            generation: offspring.generation,
            winner: {
                id: offspring.characterId,
                name: `${offspring.lineage} Heir`,
                approach: offspring.tournamentApproach,
                confidence: offspring.inheritedTraits.confidence,
                inventory: Array(offspring.knowledgeCapacity).fill().map((_, i) => [`heir-item${i}`, `value${i}`])
            }
        };
        
        const nextDNA = await this.genetic.generateTournamentDNA(nextTournament);
        chainSteps.push(`Offspring → Next Tournament → DNA: ${nextDNA.tournamentDNA.substr(0, 20)}...`);
        
        // Step 4: Test that the chain is deterministic
        const duplicateOriginalDNA = await this.genetic.generateTournamentDNA(originalTournament);
        const duplicateOffspring = await this.genetic.spawnFromTournamentDNA(duplicateOriginalDNA.tournamentDNA, originalTournament);
        
        const chainIsReproducible = originalDNA.tournamentDNA === duplicateOriginalDNA.tournamentDNA &&
                                   offspring.characterId === duplicateOffspring.characterId &&
                                   offspring.bloodline === duplicateOffspring.bloodline;
        
        console.log('   Chain Steps:');
        chainSteps.forEach((step, i) => console.log(`     ${i + 1}. ${step}`));
        console.log(`   Chain Reproducible: ${chainIsReproducible ? '✅ PASS' : '❌ FAIL'}`);
        
        return chainIsReproducible;
    }
}

// Run tests
if (require.main === module) {
    (async () => {
        const tester = new LineageSpawningTest();
        const success = await tester.runAllTests();
        process.exit(success ? 0 : 1);
    })();
}

module.exports = LineageSpawningTest;
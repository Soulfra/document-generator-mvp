/**
 * 🎵 Musical Cryptographic Family Generator
 * 
 * Creates character families using prime number sequences that map to musical patterns.
 * Each character gets:
 * - Prime sequence (1, 11, 23, 253...) for cryptographic identity  
 * - Musical family key signature and harmonic relationships
 * - Genealogical hierarchy with parent/child octave inheritance
 * - Binary decomposition of primes into musical note patterns
 * 
 * Features:
 * - Prime number family trees with mathematical inheritance
 * - Musical key signatures for family identification  
 * - Octave-based genealogical relationships
 * - Harmonic frequency allocation for device authentication
 * - Cryptographic bit patterns derived from musical intervals
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class MusicCryptoFamily extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Prime sequence configuration
            maxSequenceLength: config.maxSequenceLength || 50,
            primeSearchLimit: config.primeSearchLimit || 10000,
            familySize: config.familySize || 12, // Max family members
            
            // Musical configuration
            musicalKeys: [
                'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 
                'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'
            ],
            modes: ['Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian'],
            octaveRange: { min: 0, max: 8 }, // Musical octave range
            baseFrequency: 440, // A4 = 440 Hz
            
            // Genealogy configuration
            maxGenerations: config.maxGenerations || 7,
            branchingFactor: config.branchingFactor || 3,
            
            // Cryptographic configuration
            keyBitLength: 256,
            hashAlgorithm: 'sha256'
        };
        
        // Family storage
        this.families = new Map(); // familyId -> FamilyData
        this.characters = new Map(); // characterId -> CharacterData
        this.genealogy = new Map(); // familyId -> GenealogyTree
        this.musicalMappings = new Map(); // familyId -> MusicalProfile
        
        // Prime number utilities
        this.primeCache = [];
        this.fibonacciPrimes = [];
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎵 Initializing Musical Cryptographic Family Generator...');
        
        // Generate prime number cache
        await this.generatePrimeCache();
        
        // Generate special prime sequences
        await this.generateFibonacciPrimes();
        
        console.log(`✅ Generated ${this.primeCache.length} primes and ${this.fibonacciPrimes.length} Fibonacci primes`);
        
        this.emit('initialized');
    }
    
    /**
     * Generate cache of prime numbers for family generation
     */
    async generatePrimeCache() {
        const sieve = new Array(this.config.primeSearchLimit).fill(true);
        sieve[0] = sieve[1] = false;
        
        for (let i = 2; i * i < this.config.primeSearchLimit; i++) {
            if (sieve[i]) {
                for (let j = i * i; j < this.config.primeSearchLimit; j += i) {
                    sieve[j] = false;
                }
            }
        }
        
        this.primeCache = sieve
            .map((isPrime, num) => isPrime ? num : null)
            .filter(num => num !== null);
    }
    
    /**
     * Generate special Fibonacci-based prime sequences
     */
    async generateFibonacciPrimes() {
        const fibonacci = [1, 1];
        
        // Generate Fibonacci sequence
        while (fibonacci[fibonacci.length - 1] < 10000) {
            const next = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
            fibonacci.push(next);
        }
        
        // Find primes in Fibonacci sequence
        this.fibonacciPrimes = fibonacci.filter(num => this.isPrime(num));
    }
    
    /**
     * Check if a number is prime
     */
    isPrime(n) {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        
        for (let i = 3; i * i <= n; i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    }
    
    /**
     * Create a new musical family with prime number sequence
     */
    async createFamily(familyName, parentFamilyId = null) {
        const familyId = crypto.randomUUID();
        
        // Generate unique prime sequence for this family
        const primeSequence = await this.generateFamilyPrimeSequence(familyId);
        
        // Map to musical key signature
        const musicalProfile = await this.generateMusicalProfile(primeSequence, parentFamilyId);
        
        // Create genealogical hierarchy
        const genealogy = await this.createGenealogyTree(familyId, parentFamilyId);
        
        const family = {
            id: familyId,
            name: familyName,
            primeSequence,
            musicalProfile,
            genealogy,
            parentFamily: parentFamilyId,
            childFamilies: [],
            members: [],
            createdAt: new Date(),
            generation: parentFamilyId ? this.families.get(parentFamilyId).generation + 1 : 0
        };
        
        // Add to parent's children
        if (parentFamilyId && this.families.has(parentFamilyId)) {
            this.families.get(parentFamilyId).childFamilies.push(familyId);
        }
        
        this.families.set(familyId, family);
        this.genealogy.set(familyId, genealogy);
        this.musicalMappings.set(familyId, musicalProfile);
        
        console.log(`🎼 Created family "${familyName}" with key signature ${musicalProfile.keySignature}`);
        
        this.emit('familyCreated', family);
        return family;
    }
    
    /**
     * Generate unique prime sequence for a family
     */
    async generateFamilyPrimeSequence(familyId) {
        // Use familyId as seed for deterministic but unique sequence
        const seed = crypto.createHash('sha256').update(familyId).digest();
        
        const sequence = [1]; // Always start with 1
        let currentIndex = 0;
        
        // Generate sequence like 1, 11, 23, 253...
        for (let i = 1; i < this.config.maxSequenceLength; i++) {
            // Use seed bytes to determine next prime index
            const byteIndex = i % seed.length;
            const offset = seed[byteIndex] % 100; // Pseudo-random offset
            
            currentIndex = (currentIndex + offset + i) % this.primeCache.length;
            const nextPrime = this.primeCache[currentIndex];
            
            // Create compound number like 253 (combine with previous)
            let next;
            if (i <= 2) {
                next = nextPrime;
            } else {
                // Combine with previous numbers for complexity
                const prev = sequence[i - 1];
                next = parseInt(prev.toString() + nextPrime.toString().slice(-1));
            }
            
            sequence.push(next);
        }
        
        return sequence;
    }
    
    /**
     * Generate musical profile from prime sequence
     */
    async generateMusicalProfile(primeSequence, parentFamilyId) {
        const firstPrime = primeSequence[1] || 11; // Skip the 1
        
        // Map prime to musical key (modulo 12 for 12-tone system)
        const keyIndex = firstPrime % 12;
        const key = this.config.musicalKeys[keyIndex];
        
        // Determine mode based on sum of sequence
        const sequenceSum = primeSequence.reduce((a, b) => a + b, 0);
        const modeIndex = sequenceSum % this.config.modes.length;
        const mode = this.config.modes[modeIndex];
        
        // Generate harmonic series based on primes
        const harmonics = primeSequence.slice(0, 8).map(prime => ({
            frequency: this.config.baseFrequency * (prime / 11), // Normalize to first meaningful prime
            harmonic: prime,
            note: this.frequencyToNote(this.config.baseFrequency * (prime / 11))
        }));
        
        // Determine octave range based on generation
        let octaveBase = 4; // Middle octaves
        if (parentFamilyId && this.families.has(parentFamilyId)) {
            const parentOctave = this.musicalMappings.get(parentFamilyId).octaveBase;
            octaveBase = Math.min(parentOctave + 1, this.config.octaveRange.max);
        }
        
        const profile = {
            keySignature: `${key} ${mode}`,
            key,
            mode,
            octaveBase,
            octaveRange: [octaveBase - 1, octaveBase + 2],
            harmonics,
            chordProgression: this.generateChordProgression(key, mode),
            rhythmPattern: this.generateRhythmPattern(primeSequence),
            melodyPattern: this.generateMelodyPattern(primeSequence)
        };
        
        return profile;
    }
    
    /**
     * Convert frequency to musical note
     */
    frequencyToNote(frequency) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75); // C0 frequency
        
        if (frequency > C0) {
            const h = Math.round(12 * Math.log2(frequency / C0));
            const octave = Math.floor(h / 12);
            const n = h % 12;
            return this.config.musicalKeys[n] + octave;
        }
        return 'C0';
    }
    
    /**
     * Generate chord progression from key and mode
     */
    generateChordProgression(key, mode) {
        // Basic progressions based on mode
        const progressions = {
            'Major': ['I', 'V', 'vi', 'IV'],
            'Minor': ['i', 'VII', 'VI', 'VII'],
            'Dorian': ['i', 'II', 'VII', 'i'],
            'Phrygian': ['i', 'bII', 'bVII', 'i'],
            'Lydian': ['I', '#IV', 'V', 'I'],
            'Mixolydian': ['I', 'bVII', 'IV', 'I']
        };
        
        return progressions[mode] || progressions['Major'];
    }
    
    /**
     * Generate rhythm pattern from prime sequence
     */
    generateRhythmPattern(primeSequence) {
        // Map primes to rhythm values
        return primeSequence.slice(0, 8).map(prime => {
            const duration = prime % 8; // 0-7 maps to different note values
            const divisions = ['whole', 'half', 'quarter', 'eighth', 
                             'sixteenth', 'thirty-second', 'sixty-fourth', 'triplet'];
            return divisions[duration];
        });
    }
    
    /**
     * Generate melody pattern from prime sequence
     */
    generateMelodyPattern(primeSequence) {
        // Convert primes to melodic intervals
        return primeSequence.slice(0, 16).map((prime, index) => {
            const interval = prime % 12; // Semitone interval
            const direction = prime % 2 === 0 ? 'up' : 'down';
            const octaveJump = prime > 100 ? Math.floor(prime / 100) : 0;
            
            return {
                interval,
                direction,
                octaveJump,
                note: this.config.musicalKeys[interval],
                emphasis: this.isPrime(prime) ? 'strong' : 'weak'
            };
        });
    }
    
    /**
     * Create genealogical tree structure
     */
    async createGenealogyTree(familyId, parentFamilyId) {
        const tree = {
            familyId,
            parentId: parentFamilyId,
            children: [],
            generation: parentFamilyId ? this.genealogy.get(parentFamilyId).generation + 1 : 0,
            maxGeneration: this.config.maxGenerations,
            branchingPattern: this.generateBranchingPattern(familyId),
            inheritanceRules: this.generateInheritanceRules(parentFamilyId)
        };
        
        return tree;
    }
    
    /**
     * Generate branching pattern for family expansion
     */
    generateBranchingPattern(familyId) {
        const hash = crypto.createHash('md5').update(familyId).digest('hex');
        const pattern = [];
        
        for (let i = 0; i < this.config.branchingFactor; i++) {
            const byte = parseInt(hash.substr(i * 2, 2), 16);
            pattern.push({
                probability: byte / 255,
                musicalInterval: byte % 12,
                octaveModification: Math.floor(byte / 85) - 1 // -1, 0, +1
            });
        }
        
        return pattern;
    }
    
    /**
     * Generate inheritance rules from parent family
     */
    generateInheritanceRules(parentFamilyId) {
        if (!parentFamilyId || !this.musicalMappings.has(parentFamilyId)) {
            return {
                keyInheritance: 'free', // No constraints
                octaveInheritance: 'independent',
                harmonicInheritance: 'original'
            };
        }
        
        const parentProfile = this.musicalMappings.get(parentFamilyId);
        
        return {
            keyInheritance: 'related', // Same key or relative minor/major
            octaveInheritance: 'ascending', // Higher octave than parent
            harmonicInheritance: 'partial', // Share some harmonics
            parentKey: parentProfile.key,
            parentMode: parentProfile.mode,
            parentOctave: parentProfile.octaveBase
        };
    }
    
    /**
     * Create a character within a family
     */
    async createCharacter(name, familyId, traits = {}) {
        if (!this.families.has(familyId)) {
            throw new Error(`Family ${familyId} does not exist`);
        }
        
        const characterId = crypto.randomUUID();
        const family = this.families.get(familyId);
        const musicalProfile = this.musicalMappings.get(familyId);
        
        // Generate individual character prime
        const characterPrime = this.generateCharacterPrime(characterId, family.primeSequence);
        
        // Generate musical identity from character prime
        const musicalIdentity = this.generateCharacterMusicalIdentity(characterPrime, musicalProfile);
        
        // Generate cryptographic identity
        const cryptoIdentity = this.generateCryptographicIdentity(characterPrime, family.primeSequence);
        
        const character = {
            id: characterId,
            name,
            familyId,
            characterPrime,
            musicalIdentity,
            cryptoIdentity,
            traits,
            generation: family.generation,
            createdAt: new Date()
        };
        
        // Add to family
        family.members.push(characterId);
        this.characters.set(characterId, character);
        
        console.log(`👤 Created character "${name}" with prime ${characterPrime} in family ${family.name}`);
        
        this.emit('characterCreated', character);
        return character;
    }
    
    /**
     * Generate unique prime for individual character
     */
    generateCharacterPrime(characterId, familySequence) {
        const seed = crypto.createHash('sha256').update(characterId).digest();
        const familySum = familySequence.reduce((a, b) => a + b, 0);
        
        // Find next prime after family influence
        const baseNumber = familySum + seed[0];
        return this.findNextPrime(baseNumber);
    }
    
    /**
     * Find next prime number after given number
     */
    findNextPrime(start) {
        for (let n = start; n < start + 1000; n++) {
            if (this.isPrime(n)) return n;
        }
        return start; // Fallback
    }
    
    /**
     * Generate musical identity for character
     */
    generateCharacterMusicalIdentity(characterPrime, familyProfile) {
        // Character's specific note in family key
        const noteIndex = characterPrime % 12;
        const personalNote = this.config.musicalKeys[noteIndex];
        
        // Character's octave within family range
        const octaveOffset = characterPrime % 3; // 0, 1, or 2
        const personalOctave = familyProfile.octaveBase + octaveOffset;
        
        // Character's specific frequency
        const personalFrequency = this.config.baseFrequency * 
            Math.pow(2, (personalOctave - 4) + (noteIndex - 9) / 12);
        
        return {
            personalNote,
            personalOctave,
            personalFrequency,
            familyKey: familyProfile.key,
            familyMode: familyProfile.mode,
            harmonicRelationship: this.calculateHarmonicRelationship(personalNote, familyProfile.key),
            melodySignature: this.generatePersonalMelody(characterPrime),
            voiceRange: [personalFrequency * 0.8, personalFrequency * 1.2]
        };
    }
    
    /**
     * Calculate harmonic relationship between personal note and family key
     */
    calculateHarmonicRelationship(personalNote, familyKey) {
        const personalIndex = this.config.musicalKeys.indexOf(personalNote);
        const familyIndex = this.config.musicalKeys.indexOf(familyKey);
        const interval = (personalIndex - familyIndex + 12) % 12;
        
        const relationships = [
            'unison', 'minor_second', 'major_second', 'minor_third',
            'major_third', 'perfect_fourth', 'tritone', 'perfect_fifth',
            'minor_sixth', 'major_sixth', 'minor_seventh', 'major_seventh'
        ];
        
        return relationships[interval];
    }
    
    /**
     * Generate personal melody signature for character
     */
    generatePersonalMelody(characterPrime) {
        const melody = [];
        let current = characterPrime;
        
        for (let i = 0; i < 8; i++) {
            // Generate next number in personal sequence
            current = (current * 1.618 + characterPrime) % 1000; // Golden ratio influence
            const noteIndex = Math.floor(current) % 12;
            const duration = Math.floor(current / 12) % 4;
            
            melody.push({
                note: this.config.musicalKeys[noteIndex],
                duration: ['quarter', 'eighth', 'half', 'sixteenth'][duration],
                pitch: Math.floor(current / 48) % 3 + 4 // Octave 4-6
            });
        }
        
        return melody;
    }
    
    /**
     * Generate cryptographic identity from prime numbers
     */
    generateCryptographicIdentity(characterPrime, familySequence) {
        // Convert prime to binary
        const primeBinary = characterPrime.toString(2);
        
        // Create hash incorporating family sequence
        const familyHash = crypto.createHash(this.config.hashAlgorithm)
            .update(JSON.stringify(familySequence))
            .digest('hex');
        
        // Create character-specific hash
        const characterHash = crypto.createHash(this.config.hashAlgorithm)
            .update(characterPrime.toString() + familyHash)
            .digest('hex');
        
        // Decompose into musical bit patterns
        const bitPatterns = this.decomposeToBitPatterns(primeBinary);
        
        return {
            prime: characterPrime,
            primeBinary,
            familyHash: familyHash.slice(0, 16), // Short version
            characterHash: characterHash.slice(0, 16),
            bitPatterns,
            cryptographicSeed: characterHash
        };
    }
    
    /**
     * Decompose prime binary into musical bit patterns
     */
    decomposeToBitPatterns(binary) {
        const patterns = [];
        
        // Split binary into 4-bit chunks (corresponds to musical measures)
        for (let i = 0; i < binary.length; i += 4) {
            const chunk = binary.slice(i, i + 4).padEnd(4, '0');
            const decimal = parseInt(chunk, 2);
            
            patterns.push({
                bits: chunk,
                decimal,
                musicalInterval: decimal % 12,
                rhythmValue: decimal % 8,
                note: this.config.musicalKeys[decimal % 12],
                emphasis: decimal > 8 ? 'strong' : 'weak'
            });
        }
        
        return patterns;
    }
    
    /**
     * Get family tree with musical relationships
     */
    getFamilyTree(familyId) {
        if (!this.families.has(familyId)) {
            throw new Error(`Family ${familyId} does not exist`);
        }
        
        const family = this.families.get(familyId);
        const musical = this.musicalMappings.get(familyId);
        const genealogy = this.genealogy.get(familyId);
        
        const tree = {
            family: {
                id: family.id,
                name: family.name,
                keySignature: musical.keySignature,
                generation: family.generation
            },
            parent: family.parentFamily ? this.getFamilyTree(family.parentFamily) : null,
            children: family.childFamilies.map(childId => this.getFamilyTree(childId)),
            members: family.members.map(characterId => {
                const character = this.characters.get(characterId);
                return {
                    id: character.id,
                    name: character.name,
                    personalNote: character.musicalIdentity.personalNote,
                    personalOctave: character.musicalIdentity.personalOctave,
                    prime: character.characterPrime
                };
            })
        };
        
        return tree;
    }
    
    /**
     * Generate authentication melody for character
     */
    generateAuthenticationMelody(characterId) {
        if (!this.characters.has(characterId)) {
            throw new Error(`Character ${characterId} does not exist`);
        }
        
        const character = this.characters.get(characterId);
        const family = this.families.get(character.familyId);
        
        // Combine family sequence with character prime for unique melody
        const sequence = [...family.primeSequence, character.characterPrime];
        
        const melody = sequence.map((prime, index) => ({
            frequency: this.config.baseFrequency * (prime / sequence[0]) * 
                      Math.pow(2, (index % 3) - 1), // Octave variations
            duration: 0.2 + (prime % 5) * 0.1, // 0.2-0.6 seconds
            note: this.config.musicalKeys[prime % 12],
            octave: 4 + (index % 3),
            order: index
        }));
        
        return {
            characterId,
            familyKey: this.musicalMappings.get(character.familyId).keySignature,
            melody,
            totalDuration: melody.reduce((sum, note) => sum + note.duration, 0),
            checksum: crypto.createHash('md5').update(JSON.stringify(melody)).digest('hex').slice(0, 8)
        };
    }
    
    /**
     * Verify if a played melody matches character authentication
     */
    verifyAuthenticationMelody(characterId, playedMelody, tolerance = 0.1) {
        const expectedMelody = this.generateAuthenticationMelody(characterId);
        
        if (playedMelody.length !== expectedMelody.melody.length) {
            return { valid: false, reason: 'Length mismatch' };
        }
        
        for (let i = 0; i < playedMelody.length; i++) {
            const expected = expectedMelody.melody[i];
            const played = playedMelody[i];
            
            // Check frequency within tolerance
            const freqDiff = Math.abs(expected.frequency - played.frequency) / expected.frequency;
            if (freqDiff > tolerance) {
                return { 
                    valid: false, 
                    reason: `Frequency mismatch at note ${i}`,
                    expected: expected.frequency,
                    received: played.frequency
                };
            }
        }
        
        return { 
            valid: true, 
            characterId,
            familyId: this.characters.get(characterId).familyId,
            confidence: 1 - (playedMelody.reduce((sum, note, i) => {
                return sum + Math.abs(expectedMelody.melody[i].frequency - note.frequency) / 
                       expectedMelody.melody[i].frequency;
            }, 0) / playedMelody.length)
        };
    }
    
    /**
     * Export family data for integration with other systems
     */
    exportFamily(familyId) {
        if (!this.families.has(familyId)) {
            throw new Error(`Family ${familyId} does not exist`);
        }
        
        const family = this.families.get(familyId);
        const musical = this.musicalMappings.get(familyId);
        const genealogy = this.genealogy.get(familyId);
        
        return {
            family,
            musical,
            genealogy,
            members: family.members.map(id => this.characters.get(id)),
            exportedAt: new Date(),
            version: '1.0.0'
        };
    }
}

module.exports = MusicCryptoFamily;

// Example usage and testing
if (require.main === module) {
    async function demonstrateSystem() {
        console.log('🎵 Musical Cryptographic Family System Demo\n');
        
        const musicCrypto = new MusicCryptoFamily({
            maxSequenceLength: 10,
            maxGenerations: 3
        });
        
        // Wait for initialization
        await new Promise(resolve => musicCrypto.once('initialized', resolve));
        
        // Create root family
        const smithFamily = await musicCrypto.createFamily('Smith Family');
        console.log('\n📊 Smith Family Prime Sequence:', smithFamily.primeSequence);
        console.log('🎼 Smith Family Musical Profile:', smithFamily.musicalProfile.keySignature);
        
        // Create child family
        const smithJrFamily = await musicCrypto.createFamily('Smith Jr. Family', smithFamily.id);
        console.log('\n📊 Smith Jr. Family Prime Sequence:', smithJrFamily.primeSequence);
        console.log('🎼 Smith Jr. Family Musical Profile:', smithJrFamily.musicalProfile.keySignature);
        
        // Create characters
        const alice = await musicCrypto.createCharacter('Alice', smithFamily.id);
        const bob = await musicCrypto.createCharacter('Bob', smithJrFamily.id);
        
        console.log('\n👤 Alice Musical Identity:', alice.musicalIdentity.personalNote, 
                   alice.musicalIdentity.personalOctave);
        console.log('👤 Bob Musical Identity:', bob.musicalIdentity.personalNote, 
                   bob.musicalIdentity.personalOctave);
        
        // Generate authentication melodies
        const aliceMelody = musicCrypto.generateAuthenticationMelody(alice.id);
        const bobMelody = musicCrypto.generateAuthenticationMelody(bob.id);
        
        console.log('\n🎵 Alice Authentication Melody:');
        aliceMelody.melody.slice(0, 5).forEach((note, i) => {
            console.log(`  ${i + 1}. ${note.note}${note.octave} (${note.frequency.toFixed(1)}Hz) - ${note.duration}s`);
        });
        
        console.log('\n🎵 Bob Authentication Melody:');
        bobMelody.melody.slice(0, 5).forEach((note, i) => {
            console.log(`  ${i + 1}. ${note.note}${note.octave} (${note.frequency.toFixed(1)}Hz) - ${note.duration}s`);
        });
        
        // Show family tree
        const tree = musicCrypto.getFamilyTree(smithFamily.id);
        console.log('\n🌳 Family Tree:', JSON.stringify(tree, null, 2));
        
        console.log('\n✅ Musical Cryptographic Family System demonstration complete!');
    }
    
    demonstrateSystem().catch(console.error);
}
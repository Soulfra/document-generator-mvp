#!/usr/bin/env node

/**
 * BRAND MEME GENERATOR
 * Generates culturally relevant brands with viral meme potential
 * Combines trending topics, archetypes, and cultural patterns
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BrandMemeGenerator extends EventEmitter {
  constructor() {
    super();
    
    // Brand generation components
    this.nameGenerators = {
      tech: this.createTechNameGenerator(),
      meme: this.createMemeNameGenerator(),
      lifestyle: this.createLifestyleNameGenerator(),
      gaming: this.createGamingNameGenerator(),
      finance: this.createFinanceNameGenerator()
    };
    
    // Archetype personalities
    this.archetypes = {
      Hero: {
        traits: ['courageous', 'inspiring', 'protective'],
        messaging: ['empowerment', 'triumph', 'justice'],
        visualStyle: ['bold', 'dynamic', 'heroic']
      },
      Outlaw: {
        traits: ['rebellious', 'disruptive', 'revolutionary'],
        messaging: ['breaking rules', 'revolution', 'freedom'],
        visualStyle: ['edgy', 'dark', 'unconventional']
      },
      Magician: {
        traits: ['transformative', 'visionary', 'mystical'],
        messaging: ['transformation', 'innovation', 'dreams'],
        visualStyle: ['mystical', 'ethereal', 'futuristic']
      },
      Innocent: {
        traits: ['pure', 'optimistic', 'simple'],
        messaging: ['simplicity', 'goodness', 'nostalgia'],
        visualStyle: ['clean', 'bright', 'minimalist']
      },
      Explorer: {
        traits: ['adventurous', 'pioneering', 'independent'],
        messaging: ['discovery', 'freedom', 'journey'],
        visualStyle: ['natural', 'rugged', 'expansive']
      },
      Sage: {
        traits: ['wise', 'knowledgeable', 'thoughtful'],
        messaging: ['truth', 'understanding', 'expertise'],
        visualStyle: ['sophisticated', 'classic', 'refined']
      },
      Jester: {
        traits: ['playful', 'humorous', 'lighthearted'],
        messaging: ['fun', 'entertainment', 'joy'],
        visualStyle: ['colorful', 'playful', 'whimsical']
      },
      Everyman: {
        traits: ['relatable', 'friendly', 'genuine'],
        messaging: ['belonging', 'community', 'authenticity'],
        visualStyle: ['approachable', 'comfortable', 'familiar']
      },
      Lover: {
        traits: ['passionate', 'intimate', 'sensual'],
        messaging: ['passion', 'beauty', 'relationships'],
        visualStyle: ['romantic', 'elegant', 'sensual']
      },
      Caregiver: {
        traits: ['nurturing', 'protective', 'generous'],
        messaging: ['care', 'protection', 'service'],
        visualStyle: ['warm', 'soft', 'comforting']
      },
      Creator: {
        traits: ['creative', 'artistic', 'imaginative'],
        messaging: ['creation', 'imagination', 'expression'],
        visualStyle: ['artistic', 'unique', 'expressive']
      },
      Ruler: {
        traits: ['powerful', 'responsible', 'organized'],
        messaging: ['control', 'leadership', 'prosperity'],
        visualStyle: ['luxurious', 'commanding', 'structured']
      }
    };
    
    // Meme patterns and templates
    this.memePatterns = {
      formats: [
        'ToTheMoon', 'Inu', 'DAO', 'Protocol', 'Labs', 'Studio',
        'Collective', 'Network', 'Ecosystem', 'Metaverse', 'Verse'
      ],
      prefixes: [
        'Based', 'Giga', 'Ultra', 'Meta', 'Quantum', 'Cyber',
        'Digital', 'Virtual', 'Cosmic', 'Neon', 'Pixel'
      ],
      suffixes: [
        'fi', 'ly', 'ify', 'hub', 'space', 'zone', 'core',
        'base', 'chain', 'link', 'sync', 'flow'
      ]
    };
    
    // Cultural references database
    this.culturalReferences = {
      current: [],
      classics: [
        'SpaceX', 'Tesla', 'Bitcoin', 'Ethereum', 'NFT',
        'Metaverse', 'AI', 'Quantum', 'Web3', 'DeFi'
      ],
      emerging: []
    };
    
    // Visual style mappings
    this.visualStyles = {
      cyberpunk: {
        colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC'],
        fonts: ['Orbitron', 'Audiowide', 'Exo'],
        elements: ['neon', 'glitch', 'holographic']
      },
      minimalist: {
        colors: ['#000000', '#FFFFFF', '#F0F0F0', '#333333'],
        fonts: ['Helvetica', 'Inter', 'SF Pro'],
        elements: ['clean', 'space', 'geometric']
      },
      retro: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
        fonts: ['Bebas Neue', 'Pacifico', 'Permanent Marker'],
        elements: ['vintage', 'nostalgic', 'gradient']
      },
      web3: {
        colors: ['#7B3FF2', '#FF3864', '#2DE370', '#00D4FF'],
        fonts: ['Space Grotesk', 'DM Sans', 'Clash Display'],
        elements: ['gradient', 'glass', '3d']
      }
    };
    
    // Brand generation metrics
    this.metrics = {
      totalGenerated: 0,
      viralHits: 0,
      averageMemePotential: 0,
      topArchetypes: new Map(),
      trendingStyles: new Map()
    };
    
    console.log('🎭 Brand Meme Generator initialized');
    console.log('🚀 Ready to generate culturally relevant brands');
    console.log('📈 Meme potential calculation enabled');
  }
  
  /**
   * Generate a brand based on cultural context
   */
  async generateBrand(context = {}) {
    const startTime = Date.now();
    
    // Determine brand category
    const category = context.category || this.selectCategory(context);
    
    // Select archetype based on cultural mood
    const archetype = context.archetype || this.selectArchetype(context.culturalMood, category);
    
    // Generate brand name
    const name = await this.generateBrandName(category, context.trends || [], archetype);
    
    // Create brand narrative
    const narrative = this.createBrandNarrative(name, archetype, context);
    
    // Determine visual style
    const visualStyle = this.determineVisualStyle(archetype, context.culturalMood, category);
    
    // Calculate meme potential
    const memePotential = this.calculateMemePotential(name, context.trends || [], archetype);
    
    // Generate brand components
    const brand = {
      id: `brand_${crypto.randomBytes(8).toString('hex')}`,
      name,
      category,
      archetype,
      narrative,
      visualStyle,
      memePotential,
      tagline: this.generateTagline(name, archetype),
      values: this.extractBrandValues(archetype, context),
      targetAudience: this.identifyTargetAudience(category, archetype),
      positioning: this.createPositioning(name, category, archetype),
      culturalReferences: this.extractCulturalReferences(context),
      generatedAt: Date.now(),
      generationTime: Date.now() - startTime
    };
    
    // Update metrics
    this.updateMetrics(brand);
    
    console.log(`🎨 Generated brand: ${brand.name} (${archetype} ${category})`);
    console.log(`📊 Meme potential: ${(memePotential * 100).toFixed(1)}%`);
    
    this.emit('brand_generated', brand);
    
    return brand;
  }
  
  /**
   * Generate brand name based on category and trends
   */
  async generateBrandName(category, trends, archetype) {
    const generator = this.nameGenerators[category] || this.nameGenerators.meme;
    
    // Get trending words
    const trendingWords = this.extractTrendingWords(trends);
    
    // Generate name options
    const options = [];
    
    // Trend-based name
    if (trendingWords.length > 0) {
      options.push(generator.fromTrends(trendingWords, archetype));
    }
    
    // Archetype-based name
    options.push(generator.fromArchetype(archetype));
    
    // Meme-format name
    options.push(generator.memeFormat(trendingWords));
    
    // Category-specific name
    options.push(generator.categorySpecific());
    
    // Select best option based on criteria
    const selectedName = this.selectBestName(options, trends, archetype);
    
    return selectedName;
  }
  
  /**
   * Create tech name generator
   */
  createTechNameGenerator() {
    return {
      fromTrends: (trends, archetype) => {
        const base = trends[Math.floor(Math.random() * trends.length)] || 'Tech';
        const suffix = ['Labs', 'AI', 'Tech', 'Digital', 'Systems'][Math.floor(Math.random() * 5)];
        return `${base}${suffix}`;
      },
      
      fromArchetype: (archetype) => {
        const prefixes = {
          Hero: ['Shield', 'Guard', 'Protect'],
          Magician: ['Quantum', 'Neural', 'Synth'],
          Creator: ['Build', 'Forge', 'Make'],
          Explorer: ['Scout', 'Pioneer', 'Venture']
        };
        
        const prefix = prefixes[archetype]?.[Math.floor(Math.random() * 3)] || 'Tech';
        const suffix = ['AI', 'Labs', 'Core'][Math.floor(Math.random() * 3)];
        
        return `${prefix}${suffix}`;
      },
      
      memeFormat: (trends) => {
        const memePrefix = this.memePatterns.prefixes[Math.floor(Math.random() * this.memePatterns.prefixes.length)];
        const base = trends[0] || 'Tech';
        return `${memePrefix}${base}`;
      },
      
      categorySpecific: () => {
        const techTerms = ['Nexus', 'Vertex', 'Matrix', 'Cipher', 'Vector', 'Prism'];
        const term = techTerms[Math.floor(Math.random() * techTerms.length)];
        const suffix = ['Labs', 'AI', 'Tech'][Math.floor(Math.random() * 3)];
        return `${term}${suffix}`;
      }
    };
  }
  
  /**
   * Create meme name generator
   */
  createMemeNameGenerator() {
    return {
      fromTrends: (trends, archetype) => {
        const base = trends[0] || this.culturalReferences.classics[Math.floor(Math.random() * this.culturalReferences.classics.length)];
        const format = this.memePatterns.formats[Math.floor(Math.random() * this.memePatterns.formats.length)];
        return `${base}${format}`;
      },
      
      fromArchetype: (archetype) => {
        const archetypeMap = {
          Jester: ['Meme', 'Lol', 'Kek', 'Based'],
          Outlaw: ['Degen', 'Anon', 'Rebel', 'Rogue'],
          Explorer: ['Moon', 'Mars', 'Alpha', 'Nova']
        };
        
        const base = archetypeMap[archetype]?.[Math.floor(Math.random() * 4)] || 'Meme';
        const suffix = ['Protocol', 'DAO', 'Club'][Math.floor(Math.random() * 3)];
        
        return `${base}${suffix}`;
      },
      
      memeFormat: (trends) => {
        const formats = ['ToTheMoon', 'Inu', 'Doge', 'Pepe', 'Wojak'];
        const base = trends[0] || 'Crypto';
        const format = formats[Math.floor(Math.random() * formats.length)];
        
        return Math.random() > 0.5 ? `${base}${format}` : `${format}${base}`;
      },
      
      categorySpecific: () => {
        const memeWords = ['Based', 'Giga', 'Chad', 'Sigma', 'Alpha', 'Diamond'];
        const word = memeWords[Math.floor(Math.random() * memeWords.length)];
        const suffix = ['Protocol', 'DAO', 'Network'][Math.floor(Math.random() * 3)];
        return `${word}${suffix}`;
      }
    };
  }
  
  /**
   * Create lifestyle name generator
   */
  createLifestyleNameGenerator() {
    return {
      fromTrends: (trends, archetype) => {
        const base = trends[0] || 'Life';
        const suffixes = ['ly', 'ify', 'hub', 'space', 'studio'];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `${base}${suffix}`;
      },
      
      fromArchetype: (archetype) => {
        const archetypeMap = {
          Caregiver: ['Nurture', 'Care', 'Wellness'],
          Innocent: ['Pure', 'Simple', 'Bloom'],
          Lover: ['Bliss', 'Aura', 'Essence']
        };
        
        const base = archetypeMap[archetype]?.[Math.floor(Math.random() * 3)] || 'Life';
        const suffix = ['ly', 'hub', 'studio'][Math.floor(Math.random() * 3)];
        
        return `${base}${suffix}`;
      },
      
      memeFormat: () => {
        const lifestyle = ['Vibe', 'Zen', 'Flow', 'Glow'];
        const base = lifestyle[Math.floor(Math.random() * lifestyle.length)];
        const suffix = ['ify', 'ly', 'hub'][Math.floor(Math.random() * 3)];
        return `${base}${suffix}`;
      },
      
      categorySpecific: () => {
        const terms = ['Bloom', 'Haven', 'Oasis', 'Sphere', 'Wave'];
        const term = terms[Math.floor(Math.random() * terms.length)];
        const suffix = ['life', 'living', 'style'][Math.floor(Math.random() * 3)];
        return `${term}${suffix}`;
      }
    };
  }
  
  /**
   * Create gaming name generator
   */
  createGamingNameGenerator() {
    return {
      fromTrends: (trends, archetype) => {
        const base = trends[0] || 'Game';
        const suffixes = ['verse', 'craft', 'quest', 'realm', 'forge'];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `${base}${suffix}`;
      },
      
      fromArchetype: (archetype) => {
        const archetypeMap = {
          Hero: ['Epic', 'Legend', 'Valor'],
          Explorer: ['Quest', 'Odyssey', 'Journey'],
          Magician: ['Arcane', 'Mystic', 'Enchant']
        };
        
        const base = archetypeMap[archetype]?.[Math.floor(Math.random() * 3)] || 'Game';
        const suffix = ['Games', 'Studios', 'Forge'][Math.floor(Math.random() * 3)];
        
        return `${base}${suffix}`;
      },
      
      memeFormat: (trends) => {
        const gaming = ['Pixel', 'Bit', 'Byte', 'Neon'];
        const base = gaming[Math.floor(Math.random() * gaming.length)];
        const suffix = trends[0] || 'Games';
        return `${base}${suffix}`;
      },
      
      categorySpecific: () => {
        const terms = ['Nexus', 'Portal', 'Arena', 'Citadel', 'Frontier'];
        const term = terms[Math.floor(Math.random() * terms.length)];
        const suffix = ['Gaming', 'Games', 'Play'][Math.floor(Math.random() * 3)];
        return `${term}${suffix}`;
      }
    };
  }
  
  /**
   * Create finance name generator
   */
  createFinanceNameGenerator() {
    return {
      fromTrends: (trends, archetype) => {
        const base = trends[0] || 'Capital';
        const suffixes = ['Finance', 'Capital', 'Pay', 'Wallet', 'Vault'];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return base.length < 8 ? `${base}${suffix}` : `${base}Fi`;
      },
      
      fromArchetype: (archetype) => {
        const archetypeMap = {
          Ruler: ['Crown', 'Sovereign', 'Prime'],
          Sage: ['Wise', 'Oracle', 'Insight'],
          Hero: ['Shield', 'Guard', 'Secure']
        };
        
        const base = archetypeMap[archetype]?.[Math.floor(Math.random() * 3)] || 'Trust';
        const suffix = ['Capital', 'Finance', 'Wealth'][Math.floor(Math.random() * 3)];
        
        return `${base}${suffix}`;
      },
      
      memeFormat: (trends) => {
        const defi = ['Yield', 'Swap', 'Stake', 'Vault'];
        const base = defi[Math.floor(Math.random() * defi.length)];
        const suffix = trends[0] ? trends[0].slice(0, 4) : 'Fi';
        return `${base}${suffix}`;
      },
      
      categorySpecific: () => {
        const terms = ['Apex', 'Zenith', 'Summit', 'Pinnacle', 'Vertex'];
        const term = terms[Math.floor(Math.random() * terms.length)];
        const suffix = ['Capital', 'Wealth', 'Finance'][Math.floor(Math.random() * 3)];
        return `${term}${suffix}`;
      }
    };
  }
  
  /**
   * Select best name from options
   */
  selectBestName(options, trends, archetype) {
    // Score each option
    const scoredOptions = options.map(name => ({
      name,
      score: this.scoreNameOption(name, trends, archetype)
    }));
    
    // Sort by score
    scoredOptions.sort((a, b) => b.score - a.score);
    
    // Return best option
    return scoredOptions[0].name;
  }
  
  /**
   * Score name option based on criteria
   */
  scoreNameOption(name, trends, archetype) {
    let score = 0;
    
    // Length score (7-12 characters is ideal)
    const length = name.length;
    if (length >= 7 && length <= 12) score += 20;
    else if (length >= 5 && length <= 15) score += 10;
    
    // Memorability (simple syllables)
    const syllables = this.countSyllables(name);
    if (syllables <= 3) score += 15;
    
    // Trend relevance
    trends.forEach(trend => {
      if (name.toLowerCase().includes(trend.toLowerCase())) {
        score += 25;
      }
    });
    
    // Uniqueness (not too generic)
    const genericTerms = ['tech', 'digital', 'online', 'web'];
    const isGeneric = genericTerms.some(term => name.toLowerCase() === term);
    if (!isGeneric) score += 10;
    
    // Meme format bonus
    const memeFormats = ['Protocol', 'DAO', 'Inu', 'ToTheMoon'];
    if (memeFormats.some(format => name.includes(format))) {
      score += 15;
    }
    
    return score;
  }
  
  /**
   * Count syllables in a word (approximate)
   */
  countSyllables(word) {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = 'aeiou'.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e')) count--;
    
    return Math.max(1, count);
  }
  
  /**
   * Create brand narrative
   */
  createBrandNarrative(name, archetype, context) {
    const archetypeData = this.archetypes[archetype];
    const mood = context.culturalMood || 'neutral';
    
    const narrativeTemplates = {
      optimistic: `${name} emerges as a ${archetypeData.traits[0]} force in the digital landscape, embodying ${archetypeData.messaging[0]} and inspiring ${archetypeData.messaging[1]}.`,
      
      neutral: `${name} represents a new paradigm of ${archetypeData.messaging[0]}, bringing ${archetypeData.traits[1]} innovation to those seeking ${archetypeData.messaging[2]}.`,
      
      cautious: `In uncertain times, ${name} stands as a ${archetypeData.traits[2]} beacon, offering ${archetypeData.messaging[1]} through ${archetypeData.traits[0]} leadership.`,
      
      rebellious: `${name} breaks the mold with ${archetypeData.traits[0]} attitude, challenging conventions and promoting ${archetypeData.messaging[0]} for all.`
    };
    
    const template = narrativeTemplates[mood] || narrativeTemplates.neutral;
    
    return {
      elevator: template,
      extended: this.generateExtendedNarrative(name, archetype, context),
      mission: this.generateMissionStatement(name, archetype),
      vision: this.generateVisionStatement(name, archetype, context)
    };
  }
  
  /**
   * Generate extended narrative
   */
  generateExtendedNarrative(name, archetype, context) {
    const archetypeData = this.archetypes[archetype];
    const trends = context.trends || [];
    
    let narrative = `Born from the intersection of ${trends.slice(0, 2).join(' and ') || 'innovation and culture'}, `;
    narrative += `${name} embodies the ${archetype} archetype with unwavering commitment to ${archetypeData.messaging[0]}. `;
    narrative += `Our ${archetypeData.traits[0]} approach transforms how people experience ${context.category || 'digital solutions'}, `;
    narrative += `creating a future where ${archetypeData.messaging[1]} meets ${archetypeData.messaging[2]}. `;
    narrative += `Every interaction with ${name} is designed to inspire ${archetypeData.traits[1]} thinking and ${archetypeData.traits[2]} action.`;
    
    return narrative;
  }
  
  /**
   * Generate mission statement
   */
  generateMissionStatement(name, archetype) {
    const archetypeData = this.archetypes[archetype];
    
    const templates = [
      `To ${archetypeData.messaging[0]} through ${archetypeData.traits[0]} innovation`,
      `Empowering people with ${archetypeData.traits[1]} solutions for ${archetypeData.messaging[1]}`,
      `Creating a world where ${archetypeData.messaging[2]} is accessible to all`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * Generate vision statement
   */
  generateVisionStatement(name, archetype, context) {
    const archetypeData = this.archetypes[archetype];
    const future = context.culturalMood === 'optimistic' ? 'brighter' : 'better';
    
    return `A ${future} future where ${archetypeData.messaging[0]} drives progress and ${archetypeData.traits[0]} leadership creates lasting ${archetypeData.messaging[2]}.`;
  }
  
  /**
   * Generate tagline
   */
  generateTagline(name, archetype) {
    const archetypeTaglines = {
      Hero: ['Courage in Action', 'Rise Above', 'Your Digital Champion'],
      Outlaw: ['Break the Rules', 'Defy Convention', 'Revolution Starts Here'],
      Magician: ['Transform Reality', 'Where Magic Happens', 'Imagine More'],
      Innocent: ['Pure and Simple', 'Back to Basics', 'Simply Better'],
      Explorer: ['Discover More', 'Journey Beyond', 'Explore Limitless'],
      Sage: ['Knowledge Empowers', 'Wisdom First', 'Truth Matters'],
      Jester: ['Seriously Fun', 'Joy Delivered', 'Laugh More'],
      Everyman: ['For Everyone', 'Real Solutions', 'Your Daily Companion'],
      Lover: ['Passion Meets Purpose', 'Love What You Do', 'Beautiful Connections'],
      Caregiver: ['Care First', 'Here for You', 'Nurturing Growth'],
      Creator: ['Create Without Limits', 'Imagine, Build, Share', 'Your Creative Partner'],
      Ruler: ['Lead with Confidence', 'Excellence Standard', 'Command Success']
    };
    
    const taglines = archetypeTaglines[archetype];
    return taglines[Math.floor(Math.random() * taglines.length)];
  }
  
  /**
   * Calculate meme potential
   */
  calculateMemePotential(name, trends, archetype) {
    let potential = 0;
    
    // Name factors
    if (name.length <= 10) potential += 0.1; // Short names spread easier
    if (this.countSyllables(name) <= 3) potential += 0.1; // Easy to pronounce
    
    // Meme format bonus
    const memeFormats = ['Protocol', 'DAO', 'Inu', 'ToTheMoon', 'Doge', 'Pepe'];
    if (memeFormats.some(format => name.includes(format))) {
      potential += 0.2;
    }
    
    // Archetype bonus
    const memeArchetypes = ['Jester', 'Outlaw', 'Explorer'];
    if (memeArchetypes.includes(archetype)) {
      potential += 0.15;
    }
    
    // Trend alignment
    const trendScore = Math.min(trends.length * 0.1, 0.3);
    potential += trendScore;
    
    // Cultural reference bonus
    const hasClassicRef = this.culturalReferences.classics.some(ref => 
      name.toLowerCase().includes(ref.toLowerCase())
    );
    if (hasClassicRef) potential += 0.15;
    
    // Randomness factor (viral is unpredictable)
    potential += Math.random() * 0.1;
    
    return Math.min(potential, 1); // Cap at 100%
  }
  
  /**
   * Determine visual style
   */
  determineVisualStyle(archetype, mood, category) {
    // Map archetypes to visual styles
    const archetypeStyles = {
      Hero: ['bold', 'dynamic', 'powerful'],
      Outlaw: ['edgy', 'dark', 'rebellious'],
      Magician: ['mystical', 'futuristic', 'ethereal'],
      Innocent: ['clean', 'minimalist', 'bright'],
      Explorer: ['natural', 'adventurous', 'expansive'],
      Sage: ['sophisticated', 'classic', 'refined'],
      Jester: ['playful', 'colorful', 'whimsical'],
      Everyman: ['friendly', 'approachable', 'comfortable'],
      Lover: ['elegant', 'romantic', 'sensual'],
      Caregiver: ['warm', 'soft', 'nurturing'],
      Creator: ['artistic', 'unique', 'expressive'],
      Ruler: ['luxurious', 'commanding', 'structured']
    };
    
    // Select base style
    const baseStyle = archetypeStyles[archetype][0];
    
    // Determine specific style based on category and mood
    let specificStyle = 'minimalist'; // default
    
    if (category === 'tech' && mood === 'optimistic') {
      specificStyle = 'cyberpunk';
    } else if (category === 'meme' || mood === 'rebellious') {
      specificStyle = 'web3';
    } else if (mood === 'nostalgic' || archetype === 'Innocent') {
      specificStyle = 'retro';
    } else if (archetype === 'Ruler' || archetype === 'Sage') {
      specificStyle = 'minimalist';
    }
    
    const style = this.visualStyles[specificStyle];
    
    return {
      name: specificStyle,
      baseStyle,
      colors: {
        primary: style.colors[0],
        secondary: style.colors[1],
        accent: style.colors[2],
        background: style.colors[3] || '#FFFFFF'
      },
      typography: {
        primary: style.fonts[0],
        secondary: style.fonts[1],
        display: style.fonts[2] || style.fonts[0]
      },
      elements: style.elements,
      mood: this.getVisualMood(archetype, specificStyle)
    };
  }
  
  /**
   * Get visual mood
   */
  getVisualMood(archetype, style) {
    const moods = {
      cyberpunk: 'futuristic and edgy',
      minimalist: 'clean and sophisticated',
      retro: 'nostalgic and playful',
      web3: 'modern and innovative'
    };
    
    return moods[style] || 'balanced and approachable';
  }
  
  /**
   * Extract brand values
   */
  extractBrandValues(archetype, context) {
    const archetypeValues = {
      Hero: ['courage', 'integrity', 'protection'],
      Outlaw: ['freedom', 'revolution', 'authenticity'],
      Magician: ['transformation', 'innovation', 'vision'],
      Innocent: ['simplicity', 'optimism', 'trust'],
      Explorer: ['discovery', 'freedom', 'adventure'],
      Sage: ['wisdom', 'truth', 'understanding'],
      Jester: ['joy', 'humor', 'lightheartedness'],
      Everyman: ['belonging', 'realism', 'empathy'],
      Lover: ['passion', 'commitment', 'beauty'],
      Caregiver: ['compassion', 'generosity', 'service'],
      Creator: ['creativity', 'imagination', 'self-expression'],
      Ruler: ['responsibility', 'leadership', 'prosperity']
    };
    
    const baseValues = archetypeValues[archetype];
    
    // Add context-specific values
    const contextValues = [];
    
    if (context.culturalMood === 'optimistic') {
      contextValues.push('progress');
    }
    
    if (context.category === 'tech') {
      contextValues.push('innovation');
    }
    
    if (context.trends?.includes('sustainability')) {
      contextValues.push('sustainability');
    }
    
    return [...baseValues, ...contextValues].slice(0, 5);
  }
  
  /**
   * Identify target audience
   */
  identifyTargetAudience(category, archetype) {
    const categoryAudiences = {
      tech: {
        primary: 'Tech enthusiasts and early adopters',
        age: '25-45',
        interests: ['innovation', 'technology', 'startups']
      },
      meme: {
        primary: 'Digital natives and crypto community',
        age: '18-35',
        interests: ['memes', 'crypto', 'internet culture']
      },
      lifestyle: {
        primary: 'Conscious consumers and wellness seekers',
        age: '25-55',
        interests: ['wellness', 'sustainability', 'self-improvement']
      },
      gaming: {
        primary: 'Gamers and digital entertainment fans',
        age: '16-40',
        interests: ['gaming', 'esports', 'streaming']
      },
      finance: {
        primary: 'Investors and financial professionals',
        age: '30-60',
        interests: ['investing', 'wealth management', 'fintech']
      }
    };
    
    const audience = categoryAudiences[category] || {
      primary: 'Digital-first consumers',
      age: '25-45',
      interests: ['technology', 'innovation', 'lifestyle']
    };
    
    // Modify based on archetype
    const archetypeModifiers = {
      Jester: { modifier: 'who value humor and entertainment' },
      Ruler: { modifier: 'seeking premium experiences' },
      Caregiver: { modifier: 'who prioritize care and community' },
      Explorer: { modifier: 'looking for new experiences' }
    };
    
    const modifier = archetypeModifiers[archetype];
    if (modifier) {
      audience.primary += ` ${modifier.modifier}`;
    }
    
    return audience;
  }
  
  /**
   * Create positioning statement
   */
  createPositioning(name, category, archetype) {
    const templates = [
      `For {audience} who {need}, ${name} is the {category} that {benefit} because {reason}.`,
      `${name} helps {audience} {achieve} by {method}, unlike {competition} that {limitation}.`,
      `When {audience} need {solution}, ${name} provides {unique value} through {differentiator}.`
    ];
    
    const template = templates[0]; // Use first template for consistency
    
    const audience = this.identifyTargetAudience(category, archetype).primary;
    const need = this.identifyNeed(category, archetype);
    const benefit = this.identifyBenefit(archetype);
    const reason = this.identifyReason(archetype);
    
    return template
      .replace('{audience}', audience)
      .replace('{need}', need)
      .replace('{category}', category)
      .replace('{benefit}', benefit)
      .replace('{reason}', reason);
  }
  
  identifyNeed(category, archetype) {
    const needs = {
      tech: 'want cutting-edge solutions',
      meme: 'seek community and entertainment',
      lifestyle: 'desire better living',
      gaming: 'crave immersive experiences',
      finance: 'need smart financial tools'
    };
    
    return needs[category] || 'seek innovative solutions';
  }
  
  identifyBenefit(archetype) {
    const benefits = {
      Hero: 'provides protection and empowerment',
      Outlaw: 'breaks boundaries and conventions',
      Magician: 'transforms possibilities into reality',
      Innocent: 'simplifies and purifies',
      Explorer: 'opens new horizons',
      Sage: 'delivers wisdom and insight',
      Jester: 'brings joy and entertainment',
      Everyman: 'offers relatable solutions',
      Lover: 'creates meaningful connections',
      Caregiver: 'nurtures and protects',
      Creator: 'unleashes creative potential',
      Ruler: 'establishes order and success'
    };
    
    return benefits[archetype] || 'delivers unique value';
  }
  
  identifyReason(archetype) {
    const reasons = {
      Hero: 'we champion your success',
      Outlaw: 'we dare to be different',
      Magician: 'we make the impossible possible',
      Innocent: 'we believe in pure solutions',
      Explorer: 'we never stop discovering',
      Sage: 'we value truth and knowledge',
      Jester: 'we make life more enjoyable',
      Everyman: 'we understand real needs',
      Lover: 'we care deeply',
      Caregiver: 'we put care first',
      Creator: 'we empower creation',
      Ruler: 'we set the standard'
    };
    
    return reasons[archetype] || 'we innovate differently';
  }
  
  /**
   * Extract cultural references
   */
  extractCulturalReferences(context) {
    const references = [];
    
    // Add trend-based references
    if (context.trends) {
      references.push(...context.trends.slice(0, 3));
    }
    
    // Add mood-based references
    const moodReferences = {
      optimistic: ['future', 'progress', 'innovation'],
      nostalgic: ['retro', 'classic', 'vintage'],
      rebellious: ['revolution', 'disruption', 'change']
    };
    
    if (context.culturalMood && moodReferences[context.culturalMood]) {
      references.push(...moodReferences[context.culturalMood]);
    }
    
    // Add some classics if needed
    if (references.length < 3) {
      const classics = this.culturalReferences.classics;
      references.push(classics[Math.floor(Math.random() * classics.length)]);
    }
    
    return [...new Set(references)].slice(0, 5); // Unique references, max 5
  }
  
  /**
   * Select category based on context
   */
  selectCategory(context) {
    if (context.trends) {
      // Analyze trends to determine category
      const trendText = context.trends.join(' ').toLowerCase();
      
      if (trendText.includes('tech') || trendText.includes('ai') || trendText.includes('digital')) {
        return 'tech';
      }
      if (trendText.includes('crypto') || trendText.includes('meme') || trendText.includes('doge')) {
        return 'meme';
      }
      if (trendText.includes('game') || trendText.includes('play') || trendText.includes('meta')) {
        return 'gaming';
      }
      if (trendText.includes('finance') || trendText.includes('money') || trendText.includes('invest')) {
        return 'finance';
      }
      if (trendText.includes('life') || trendText.includes('wellness') || trendText.includes('sustain')) {
        return 'lifestyle';
      }
    }
    
    // Default based on cultural mood
    const moodDefaults = {
      optimistic: 'tech',
      rebellious: 'meme',
      nostalgic: 'gaming',
      cautious: 'finance',
      neutral: 'lifestyle'
    };
    
    return moodDefaults[context.culturalMood] || 'tech';
  }
  
  /**
   * Select archetype based on mood and category
   */
  selectArchetype(mood, category) {
    const moodArchetypes = {
      optimistic: ['Hero', 'Creator', 'Magician', 'Explorer'],
      cautious: ['Caregiver', 'Ruler', 'Sage', 'Innocent'],
      rebellious: ['Outlaw', 'Jester', 'Explorer', 'Magician'],
      nostalgic: ['Innocent', 'Everyman', 'Lover', 'Sage'],
      neutral: Object.keys(this.archetypes)
    };
    
    const categoryPreferences = {
      tech: ['Magician', 'Creator', 'Sage'],
      meme: ['Jester', 'Outlaw', 'Explorer'],
      lifestyle: ['Caregiver', 'Innocent', 'Lover'],
      gaming: ['Hero', 'Explorer', 'Magician'],
      finance: ['Ruler', 'Sage', 'Hero']
    };
    
    // Get mood-appropriate archetypes
    const moodOptions = moodArchetypes[mood] || moodArchetypes.neutral;
    
    // Get category-preferred archetypes
    const categoryOptions = categoryPreferences[category] || [];
    
    // Find intersection or use mood options
    const intersection = moodOptions.filter(a => categoryOptions.includes(a));
    const options = intersection.length > 0 ? intersection : moodOptions;
    
    // Select randomly from options
    return options[Math.floor(Math.random() * options.length)];
  }
  
  /**
   * Extract trending words from trends
   */
  extractTrendingWords(trends) {
    const words = [];
    
    trends.forEach(trend => {
      // Extract meaningful words
      const trendWords = trend
        .split(/[\s_-]/)
        .filter(word => word.length > 3)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1));
      
      words.push(...trendWords);
    });
    
    // Remove duplicates and common words
    const commonWords = ['the', 'and', 'for', 'with', 'that', 'this'];
    const uniqueWords = [...new Set(words)]
      .filter(word => !commonWords.includes(word.toLowerCase()));
    
    return uniqueWords.slice(0, 5); // Max 5 words
  }
  
  /**
   * Update metrics
   */
  updateMetrics(brand) {
    this.metrics.totalGenerated++;
    
    // Track viral hits
    if (brand.memePotential > 0.7) {
      this.metrics.viralHits++;
    }
    
    // Update average meme potential
    this.metrics.averageMemePotential = 
      (this.metrics.averageMemePotential * (this.metrics.totalGenerated - 1) + brand.memePotential) / 
      this.metrics.totalGenerated;
    
    // Track archetype usage
    const archetypeCount = this.metrics.topArchetypes.get(brand.archetype) || 0;
    this.metrics.topArchetypes.set(brand.archetype, archetypeCount + 1);
    
    // Track style usage
    const styleCount = this.metrics.trendingStyles.get(brand.visualStyle.name) || 0;
    this.metrics.trendingStyles.set(brand.visualStyle.name, styleCount + 1);
  }
  
  /**
   * Get generator metrics
   */
  getMetrics() {
    const topArchetypes = Array.from(this.metrics.topArchetypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const trendingStyles = Array.from(this.metrics.trendingStyles.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    return {
      ...this.metrics,
      topArchetypes,
      trendingStyles,
      viralRate: this.metrics.totalGenerated > 0 
        ? (this.metrics.viralHits / this.metrics.totalGenerated * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

// Export for use
module.exports = BrandMemeGenerator;

// Demo if run directly
if (require.main === module) {
  console.log('🎭 Starting Brand Meme Generator Demo...\n');
  
  const generator = new BrandMemeGenerator();
  
  // Test different contexts
  async function runDemo() {
    // Tech brand with optimistic mood
    const techBrand = await generator.generateBrand({
      category: 'tech',
      culturalMood: 'optimistic',
      trends: ['AI', 'quantum', 'neural']
    });
    
    console.log('\n📱 Tech Brand Generated:');
    console.log(`Name: ${techBrand.name}`);
    console.log(`Archetype: ${techBrand.archetype}`);
    console.log(`Tagline: ${techBrand.tagline}`);
    console.log(`Meme Potential: ${(techBrand.memePotential * 100).toFixed(1)}%`);
    console.log(`Visual Style: ${techBrand.visualStyle.name}`);
    
    // Meme brand with rebellious mood
    const memeBrand = await generator.generateBrand({
      category: 'meme',
      culturalMood: 'rebellious',
      trends: ['crypto', 'moon', 'doge']
    });
    
    console.log('\n🚀 Meme Brand Generated:');
    console.log(`Name: ${memeBrand.name}`);
    console.log(`Archetype: ${memeBrand.archetype}`);
    console.log(`Tagline: ${memeBrand.tagline}`);
    console.log(`Meme Potential: ${(memeBrand.memePotential * 100).toFixed(1)}%`);
    console.log(`Narrative: ${memeBrand.narrative.elevator}`);
    
    // Auto-generated based on trends
    const autoBrand = await generator.generateBrand({
      trends: ['sustainability', 'wellness', 'mindfulness'],
      culturalMood: 'cautious'
    });
    
    console.log('\n🌱 Auto-Generated Brand:');
    console.log(`Name: ${autoBrand.name}`);
    console.log(`Category: ${autoBrand.category}`);
    console.log(`Archetype: ${autoBrand.archetype}`);
    console.log(`Values: ${autoBrand.values.join(', ')}`);
    console.log(`Target: ${autoBrand.targetAudience.primary}`);
    
    // Show metrics
    console.log('\n📊 Generation Metrics:');
    const metrics = generator.getMetrics();
    console.log(`Total Generated: ${metrics.totalGenerated}`);
    console.log(`Viral Rate: ${metrics.viralRate}`);
    console.log(`Average Meme Potential: ${(metrics.averageMemePotential * 100).toFixed(1)}%`);
    console.log(`Top Archetypes: ${metrics.topArchetypes.map(([a, c]) => `${a} (${c})`).join(', ')}`);
  }
  
  // Listen for events
  generator.on('brand_generated', (brand) => {
    console.log(`\n✨ Brand "${brand.name}" generated in ${brand.generationTime}ms`);
  });
  
  runDemo();
}
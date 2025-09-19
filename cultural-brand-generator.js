#!/usr/bin/env node

/**
 * 🎨 CULTURAL BRAND GENERATOR
 * 
 * Transforms domain concepts into magnetic brand identities that make people
 * want to join the journey. Integrates with 50 First Minds for intelligence.
 * 
 * Amazon A→Z Principle: Every logo shows transformation and directional flow
 * Cultural Magnetism: Brands that build communities, not just customers
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Handle fetch for different Node.js versions
let fetch;
try {
    fetch = require('node-fetch');
} catch (e) {
    fetch = global.fetch || (() => { throw new Error('fetch not available'); });
}

class CulturalBrandGenerator extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = process.env.BRAND_PORT || 6666;
        
        // Service integrations
        this.services = {
            fiftyFirstMinds: 'http://localhost:7777',
            templateProcessor: 'http://localhost:3002'
        };
        
        // Brand Archetypes Database
        this.brandArchetypes = {
            revolutionary: {
                name: 'The Revolutionary Teacher',
                personality: ['bold', 'transformative', 'educational', 'disruptive'],
                colorPalette: {
                    primary: '#e94560',    // Revolutionary red
                    secondary: '#ff6b6b',  // Passionate coral  
                    accent: '#ffd700',     // Achievement gold
                    neutral: '#1a1a2e',   // Deep authority
                    light: '#ffffff'      // Pure clarity
                },
                symbolism: ['skull→book', 'death→rebirth', 'old→new', 'confusion→clarity'],
                culturalMagnetism: 'Join the revolution against boring education',
                examples: ['deathtodata.com']
            },
            
            architect: {
                name: 'The Dream Architect',  
                personality: ['visionary', 'creative', 'empathetic', 'magical'],
                colorPalette: {
                    primary: '#9b59b6',    // Imagination purple
                    secondary: '#00ccff',  // Dream blue
                    accent: '#ff69b4',     // Love pink
                    neutral: '#2c3e50',   // Stable foundation
                    light: '#ecf0f1'      // Soft white
                },
                symbolism: ['soul→infrastructure', 'dreams→reality', 'heart→tech', 'idea→form'],
                culturalMagnetism: 'Build the world your imagination deserves',
                examples: ['soulfra.ai']
            },
            
            commander: {
                name: 'The Wise Commander',
                personality: ['authoritative', 'strategic', 'protective', 'decisive'],
                colorPalette: {
                    primary: '#2c3e50',    // Command navy
                    secondary: '#3498db',  // Strategic blue
                    accent: '#f39c12',     // Achievement gold
                    neutral: '#34495e',   // Steel gray
                    light: '#ecf0f1'      // Command white
                },
                symbolism: ['chaos→order', 'problems→solutions', 'followers→leaders', 'confusion→clarity'],
                culturalMagnetism: 'Join the command center that builds digital empires',
                examples: ['command-hub.com', 'empire-central.com']
            },
            
            prosperity: {
                name: 'The Prosperity Creator',
                personality: ['abundant', 'innovative', 'empowering', 'trustworthy'],
                colorPalette: {
                    primary: '#f1c40f',    // Prosperity gold
                    secondary: '#e67e22',  // Energy orange
                    accent: '#27ae60',     // Growth green  
                    neutral: '#2c3e50',   // Stable foundation
                    light: '#f8f9fa'      // Abundant white
                },
                symbolism: ['scarcity→abundance', 'work→wealth', 'trading→thriving', 'risk→reward'],
                culturalMagnetism: 'Create prosperity through intelligent systems',
                examples: ['trade-empire.com', 'wealth-builder.com']
            },
            
            catalyst: {
                name: 'The Creative Catalyst',
                personality: ['innovative', 'collaborative', 'energetic', 'inspiring'],
                colorPalette: {
                    primary: '#e74c3c',    // Catalyst red
                    secondary: '#9b59b6',  // Creative purple  
                    accent: '#1abc9c',     // Innovation teal
                    neutral: '#34495e',   // Grounded gray
                    light: '#ffffff'      // Pure potential
                },
                symbolism: ['stagnation→movement', 'individual→team', 'idea→innovation', 'spark→fire'],
                culturalMagnetism: 'Ignite your creative potential with others',
                examples: ['innovation-lab.com', 'create-together.com']
            }
        };
        
        // Cultural Psychology Database
        this.culturalPsychology = {
            // What makes people want to join?
            magnetismFactors: {
                transformation: {
                    weight: 0.3,
                    indicators: ['become', 'transform', 'evolve', 'grow', 'level up'],
                    psychologyNote: 'People crave personal transformation'
                },
                belonging: {
                    weight: 0.25, 
                    indicators: ['community', 'tribe', 'family', 'together', 'join'],
                    psychologyNote: 'Humans need to belong to something larger'
                },
                purpose: {
                    weight: 0.25,
                    indicators: ['mission', 'purpose', 'impact', 'change', 'revolution'],
                    psychologyNote: 'People seek meaning beyond themselves'
                },
                competence: {
                    weight: 0.15,
                    indicators: ['learn', 'master', 'expert', 'skill', 'achieve'],
                    psychologyNote: 'Mastery and competence drive engagement'
                },
                status: {
                    weight: 0.05,
                    indicators: ['elite', 'exclusive', 'select', 'advanced', 'premium'],
                    psychologyNote: 'Status symbols create aspiration'
                }
            },
            
            // Trust building elements
            trustIndicators: {
                competence: ['professional', 'expert', 'proven', 'tested', 'verified'],
                benevolence: ['care', 'support', 'help', 'guide', 'nurture'],
                integrity: ['honest', 'transparent', 'authentic', 'genuine', 'real']
            },
            
            // Visual psychology
            visualPsychology: {
                colors: {
                    red: { emotion: 'passion, urgency, power', culture: 'action-oriented, revolutionary' },
                    blue: { emotion: 'trust, stability, calm', culture: 'professional, reliable' },
                    purple: { emotion: 'creativity, mystery, luxury', culture: 'innovative, imaginative' },
                    gold: { emotion: 'wealth, success, prestige', culture: 'aspirational, abundant' },
                    green: { emotion: 'growth, harmony, nature', culture: 'sustainable, organic' },
                    orange: { emotion: 'energy, enthusiasm, warmth', culture: 'friendly, approachable' }
                },
                
                shapes: {
                    circle: { psychology: 'unity, wholeness, community', culture: 'inclusive, harmonious' },
                    triangle: { psychology: 'direction, progress, hierarchy', culture: 'goal-oriented, ambitious' },  
                    square: { psychology: 'stability, trust, order', culture: 'reliable, structured' },
                    arrow: { psychology: 'movement, progress, direction', culture: 'transformative, forward-moving' },
                    diamond: { psychology: 'precious, perfect, refined', culture: 'elite, high-quality' }
                }
            }
        };
        
        // Logo Generation Templates
        this.logoTemplates = {
            // Amazon A→Z style directional flows
            transformationArrow: {
                concept: 'before → after',
                svgTemplate: this.getTransformationArrowSVG(),
                culturalMessage: 'We transform your current state into your desired state'
            },
            
            journeyPath: {
                concept: 'start ↗ destination', 
                svgTemplate: this.getJourneyPathSVG(),
                culturalMessage: 'We guide you along the path to mastery'
            },
            
            evolutionSteps: {
                concept: 'level 1 → level 2 → level 3',
                svgTemplate: this.getEvolutionStepsSVG(),
                culturalMessage: 'We help you evolve through progressive stages'
            },
            
            communityBridge: {
                concept: 'individual + individual = community',
                svgTemplate: this.getCommunityBridgeSVG(),
                culturalMessage: 'We bring people together to achieve more'
            },
            
            empowermentBoost: {
                concept: 'you ↑ powered up',
                svgTemplate: this.getEmpowermentBoostSVG(),
                culturalMessage: 'We amplify your natural abilities and potential'
            }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🎨 Cultural Brand Generator initialized');
        this.emit('generator_ready');
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'brand-assets')));
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'cultural-brand-generator',
                archetypes: Object.keys(this.brandArchetypes).length,
                templates: Object.keys(this.logoTemplates).length
            });
        });
        
        // Generate brand identity from domain concept
        this.app.post('/generate-brand', async (req, res) => {
            try {
                const { domainIdea, targetArchetype, brandName } = req.body;
                
                if (!domainIdea) {
                    return res.status(400).json({ error: 'Domain idea is required' });
                }
                
                console.log(`🎨 Generating brand for: "${domainIdea}"`);
                
                const brand = await this.generateCompleteBrand(domainIdea, targetArchetype, brandName);
                res.json(brand);
                
            } catch (error) {
                console.error('Brand generation error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Analyze cultural magnetism of existing brand
        this.app.post('/analyze-magnetism', async (req, res) => {
            try {
                const { brandConcept, brandName, tagline } = req.body;
                const analysis = await this.analyzeCulturalMagnetism(brandConcept, brandName, tagline);
                res.json(analysis);
            } catch (error) {
                console.error('Magnetism analysis error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Generate logo variations
        this.app.post('/generate-logo', async (req, res) => {
            try {
                const { brandName, archetype, concept } = req.body;
                const logos = await this.generateLogoVariations(brandName, archetype, concept);
                res.json({ logos });
            } catch (error) {
                console.error('Logo generation error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get brand archetypes  
        this.app.get('/archetypes', (req, res) => {
            res.json({
                archetypes: this.brandArchetypes,
                totalArchetypes: Object.keys(this.brandArchetypes).length
            });
        });
        
        // Generate brand manual
        this.app.post('/generate-manual', async (req, res) => {
            try {
                const { brand } = req.body;
                const manual = await this.generateBrandManual(brand);
                res.json({ manual });
            } catch (error) {
                console.error('Brand manual generation error:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    /**
     * Generate complete brand identity
     */
    async generateCompleteBrand(domainIdea, targetArchetype = null, brandName = null) {
        const startTime = Date.now();
        
        // Step 1: Get domain intelligence from 50 First Minds
        const domainIntelligence = await this.getDomainIntelligence(domainIdea);
        
        // Step 2: Determine brand archetype
        const archetype = targetArchetype || await this.selectBrandArchetype(domainIntelligence);
        
        // Step 3: Generate brand name if not provided
        const finalBrandName = brandName || await this.generateBrandName(domainIdea, archetype);
        
        // Step 4: Create color palette and visual identity
        const visualIdentity = await this.createVisualIdentity(finalBrandName, archetype, domainIntelligence);
        
        // Step 5: Generate logo variations
        const logos = await this.generateLogoVariations(finalBrandName, archetype, domainIdea);
        
        // Step 6: Create cultural messaging
        const messaging = await this.createCulturalMessaging(finalBrandName, archetype, domainIntelligence);
        
        // Step 7: Generate brand guidelines
        const guidelines = await this.generateBrandGuidelines(finalBrandName, archetype, visualIdentity);
        
        // Step 8: Analyze cultural magnetism
        const magnetismAnalysis = await this.analyzeCulturalMagnetism(domainIdea, finalBrandName, messaging.tagline);
        
        return {
            brandName: finalBrandName,
            domainIdea,
            archetype: {
                type: archetype,
                ...this.brandArchetypes[archetype]
            },
            visualIdentity,
            logos,
            messaging,
            guidelines,
            magnetismAnalysis,
            domainIntelligence,
            generatedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime
        };
    }
    
    /**
     * Get domain intelligence from 50 First Minds
     */
    async getDomainIntelligence(domainIdea) {
        try {
            const response = await fetch(`${this.services.fiftyFirstMinds}/analyze-domain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domainIdea }),
                timeout: 15000
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    category: data.analysis.basicAnalysis.category,
                    complexity: data.analysis.basicAnalysis.complexity,
                    features: data.analysis.basicAnalysis.features,
                    viabilityScore: data.analysis.aiInsights.viabilityScore,
                    techRecommendations: data.analysis.techRecommendations
                };
            } else {
                console.log('⚠️  50 First Minds not available, using fallback analysis');
                return this.getFallbackDomainIntelligence(domainIdea);
            }
        } catch (error) {
            console.log('⚠️  50 First Minds error, using fallback:', error.message);
            return this.getFallbackDomainIntelligence(domainIdea);
        }
    }
    
    /**
     * Select appropriate brand archetype
     */
    async selectBrandArchetype(domainIntelligence) {
        const category = domainIntelligence.category;
        const complexity = domainIntelligence.complexity;
        
        // Mapping domain categories to brand archetypes
        const categoryArchetypeMap = {
            'marketplace': 'prosperity',      // Trading, economics
            'social': 'catalyst',            // Community, collaboration  
            'productivity': 'commander',      // Organization, management
            'education': 'revolutionary',     // Learning, transformation
            'health': 'architect',           // Wellness, care
            'finance': 'prosperity',         // Money, wealth
            'content': 'revolutionary',      // Media, publishing
            'analytics': 'commander',        // Data, insights
            'general': 'catalyst'            // Default
        };
        
        // Complexity can modify archetype selection
        let baseArchetype = categoryArchetypeMap[category] || 'catalyst';
        
        // High complexity projects might need commander archetype
        if (complexity === 'complex' && baseArchetype !== 'commander') {
            baseArchetype = 'commander';
        }
        
        return baseArchetype;
    }
    
    /**
     * Generate brand name suggestions
     */
    async generateBrandName(domainIdea, archetype) {
        const archetypeData = this.brandArchetypes[archetype];
        const lowerIdea = domainIdea.toLowerCase();
        
        // Extract key concepts from domain idea
        const keywords = lowerIdea.match(/\b\w+\b/g) || [];
        const meaningfulWords = keywords.filter(word => 
            word.length > 3 && 
            !['the', 'and', 'for', 'that', 'with', 'this'].includes(word)
        );
        
        // Name generation patterns based on archetype
        const namePatterns = {
            revolutionary: ['Death to {concept}', '{concept} Revolution', 'New {concept}'],
            architect: ['{concept} Builder', '{concept} Dreams', 'Soul {concept}'],
            commander: ['{concept} Command', '{concept} Empire', 'Master {concept}'],  
            prosperity: ['{concept} Wealth', '{concept} Gold', 'Rich {concept}'],
            catalyst: ['{concept} Spark', '{concept} Ignite', 'Create {concept}']
        };
        
        const patterns = namePatterns[archetype] || namePatterns.catalyst;
        const mainConcept = meaningfulWords[0] || 'Innovation';
        
        // Generate name variations
        const nameOptions = patterns.map(pattern => 
            pattern.replace('{concept}', mainConcept.charAt(0).toUpperCase() + mainConcept.slice(1))
        );
        
        // Return the first option (could be enhanced with AI ranking)
        return nameOptions[0];
    }
    
    /**
     * Create visual identity system
     */
    async createVisualIdentity(brandName, archetype, domainIntelligence) {
        const archetypeData = this.brandArchetypes[archetype];
        
        return {
            colorPalette: archetypeData.colorPalette,
            typography: {
                primary: 'Inter',           // Clean, professional
                display: 'Space Grotesk',   // Headlines, impact
                mono: 'JetBrains Mono'     // Technical, code
            },
            logoSpecs: {
                minimumSize: '32px',
                clearSpace: '8px',
                formats: ['SVG', 'PNG', 'ICO'],
                variations: ['horizontal', 'stacked', 'icon-only', 'monogram']
            },
            brandElements: {
                cornerRadius: '8px',
                shadowStyle: '0 4px 12px rgba(0,0,0,0.1)',
                animationDuration: '0.3s',
                spacingUnit: '8px'
            }
        };
    }
    
    /**
     * Generate logo variations with A→Z directional flow
     */
    async generateLogoVariations(brandName, archetype, concept) {
        const archetypeData = this.brandArchetypes[archetype];
        const variations = [];
        
        // For each logo template, create a variation
        for (const [templateName, template] of Object.entries(this.logoTemplates)) {
            variations.push({
                name: `${brandName} ${templateName}`,
                template: templateName,
                svg: this.customizeSVGTemplate(template.svgTemplate, brandName, archetypeData),
                culturalMessage: template.culturalMessage,
                directionalFlow: template.concept
            });
        }
        
        return variations;
    }
    
    /**
     * Create cultural messaging that builds magnetism
     */
    async createCulturalMessaging(brandName, archetype, domainIntelligence) {
        const archetypeData = this.brandArchetypes[archetype];
        
        return {
            tagline: archetypeData.culturalMagnetism,
            missionStatement: `${brandName} empowers individuals to transform their ${domainIntelligence.category} experience through innovative technology and community.`,
            valueProposition: `Join thousands who are already transforming their ${domainIntelligence.category} journey with ${brandName}`,
            callToAction: 'Start Your Transformation',
            communityInvite: `Become part of the ${brandName} movement`,
            personalBenefit: `Discover what you can achieve when ${domainIntelligence.category} becomes effortless`,
            socialProof: `Trusted by innovators who demand excellence in ${domainIntelligence.category}`
        };
    }
    
    /**
     * Analyze cultural magnetism factors
     */
    async analyzeCulturalMagnetism(domainIdea, brandName, tagline) {
        const text = `${domainIdea} ${brandName} ${tagline}`.toLowerCase();
        const factors = this.culturalPsychology.magnetismFactors;
        
        let totalScore = 0;
        const scores = {};
        
        // Analyze each magnetism factor
        for (const [factor, data] of Object.entries(factors)) {
            let factorScore = 0;
            const matches = [];
            
            for (const indicator of data.indicators) {
                if (text.includes(indicator)) {
                    factorScore += 1;
                    matches.push(indicator);
                }
            }
            
            // Normalize and weight the score  
            const normalizedScore = Math.min(factorScore / data.indicators.length, 1);
            const weightedScore = normalizedScore * data.weight;
            
            scores[factor] = {
                rawScore: factorScore,
                normalizedScore,
                weightedScore,
                matches,
                psychology: data.psychologyNote
            };
            
            totalScore += weightedScore;
        }
        
        // Convert to percentage
        const magnetismScore = Math.round(totalScore * 100);
        
        // Generate recommendations
        const recommendations = this.generateMagnetismRecommendations(scores);
        
        return {
            overallScore: magnetismScore,
            grade: this.getMagnetismGrade(magnetismScore),
            factors: scores,
            recommendations,
            analysis: this.getMagnetismAnalysis(magnetismScore, scores)
        };
    }
    
    /**
     * Generate brand guidelines document
     */
    async generateBrandGuidelines(brandName, archetype, visualIdentity) {
        const archetypeData = this.brandArchetypes[archetype];
        
        return {
            brandOverview: {
                name: brandName,
                archetype: archetypeData.name,
                personality: archetypeData.personality,
                culturalMission: archetypeData.culturalMagnetism
            },
            visualGuidelines: {
                logo: visualIdentity.logoSpecs,
                colors: visualIdentity.colorPalette,
                typography: visualIdentity.typography,
                elements: visualIdentity.brandElements
            },
            voiceAndTone: {
                personality: archetypeData.personality,
                doWrite: [
                    'Use active voice and confident language',
                    'Focus on transformation and growth', 
                    'Speak directly to individual dreams',
                    'Create sense of community and belonging'
                ],
                dontWrite: [
                    'Use jargon without explanation',
                    'Make promises you cannot keep',
                    'Ignore the emotional journey',
                    'Focus only on features, not benefits'
                ]
            },
            applications: {
                web: 'Clean, modern interfaces with clear directional flow',
                social: 'Consistent visual elements across all platforms',
                print: 'Professional materials that build trust',
                merchandise: 'Items people proudly wear and use'
            }
        };
    }
    
    // SVG Template Methods
    getTransformationArrowSVG() {
        return `
        <svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="transformGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:{{primary}};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:{{accent}};stop-opacity:1" />
                </linearGradient>
            </defs>
            <path d="M 20 40 L 160 40 L 150 30 M 160 40 L 150 50" 
                  stroke="url(#transformGrad)" stroke-width="3" fill="none"/>
            <text x="10" y="25" font-family="Space Grotesk" font-size="12" fill="{{primary}}">BEFORE</text>
            <text x="140" y="25" font-family="Space Grotesk" font-size="12" fill="{{accent}}">AFTER</text>
            <text x="70" y="65" font-family="Inter" font-size="14" font-weight="600" fill="{{neutral}}">{{brandName}}</text>
        </svg>`;
    }
    
    getJourneyPathSVG() {
        return `
        <svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="journeyGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:{{primary}};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:{{accent}};stop-opacity:1" />
                </linearGradient>
            </defs>
            <path d="M 20 60 Q 100 20 180 30" stroke="url(#journeyGrad)" stroke-width="3" fill="none"/>
            <circle cx="20" cy="60" r="4" fill="{{primary}}"/>
            <circle cx="180" cy="30" r="4" fill="{{accent}}"/>
            <text x="60" y="65" font-family="Inter" font-size="14" font-weight="600" fill="{{neutral}}">{{brandName}}</text>
        </svg>`;
    }
    
    getEvolutionStepsSVG() {
        return `
        <svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="50" width="30" height="20" fill="{{primary}}" rx="4"/>
            <rect x="70" y="40" width="30" height="30" fill="{{secondary}}" rx="4"/>
            <rect x="120" y="30" width="30" height="40" fill="{{accent}}" rx="4"/>
            <path d="M 55 60 L 65 60 M 62 57 L 65 60 L 62 63" stroke="{{neutral}}" stroke-width="2"/>
            <path d="M 105 55 L 115 55 M 112 52 L 115 55 L 112 58" stroke="{{neutral}}" stroke-width="2"/>
            <text x="60" y="15" font-family="Inter" font-size="14" font-weight="600" fill="{{neutral}}">{{brandName}}</text>
        </svg>`;
    }
    
    getCommunityBridgeSVG() {
        return `
        <svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="15" fill="{{primary}}" opacity="0.7"/>
            <circle cx="160" cy="40" r="15" fill="{{primary}}" opacity="0.7"/>
            <circle cx="100" cy="40" r="20" fill="{{accent}}"/>
            <path d="M 55 40 L 80 40" stroke="{{secondary}}" stroke-width="3"/>
            <path d="M 120 40 L 145 40" stroke="{{secondary}}" stroke-width="3"/>
            <text x="70" y="65" font-family="Inter" font-size="14" font-weight="600" fill="{{neutral}}">{{brandName}}</text>
        </svg>`;
    }
    
    getEmpowermentBoostSVG() {
        return `
        <svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="boostGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:{{primary}};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:{{accent}};stop-opacity:1" />
                </linearGradient>
            </defs>
            <path d="M 50 60 L 100 20 L 150 40 L 100 35 L 120 25 L 100 30 L 110 20" 
                  stroke="url(#boostGrad)" stroke-width="3" fill="none"/>
            <circle cx="50" cy="60" r="6" fill="{{primary}}"/>
            <text x="70" y="75" font-family="Inter" font-size="14" font-weight="600" fill="{{neutral}}">{{brandName}}</text>
        </svg>`;
    }
    
    /**
     * Customize SVG template with brand colors and name
     */
    customizeSVGTemplate(template, brandName, archetypeData) {
        return template
            .replace(/{{brandName}}/g, brandName)
            .replace(/{{primary}}/g, archetypeData.colorPalette.primary)
            .replace(/{{secondary}}/g, archetypeData.colorPalette.secondary)
            .replace(/{{accent}}/g, archetypeData.colorPalette.accent)
            .replace(/{{neutral}}/g, archetypeData.colorPalette.neutral)
            .replace(/{{light}}/g, archetypeData.colorPalette.light);
    }
    
    // Helper methods
    getFallbackDomainIntelligence(domainIdea) {
        return {
            category: 'general',
            complexity: 'medium',
            features: [],
            viabilityScore: 75,
            techRecommendations: { primary: {}, alternatives: {} }
        };
    }
    
    getMagnetismGrade(score) {
        if (score >= 85) return 'A+';
        if (score >= 75) return 'A';
        if (score >= 65) return 'B+';
        if (score >= 55) return 'B';
        if (score >= 45) return 'C+';
        if (score >= 35) return 'C';
        return 'D';
    }
    
    getMagnetismAnalysis(score, factors) {
        if (score >= 75) {
            return "This brand has strong cultural magnetism! People will naturally want to join this journey.";
        } else if (score >= 50) {
            return "Good magnetism potential. Some tweaks to messaging could significantly improve attraction.";
        } else {
            return "This brand needs work to create cultural magnetism. Focus on transformation and belonging themes.";
        }
    }
    
    generateMagnetismRecommendations(scores) {
        const recommendations = [];
        
        // Check each factor and make recommendations
        for (const [factor, data] of Object.entries(scores)) {
            if (data.normalizedScore < 0.5) {
                switch (factor) {
                    case 'transformation':
                        recommendations.push('Add language about personal growth and transformation');
                        break;
                    case 'belonging':
                        recommendations.push('Emphasize community and belonging aspects');
                        break;
                    case 'purpose':
                        recommendations.push('Clarify the higher mission and impact');
                        break;
                    case 'competence':
                        recommendations.push('Highlight learning and skill development opportunities');
                        break;
                    case 'status':
                        recommendations.push('Consider adding exclusive or premium elements');
                        break;
                }
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Your brand shows strong magnetism across all factors!');
        }
        
        return recommendations;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`🎨 Cultural Brand Generator running on port ${this.port}`);
                console.log(`📍 Access at http://localhost:${this.port}`);
                resolve();
            });
        });
    }
    
    async stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

if (require.main === module) {
    const generator = new CulturalBrandGenerator();
    generator.start();
    
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Cultural Brand Generator...');
        await generator.stop();
        process.exit(0);
    });
}

module.exports = CulturalBrandGenerator;
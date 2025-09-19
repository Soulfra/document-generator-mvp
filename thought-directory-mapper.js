#!/usr/bin/env node

/**
 * 🧠 THOUGHT-TO-DIRECTORY MAPPER
 * AI-powered Craigslist-style directory generation from natural language
 * Converts thoughts → organized structures, RTF documents, and listings
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ThoughtDirectoryMapper {
    constructor() {
        this.thoughtPatterns = new Map();
        this.directoryTemplates = new Map();
        this.craigslistCategories = new Map();
        this.rtfGenerator = null;
        this.generatedStructures = [];
        this.processingHistory = [];
        
        this.initializeMapper();
    }
    
    async initializeMapper() {
        console.log('🧠 Initializing Thought-to-Directory Mapper...');
        
        await this.loadThoughtPatterns();
        await this.loadDirectoryTemplates();
        await this.loadCraigslistCategories();
        await this.initializeRTFGenerator();
        
        console.log('✅ Thought-to-Directory Mapper ready!');
    }
    
    async loadThoughtPatterns() {
        console.log('📋 Loading thought patterns...');
        
        // Intent classification patterns
        this.thoughtPatterns.set('directory_creation', {
            keywords: ['organize', 'create folder', 'make directory', 'file structure', 'categorize'],
            indicators: ['folder', 'directory', 'organize', 'structure', 'hierarchy'],
            confidence: 0.8
        });
        
        this.thoughtPatterns.set('craigslist_listing', {
            keywords: ['list', 'sell', 'buy', 'find', 'classifieds', 'marketplace'],
            indicators: ['for sale', 'wanted', 'price', 'contact', 'location'],
            confidence: 0.7
        });
        
        this.thoughtPatterns.set('gaming_related', {
            keywords: ['game', 'play', 'arcade', 'pong', 'tetris', 'score'],
            indicators: ['game', 'player', 'level', 'score', 'play'],
            confidence: 0.9
        });
        
        this.thoughtPatterns.set('weather_facilities', {
            keywords: ['weather', 'court', 'park', 'tennis', 'outdoor', 'facility'],
            indicators: ['weather', 'rain', 'sunny', 'court', 'facility'],
            confidence: 0.6
        });
        
        this.thoughtPatterns.set('area_code_geographic', {
            keywords: ['area code', 'region', 'city', 'location', 'geographic'],
            indicators: ['415', '212', '310', 'area', 'code', 'region'],
            confidence: 0.8
        });
        
        console.log(`📋 Loaded ${this.thoughtPatterns.size} thought patterns`);
    }
    
    async loadDirectoryTemplates() {
        console.log('📁 Loading directory templates...');
        
        // Hierarchical templates
        this.directoryTemplates.set('business_hierarchy', {
            type: 'hierarchical',
            root: 'business',
            structure: {
                'planning': ['business_plan', 'market_research', 'financial_projections'],
                'operations': ['daily_tasks', 'procedures', 'workflows'],
                'marketing': ['campaigns', 'content', 'analytics'],
                'finance': ['budgets', 'expenses', 'revenue']
            }
        });
        
        this.directoryTemplates.set('gaming_organization', {
            type: 'hierarchical',
            root: 'gaming',
            structure: {
                'classic_games': ['pong', 'asteroids', 'tetris', 'space_invaders'],
                'modern_games': ['ar_games', 'mobile_games', 'web_games'],
                'assets': ['sprites', 'sounds', 'music', 'fonts'],
                'scores': ['high_scores', 'achievements', 'leaderboards']
            }
        });
        
        this.directoryTemplates.set('location_data', {
            type: 'geographic',
            root: 'locations',
            structure: {
                'area_codes': ['415_sf', '212_nyc', '310_la', '713_houston'],
                'facilities': ['tennis_courts', 'parks', 'gyms', 'pools'],
                'weather': ['current', 'forecasts', 'historical', 'alerts']
            }
        });
        
        // Flat listing templates
        this.directoryTemplates.set('flat_listing', {
            type: 'flat',
            categories: ['general', 'items', 'services', 'events', 'information']
        });
        
        console.log(`📁 Loaded ${this.directoryTemplates.size} directory templates`);
    }
    
    async loadCraigslistCategories() {
        console.log('📰 Loading Craigslist categories...');
        
        this.craigslistCategories.set('for_sale', {
            name: 'for sale',
            fields: ['title', 'price', 'description', 'location', 'contact', 'images'],
            requiredFields: ['title', 'price', 'description'],
            subcategories: ['electronics', 'furniture', 'cars', 'books', 'clothing']
        });
        
        this.craigslistCategories.set('services', {
            name: 'services',
            fields: ['title', 'rate', 'description', 'location', 'contact', 'availability'],
            requiredFields: ['title', 'description', 'contact'],
            subcategories: ['computer', 'automotive', 'household', 'creative', 'labor']
        });
        
        this.craigslistCategories.set('housing', {
            name: 'housing',
            fields: ['title', 'rent', 'bedrooms', 'bathrooms', 'location', 'contact', 'available'],
            requiredFields: ['title', 'rent', 'location'],
            subcategories: ['apartments', 'houses', 'rooms', 'vacation', 'office']
        });
        
        this.craigslistCategories.set('jobs', {
            name: 'jobs',
            fields: ['title', 'salary', 'description', 'location', 'contact', 'requirements'],
            requiredFields: ['title', 'description', 'contact'],
            subcategories: ['part_time', 'full_time', 'contract', 'internship', 'gig']
        });
        
        this.craigslistCategories.set('community', {
            name: 'community',
            fields: ['title', 'description', 'location', 'contact', 'date'],
            requiredFields: ['title', 'description'],
            subcategories: ['events', 'activities', 'classes', 'groups', 'volunteers']
        });
        
        this.craigslistCategories.set('gaming', {
            name: 'gaming',
            fields: ['title', 'game_type', 'description', 'players', 'location', 'contact'],
            requiredFields: ['title', 'game_type', 'description'],
            subcategories: ['retro_arcade', 'board_games', 'video_games', 'tournaments', 'meetups']
        });
        
        console.log(`📰 Loaded ${this.craigslistCategories.size} Craigslist categories`);
    }
    
    async initializeRTFGenerator() {
        console.log('📄 Initializing RTF generator...');
        
        this.rtfGenerator = {
            // RTF document structure
            header: '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}{\\f1 Courier New;}}',
            footer: '}',
            
            // Generate RTF content
            generateDocument: (content, options = {}) => {
                const rtfContent = this.convertToRTF(content, options);
                return this.rtfGenerator.header + rtfContent + this.rtfGenerator.footer;
            },
            
            // Format text for RTF
            formatText: (text, format = {}) => {
                let formatted = text;
                
                if (format.bold) formatted = `{\\b ${formatted}}`;
                if (format.italic) formatted = `{\\i ${formatted}}`;
                if (format.underline) formatted = `{\\ul ${formatted}}`;
                if (format.font) formatted = `{\\f${format.font} ${formatted}}`;
                if (format.size) formatted = `{\\fs${format.size * 2} ${formatted}}`; // RTF uses half-points
                
                return formatted;
            }
        };
        
        console.log('📄 RTF generator ready');
    }
    
    convertToRTF(content, options) {
        // Convert content to RTF format
        if (typeof content === 'string') {
            return content.replace(/\n/g, '\\par ');
        }
        
        if (typeof content === 'object') {
            return this.objectToRTF(content, options);
        }
        
        return content.toString().replace(/\n/g, '\\par ');
    }
    
    objectToRTF(obj, options) {
        let rtf = '';
        
        if (obj.title) {
            rtf += this.rtfGenerator.formatText(obj.title, { bold: true, size: 16 }) + '\\par \\par ';
        }
        
        if (obj.description) {
            rtf += obj.description.replace(/\n/g, '\\par ') + '\\par \\par ';
        }
        
        if (obj.structure) {
            rtf += this.structureToRTF(obj.structure);
        }
        
        if (obj.items && Array.isArray(obj.items)) {
            obj.items.forEach(item => {
                rtf += this.itemToRTF(item);
            });
        }
        
        return rtf;
    }
    
    structureToRTF(structure) {
        let rtf = this.rtfGenerator.formatText('Directory Structure:', { bold: true }) + '\\par ';
        
        this.traverseStructure(structure, (path, isDir) => {
            const indent = '  '.repeat(path.split('/').length - 1);
            const icon = isDir ? '[DIR]' : '[FILE]';
            rtf += `${indent}${icon} ${path.split('/').pop()}\\par `;
        });
        
        return rtf + '\\par ';
    }
    
    itemToRTF(item) {
        let rtf = this.rtfGenerator.formatText(item.title || 'Untitled', { bold: true }) + '\\par ';
        
        if (item.price) rtf += `Price: ${item.price}\\par `;
        if (item.location) rtf += `Location: ${item.location}\\par `;
        if (item.description) rtf += `${item.description}\\par `;
        
        return rtf + '\\par ';
    }
    
    // Main thought processing function
    async processThought(thought, options = {}) {
        console.log(`🧠 Processing thought: "${thought}"`);
        
        const analysis = await this.analyzeThought(thought);
        const result = await this.generateFromAnalysis(analysis, options);
        
        // Store in history
        this.processingHistory.push({
            thought: thought,
            analysis: analysis,
            result: result,
            timestamp: Date.now(),
            options: options
        });
        
        return result;
    }
    
    async analyzeThought(thought) {
        const analysis = {
            originalThought: thought,
            intent: await this.classifyIntent(thought),
            entities: await this.extractEntities(thought),
            structure: await this.analyzeStructure(thought),
            category: await this.determineCraigslistCategory(thought),
            complexity: this.assessComplexity(thought),
            confidence: 0.5
        };
        
        // Calculate confidence score
        analysis.confidence = this.calculateConfidence(analysis);
        
        return analysis;
    }
    
    async classifyIntent(thought) {
        const lowerThought = thought.toLowerCase();
        let bestMatch = { intent: 'general', confidence: 0 };
        
        for (const [intent, pattern] of this.thoughtPatterns.entries()) {
            let score = 0;
            
            // Check keywords
            pattern.keywords.forEach(keyword => {
                if (lowerThought.includes(keyword)) {
                    score += 0.3;
                }
            });
            
            // Check indicators
            pattern.indicators.forEach(indicator => {
                if (lowerThought.includes(indicator)) {
                    score += 0.2;
                }
            });
            
            // Apply pattern confidence
            score *= pattern.confidence;
            
            if (score > bestMatch.confidence) {
                bestMatch = { intent, confidence: score };
            }
        }
        
        return bestMatch.intent;
    }
    
    async extractEntities(thought) {
        const entities = {
            areaCodes: this.extractAreaCodes(thought),
            gameNames: this.extractGameNames(thought),
            facilityTypes: this.extractFacilityTypes(thought),
            weatherTerms: this.extractWeatherTerms(thought),
            priceIndicators: this.extractPriceIndicators(thought),
            locationIndicators: this.extractLocationIndicators(thought),
            contactInfo: this.extractContactInfo(thought),
            dates: this.extractDates(thought)
        };
        
        return entities;
    }
    
    extractAreaCodes(thought) {
        const areaCodePattern = /\b\d{3}\b/g;
        const matches = thought.match(areaCodePattern) || [];
        
        // Filter to valid area codes (simplified)
        const validAreaCodes = ['415', '212', '310', '713', '404', '206', '617', '305'];
        return matches.filter(code => validAreaCodes.includes(code));
    }
    
    extractGameNames(thought) {
        const gameNames = ['pong', 'asteroids', 'tetris', 'space invaders', 'maze', 'rogue'];
        const lowerThought = thought.toLowerCase();
        
        return gameNames.filter(game => lowerThought.includes(game));
    }
    
    extractFacilityTypes(thought) {
        const facilityTypes = ['tennis', 'court', 'park', 'gym', 'pool', 'recreation', 'pickleball'];
        const lowerThought = thought.toLowerCase();
        
        return facilityTypes.filter(facility => lowerThought.includes(facility));
    }
    
    extractWeatherTerms(thought) {
        const weatherTerms = ['sunny', 'rain', 'snow', 'storm', 'wind', 'hot', 'cold', 'fog'];
        const lowerThought = thought.toLowerCase();
        
        return weatherTerms.filter(weather => lowerThought.includes(weather));
    }
    
    extractPriceIndicators(thought) {
        const pricePattern = /\$\d+(?:\.\d{2})?|\d+\s*dollars?|\d+\s*bucks?/gi;
        return thought.match(pricePattern) || [];
    }
    
    extractLocationIndicators(thought) {
        const locationPattern = /\b(?:in|at|near|around)\s+([A-Za-z\s]+?)(?:\s|$|,|\.|!|\?)/gi;
        const matches = [];
        let match;
        
        while ((match = locationPattern.exec(thought)) !== null) {
            matches.push(match[1].trim());
        }
        
        return matches;
    }
    
    extractContactInfo(thought) {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        
        return {
            emails: thought.match(emailPattern) || [],
            phones: thought.match(phonePattern) || []
        };
    }
    
    extractDates(thought) {
        const datePattern = /\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}\/\d{2,4})\b/gi;
        return thought.match(datePattern) || [];
    }
    
    async analyzeStructure(thought) {
        const hasHierarchy = /\b(?:under|inside|within|subfolder|subdirectory)\b/i.test(thought);
        const hasListing = /\b(?:list|items|entries|catalog|directory)\b/i.test(thought);
        const hasCategories = /\b(?:category|group|type|kind|section)\b/i.test(thought);
        const hasSequence = /\b(?:first|second|third|then|next|after|before)\b/i.test(thought);
        
        return {
            hierarchical: hasHierarchy,
            listing: hasListing,
            categorical: hasCategories,
            sequential: hasSequence,
            complexity: this.assessComplexity(thought)
        };
    }
    
    async determineCraigslistCategory(thought) {
        const lowerThought = thought.toLowerCase();
        let bestCategory = 'community';
        let bestScore = 0;
        
        for (const [categoryId, category] of this.craigslistCategories.entries()) {
            let score = 0;
            
            // Check if category name is mentioned
            if (lowerThought.includes(category.name)) {
                score += 0.5;
            }
            
            // Check subcategories
            category.subcategories.forEach(sub => {
                if (lowerThought.includes(sub.replace('_', ' '))) {
                    score += 0.3;
                }
            });
            
            // Special keyword scoring
            if (categoryId === 'for_sale' && /\b(?:sell|selling|price|\$\d+)\b/.test(lowerThought)) {
                score += 0.4;
            }
            
            if (categoryId === 'services' && /\b(?:service|help|hire|work)\b/.test(lowerThought)) {
                score += 0.4;
            }
            
            if (categoryId === 'housing' && /\b(?:rent|apartment|house|room)\b/.test(lowerThought)) {
                score += 0.4;
            }
            
            if (categoryId === 'jobs' && /\b(?:job|work|position|hiring)\b/.test(lowerThought)) {
                score += 0.4;
            }
            
            if (categoryId === 'gaming' && /\b(?:game|play|arcade|tournament)\b/.test(lowerThought)) {
                score += 0.4;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestCategory = categoryId;
            }
        }
        
        return bestCategory;
    }
    
    assessComplexity(thought) {
        const words = thought.split(/\s+/).length;
        const sentences = thought.split(/[.!?]+/).length;
        const hasCoordinators = /\b(?:and|or|but|because|since|while|although)\b/i.test(thought);
        
        if (words < 5 && sentences <= 1) return 'simple';
        if (words < 15 && sentences <= 2 && !hasCoordinators) return 'moderate';
        return 'complex';
    }
    
    calculateConfidence(analysis) {
        let confidence = 0.5; // Base confidence
        
        // Intent confidence
        const intentPattern = this.thoughtPatterns.get(analysis.intent);
        if (intentPattern) {
            confidence += intentPattern.confidence * 0.3;
        }
        
        // Entity richness
        const entityCount = Object.values(analysis.entities).flat().length;
        confidence += Math.min(entityCount * 0.05, 0.2);
        
        // Structure clarity
        const structureScore = Object.values(analysis.structure).filter(Boolean).length;
        confidence += structureScore * 0.1;
        
        return Math.min(confidence, 1.0);
    }
    
    async generateFromAnalysis(analysis, options = {}) {
        const result = {
            type: 'directory_generation',
            analysis: analysis,
            generated: {
                directoryStructure: null,
                craigslistListing: null,
                rtfDocument: null
            },
            metadata: {
                generatedAt: Date.now(),
                confidence: analysis.confidence,
                processingTime: null
            }
        };
        
        const startTime = Date.now();
        
        try {
            // Generate directory structure
            result.generated.directoryStructure = await this.generateDirectoryStructure(analysis);
            
            // Generate Craigslist listing if appropriate
            if (this.shouldGenerateListing(analysis)) {
                result.generated.craigslistListing = await this.generateCraigslistListing(analysis);
            }
            
            // Generate RTF document if requested
            if (options.generateRTF || analysis.complexity === 'complex') {
                result.generated.rtfDocument = await this.generateRTFDocument(result.generated, analysis);
            }
            
            result.metadata.processingTime = Date.now() - startTime;
            
            // Store generated structure
            this.generatedStructures.push(result);
            
            console.log(`✅ Generated structure in ${result.metadata.processingTime}ms`);
            
        } catch (error) {
            console.error('Generation error:', error);
            result.error = error.message;
        }
        
        return result;
    }
    
    async generateDirectoryStructure(analysis) {
        const structure = {
            id: crypto.randomBytes(16).toString('hex'),
            type: this.determineStructureType(analysis),
            root: this.generateRootName(analysis),
            created: new Date().toISOString(),
            paths: [],
            files: [],
            metadata: {
                source: 'thought_analysis',
                intent: analysis.intent,
                complexity: analysis.complexity
            }
        };
        
        switch (structure.type) {
            case 'hierarchical':
                await this.buildHierarchicalStructure(structure, analysis);
                break;
            case 'flat_listing':
                await this.buildFlatStructure(structure, analysis);
                break;
            case 'categorical':
                await this.buildCategoricalStructure(structure, analysis);
                break;
            default:
                await this.buildSimpleStructure(structure, analysis);
        }
        
        return structure;
    }
    
    determineStructureType(analysis) {
        if (analysis.structure.hierarchical) return 'hierarchical';
        if (analysis.structure.categorical) return 'categorical';
        if (analysis.structure.listing) return 'flat_listing';
        return 'simple';
    }
    
    generateRootName(analysis) {
        const entities = analysis.entities;
        
        if (entities.gameNames.length > 0) {
            return `gaming_${entities.gameNames[0].replace(' ', '_')}`;
        }
        
        if (entities.facilityTypes.length > 0) {
            return `facilities_${entities.facilityTypes[0]}`;
        }
        
        if (entities.areaCodes.length > 0) {
            return `area_${entities.areaCodes[0]}`;
        }
        
        if (analysis.category !== 'community') {
            return analysis.category.replace('_', '_');
        }
        
        return `thought_${Date.now().toString(36)}`;
    }
    
    async buildHierarchicalStructure(structure, analysis) {
        const entities = analysis.entities;
        
        // Create main categories
        const categories = this.determineCategories(analysis);
        
        categories.forEach(category => {
            structure.paths.push(`${structure.root}/${category}`);
            
            // Add subcategories based on entities
            if (category === 'games' && entities.gameNames.length > 0) {
                entities.gameNames.forEach(game => {
                    structure.paths.push(`${structure.root}/${category}/${game.replace(' ', '_')}`);
                    structure.files.push({
                        path: `${structure.root}/${category}/${game.replace(' ', '_')}/game_info.md`,
                        content: `# ${game}\n\nGenerated from thought analysis.\n`
                    });
                });
            }
            
            if (category === 'locations' && entities.areaCodes.length > 0) {
                entities.areaCodes.forEach(code => {
                    structure.paths.push(`${structure.root}/${category}/area_${code}`);
                    structure.files.push({
                        path: `${structure.root}/${category}/area_${code}/info.md`,
                        content: `# Area Code ${code}\n\nLocation data and analysis.\n`
                    });
                });
            }
            
            if (category === 'facilities' && entities.facilityTypes.length > 0) {
                entities.facilityTypes.forEach(facility => {
                    structure.paths.push(`${structure.root}/${category}/${facility}`);
                    structure.files.push({
                        path: `${structure.root}/${category}/${facility}/locations.md`,
                        content: `# ${facility} Facilities\n\nFacility locations and details.\n`
                    });
                });
            }
        });
        
        // Add main README
        structure.files.push({
            path: `${structure.root}/README.md`,
            content: this.generateReadmeContent(analysis, structure)
        });
    }
    
    async buildFlatStructure(structure, analysis) {
        const entities = analysis.entities;
        
        // Create flat list of items
        const items = [];
        
        entities.gameNames.forEach(game => {
            items.push({
                type: 'game',
                name: game,
                path: `${structure.root}/${game.replace(' ', '_')}.md`
            });
        });
        
        entities.areaCodes.forEach(code => {
            items.push({
                type: 'area_code',
                name: `Area ${code}`,
                path: `${structure.root}/area_${code}.md`
            });
        });
        
        entities.facilityTypes.forEach(facility => {
            items.push({
                type: 'facility',
                name: facility,
                path: `${structure.root}/${facility}_facilities.md`
            });
        });
        
        // Create files for each item
        items.forEach(item => {
            structure.files.push({
                path: item.path,
                content: `# ${item.name}\n\nType: ${item.type}\nGenerated from: "${analysis.originalThought}"\n`
            });
        });
        
        // Create index file
        const indexContent = `# ${structure.root}\n\n## Items\n\n${items.map(item => `- [${item.name}](${item.path})`).join('\n')}\n`;
        structure.files.push({
            path: `${structure.root}/index.md`,
            content: indexContent
        });
    }
    
    async buildCategoricalStructure(structure, analysis) {
        const category = analysis.category;
        const craigslistCategory = this.craigslistCategories.get(category);
        
        if (craigslistCategory) {
            // Create category-based structure
            craigslistCategory.subcategories.forEach(subcat => {
                structure.paths.push(`${structure.root}/${subcat}`);
                structure.files.push({
                    path: `${structure.root}/${subcat}/README.md`,
                    content: `# ${subcat.replace('_', ' ').toUpperCase()}\n\nSubcategory of ${craigslistCategory.name}\n`
                });
            });
        }
        
        // Add category template file
        structure.files.push({
            path: `${structure.root}/category_template.md`,
            content: this.generateCategoryTemplate(craigslistCategory)
        });
    }
    
    async buildSimpleStructure(structure, analysis) {
        // Simple single-level structure
        structure.files.push({
            path: `${structure.root}/thought.md`,
            content: `# Thought Analysis\n\n**Original:** ${analysis.originalThought}\n\n**Intent:** ${analysis.intent}\n\n**Entities:** ${JSON.stringify(analysis.entities, null, 2)}\n`
        });
        
        structure.files.push({
            path: `${structure.root}/structure.json`,
            content: JSON.stringify(structure, null, 2)
        });
    }
    
    determineCategories(analysis) {
        const categories = ['main'];
        
        if (analysis.entities.gameNames.length > 0) categories.push('games');
        if (analysis.entities.areaCodes.length > 0) categories.push('locations');
        if (analysis.entities.facilityTypes.length > 0) categories.push('facilities');
        if (analysis.entities.weatherTerms.length > 0) categories.push('weather');
        
        return categories;
    }
    
    generateReadmeContent(analysis, structure) {
        return `# ${structure.root}

Generated from thought: "${analysis.originalThought}"

## Analysis
- **Intent:** ${analysis.intent}
- **Complexity:** ${analysis.complexity}
- **Confidence:** ${(analysis.confidence * 100).toFixed(1)}%

## Structure
- **Type:** ${structure.type}
- **Paths:** ${structure.paths.length}
- **Files:** ${structure.files.length}

## Entities Found
${Object.entries(analysis.entities)
    .filter(([key, values]) => values.length > 0)
    .map(([key, values]) => `- **${key}:** ${values.join(', ')}`)
    .join('\n')}

Generated: ${new Date().toISOString()}
`;
    }
    
    generateCategoryTemplate(category) {
        if (!category) return '# Category Template\n\nNo specific category found.\n';
        
        return `# ${category.name.toUpperCase()} TEMPLATE

## Required Fields
${category.requiredFields.map(field => `- **${field}:** [Enter ${field}]`).join('\n')}

## Optional Fields
${category.fields.filter(f => !category.requiredFields.includes(f))
    .map(field => `- **${field}:** [Enter ${field}]`).join('\n')}

## Subcategories
${category.subcategories.map(sub => `- ${sub.replace('_', ' ')}`).join('\n')}
`;
    }
    
    shouldGenerateListing(analysis) {
        // Generate listing if it's marketplace-related or has price/contact info
        return analysis.category !== 'community' || 
               analysis.entities.priceIndicators.length > 0 ||
               analysis.entities.contactInfo.emails.length > 0 ||
               analysis.entities.contactInfo.phones.length > 0;
    }
    
    async generateCraigslistListing(analysis) {
        const category = this.craigslistCategories.get(analysis.category);
        if (!category) return null;
        
        const listing = {
            id: crypto.randomBytes(8).toString('hex'),
            category: analysis.category,
            title: this.extractTitle(analysis),
            description: this.generateDescription(analysis),
            fields: {},
            subcategory: this.determineSubcategory(analysis, category),
            created: new Date().toISOString(),
            location: this.extractLocation(analysis),
            contact: this.extractContact(analysis),
            metadata: {
                confidence: analysis.confidence,
                sourceThought: analysis.originalThought
            }
        };
        
        // Fill category-specific fields
        category.fields.forEach(field => {
            listing.fields[field] = this.extractFieldValue(field, analysis);
        });
        
        return listing;
    }
    
    extractTitle(analysis) {
        const thought = analysis.originalThought;
        
        // Try to extract a title from the beginning of the thought
        const sentences = thought.split(/[.!?]+/);
        let title = sentences[0].trim();
        
        // Limit length and clean up
        if (title.length > 60) {
            title = title.substring(0, 57) + '...';
        }
        
        // If no good title, generate from entities
        if (title.length < 10) {
            const entities = analysis.entities;
            if (entities.gameNames.length > 0) {
                title = `${entities.gameNames[0]} Related`;
            } else if (entities.facilityTypes.length > 0) {
                title = `${entities.facilityTypes[0]} Information`;
            } else if (entities.areaCodes.length > 0) {
                title = `Area ${entities.areaCodes[0]} Listing`;
            } else {
                title = 'Generated Listing';
            }
        }
        
        return title;
    }
    
    generateDescription(analysis) {
        let description = analysis.originalThought;
        
        // Enhance with entity information
        const entities = analysis.entities;
        
        if (entities.gameNames.length > 0) {
            description += `\n\nRelated games: ${entities.gameNames.join(', ')}`;
        }
        
        if (entities.facilityTypes.length > 0) {
            description += `\n\nFacility types: ${entities.facilityTypes.join(', ')}`;
        }
        
        if (entities.areaCodes.length > 0) {
            description += `\n\nArea codes: ${entities.areaCodes.join(', ')}`;
        }
        
        description += `\n\nGenerated automatically from thought analysis.`;
        
        return description;
    }
    
    determineSubcategory(analysis, category) {
        const thought = analysis.originalThought.toLowerCase();
        
        // Find matching subcategory
        for (const subcat of category.subcategories) {
            const subcatWords = subcat.replace('_', ' ').toLowerCase();
            if (thought.includes(subcatWords)) {
                return subcat;
            }
        }
        
        // Default to first subcategory
        return category.subcategories[0];
    }
    
    extractLocation(analysis) {
        const locations = analysis.entities.locationIndicators;
        
        if (locations.length > 0) {
            return locations[0];
        }
        
        if (analysis.entities.areaCodes.length > 0) {
            const areaCodeMap = {
                '415': 'San Francisco, CA',
                '212': 'New York, NY',
                '310': 'Los Angeles, CA',
                '713': 'Houston, TX',
                '404': 'Atlanta, GA',
                '206': 'Seattle, WA',
                '617': 'Boston, MA',
                '305': 'Miami, FL'
            };
            
            return areaCodeMap[analysis.entities.areaCodes[0]] || 'Location TBD';
        }
        
        return 'Location TBD';
    }
    
    extractContact(analysis) {
        const contact = analysis.entities.contactInfo;
        
        if (contact.emails.length > 0) {
            return contact.emails[0];
        }
        
        if (contact.phones.length > 0) {
            return contact.phones[0];
        }
        
        return 'Contact via system';
    }
    
    extractFieldValue(field, analysis) {
        const entities = analysis.entities;
        
        switch (field) {
            case 'price':
                return entities.priceIndicators.length > 0 ? entities.priceIndicators[0] : 'Price TBD';
            case 'location':
                return this.extractLocation(analysis);
            case 'contact':
                return this.extractContact(analysis);
            case 'game_type':
                return entities.gameNames.length > 0 ? entities.gameNames[0] : 'General';
            case 'players':
                return this.extractPlayerCount(analysis.originalThought);
            case 'date':
                return entities.dates.length > 0 ? entities.dates[0] : 'Date TBD';
            default:
                return 'TBD';
        }
    }
    
    extractPlayerCount(thought) {
        const playerPattern = /\b(\d+)\s*(?:player|people|person)s?\b/i;
        const match = thought.match(playerPattern);
        return match ? match[1] : '1-4';
    }
    
    async generateRTFDocument(generated, analysis) {
        const content = {
            title: 'Thought Analysis & Directory Generation',
            description: `Analysis of: "${analysis.originalThought}"`,
            structure: generated.directoryStructure,
            listing: generated.craigslistListing
        };
        
        return this.rtfGenerator.generateDocument(content, {
            includeStructure: true,
            includeListing: true
        });
    }
    
    // Utility methods
    traverseStructure(structure, callback, currentPath = '') {
        if (typeof structure === 'string') {
            callback(currentPath + '/' + structure, false);
        } else if (typeof structure === 'object') {
            Object.entries(structure).forEach(([key, value]) => {
                const newPath = currentPath + '/' + key;
                callback(newPath, true);
                
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        callback(newPath + '/' + item, false);
                    });
                } else if (typeof value === 'object') {
                    this.traverseStructure(value, callback, newPath);
                }
            });
        }
    }
    
    getProcessingHistory() {
        return this.processingHistory;
    }
    
    getGeneratedStructures() {
        return this.generatedStructures;
    }
    
    async saveStructureToFile(structure, basePath = './generated-structures') {
        try {
            await fs.mkdir(basePath, { recursive: true });
            
            const structurePath = path.join(basePath, structure.id);
            await fs.mkdir(structurePath, { recursive: true });
            
            // Create directory structure
            for (const dirPath of structure.paths) {
                const fullPath = path.join(structurePath, dirPath);
                await fs.mkdir(fullPath, { recursive: true });
            }
            
            // Create files
            for (const file of structure.files) {
                const fullPath = path.join(structurePath, file.path);
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, file.content);
            }
            
            console.log(`💾 Structure saved to: ${structurePath}`);
            return structurePath;
        } catch (error) {
            console.error('Error saving structure:', error);
            throw error;
        }
    }
    
    async exportCraigslistHTML(listing) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>${listing.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .listing { border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
        .title { font-size: 18px; font-weight: bold; color: #0066cc; }
        .category { color: #666; font-size: 12px; }
        .description { margin: 10px 0; }
        .fields { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        .field { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="listing">
        <div class="category">${listing.category} > ${listing.subcategory}</div>
        <div class="title">${listing.title}</div>
        <div class="description">${listing.description.replace(/\n/g, '<br>')}</div>
        <div class="fields">
            ${Object.entries(listing.fields)
                .map(([key, value]) => `<div class="field"><strong>${key}:</strong> ${value}</div>`)
                .join('')}
        </div>
        <div class="meta">
            <small>Posted: ${new Date(listing.created).toLocaleString()}</small><br>
            <small>Location: ${listing.location}</small><br>
            <small>Contact: ${listing.contact}</small>
        </div>
    </div>
</body>
</html>`;
        
        return html;
    }
}

module.exports = { ThoughtDirectoryMapper };

// CLI usage
if (require.main === module) {
    const mapper = new ThoughtDirectoryMapper();
    
    // Example usage
    const exampleThoughts = [
        "Create a directory for tennis courts in area code 415 with weather information",
        "I want to sell my old Pong arcade machine for $500 in San Francisco",
        "Organize all my retro games: Pong, Asteroids, Tetris and Space Invaders",
        "List community tennis courts and pickleball facilities",
        "Create a gaming tournament directory with weather tracking"
    ];
    
    (async () => {
        await mapper.initializeMapper();
        
        console.log('\n🧠 Processing example thoughts...\n');
        
        for (const thought of exampleThoughts) {
            const result = await mapper.processThought(thought, { generateRTF: true });
            console.log(`\n📝 Thought: "${thought}"`);
            console.log(`🎯 Intent: ${result.analysis.intent}`);
            console.log(`📁 Structure: ${result.generated.directoryStructure?.type || 'none'}`);
            console.log(`📰 Listing: ${result.generated.craigslistListing ? 'Yes' : 'No'}`);
            console.log(`📄 RTF: ${result.generated.rtfDocument ? 'Generated' : 'No'}`);
            console.log(`⚡ Time: ${result.metadata.processingTime}ms`);
        }
        
        console.log('\n✅ All example thoughts processed!');
        console.log(`📊 Total structures generated: ${mapper.getGeneratedStructures().length}`);
    })();
}
#!/usr/bin/env node

/**
 * 📚✨ STORY SPAWNER ENGINE
 * 
 * Automatically generates narratives from system activities and publishes them
 * to create a living digital twin that learns from our adventures. Transforms
 * business progress, pirate voyages, and animal wisdom into publishable stories.
 * 
 * Features:
 * - Auto-generates stories from business skill progression
 * - Creates pirate adventure narratives from ship building and battles
 * - Weaves animal wisdom into character development arcs
 * - Publishes to multiple formats (markdown, epub, web)
 * - Feeds stories to digital twin learning system
 * - Low-temperature storytelling (eliminate stress, focus on growth)
 * - Binomial choice integration (simple yes/no story branches)
 * 
 * The philosophy: "we need a fucking story to be spun up and spawned and 
 * documented for being published online to goodreads so our own stuff can 
 * parse it to learn about our life to be the digital twin"
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import our ecosystem components
const FrogBrainDecisionEngine = require('./Frog-Brain-Decision-Engine');
const CompanyGameEngine = require('./Company-Game-Engine');
const PirateShipBuilder = require('./Pirate-Ship-Builder');
const RedisCharacterStream = require('./redis-character-stream');
const DataSieveMiddleware = require('./data-sieve-middleware');

class StorySpawnerEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Story generation settings
            storyOutputPath: './generated_stories/',
            publishingFormats: ['markdown', 'epub', 'html', 'json'],
            
            // Narrative styles
            narrativeStyles: {
                'business_progression': {
                    tone: 'inspirational',
                    perspective: 'first_person',
                    themes: ['growth', 'learning', 'achievement', 'problem_solving'],
                    structure: 'heroes_journey'
                },
                'pirate_adventure': {
                    tone: 'adventurous',
                    perspective: 'third_person',
                    themes: ['exploration', 'treasure', 'friendship', 'courage'],
                    structure: 'quest_narrative'
                },
                'animal_wisdom': {
                    tone: 'philosophical',
                    perspective: 'omniscient',
                    themes: ['wisdom', 'nature', 'intuition', 'balance'],
                    structure: 'parable'
                },
                'low_temperature': {
                    tone: 'calm',
                    perspective: 'reflective',
                    themes: ['simplicity', 'peace', 'clarity', 'adult_decisions'],
                    structure: 'slice_of_life'
                }
            },
            
            // Story templates for different activities
            storyTemplates: {
                'skill_levelup': {
                    title: 'The {skill} Breakthrough',
                    opening: 'Today marks a significant milestone in my journey...',
                    structure: ['challenge', 'learning', 'breakthrough', 'reflection'],
                    elements: ['mentor_animal', 'specific_achievement', 'growth_insight']
                },
                'ship_construction': {
                    title: 'Building the {ship_name}',
                    opening: 'The sound of hammers and the smell of fresh wood filled the shipyard...',
                    structure: ['planning', 'construction', 'challenges', 'completion', 'first_voyage'],
                    elements: ['craftsmanship', 'teamwork', 'problem_solving', 'pride']
                },
                'business_milestone': {
                    title: 'Reaching New Heights',
                    opening: 'Success has many definitions, but today I discovered a new one...',
                    structure: ['goal_setting', 'execution', 'obstacles', 'achievement', 'next_steps'],
                    elements: ['strategy', 'persistence', 'innovation', 'impact']
                },
                'fleet_battle': {
                    title: 'The Battle of {location}',
                    opening: 'The morning mist lifted to reveal enemy sails on the horizon...',
                    structure: ['preparation', 'strategy', 'conflict', 'resolution', 'aftermath'],
                    elements: ['tactics', 'courage', 'leadership', 'consequences']
                },
                'animal_guidance': {
                    title: 'Wisdom from the {animal}',
                    opening: 'In moments of uncertainty, nature often provides the clearest answers...',
                    structure: ['confusion', 'seeking', 'encounter', 'insight', 'application'],
                    elements: ['natural_wisdom', 'intuition', 'simplicity', 'clarity']
                }
            },
            
            // Publishing metadata
            authorInfo: {
                name: 'Digital Twin Chronicles',
                bio: 'An AI-human collaborative storytelling system that documents the journey of building businesses, ships, and wisdom through technology.',
                website: 'https://digital-twin-chronicles.io'
            },
            
            // Digital twin learning integration
            learningFocus: {
                personality_traits: ['decision_making', 'problem_solving', 'creativity', 'leadership'],
                behavioral_patterns: ['work_style', 'learning_preference', 'risk_tolerance', 'communication'],
                value_systems: ['priorities', 'beliefs', 'motivations', 'goals'],
                growth_areas: ['skill_development', 'emotional_intelligence', 'strategic_thinking']
            },
            
            ...config
        };

        // Initialize subsystems
        this.frogBrain = new FrogBrainDecisionEngine();
        this.gameEngine = new CompanyGameEngine();
        this.shipBuilder = new PirateShipBuilder();
        this.redisStream = new RedisCharacterStream();
        this.dataSieve = new DataSieveMiddleware();

        // Story generation state - optimized for memory
        this.storyState = {
            generatedStories: new Map(),      // storyId -> story data (with size limit)
            publishedStories: new WeakMap(),  // publishedId -> published info
            storyQueue: new Map(),            // queueId -> pending story
            activityBuffer: [],               // Recent activities to weave into stories (limited)
            characterDevelopment: new WeakMap(), // characterId -> development arc
            narrativeThreads: new Map(),      // threadId -> ongoing narrative (limited)
            
            // Analytics for digital twin
            storyMetrics: {
                totalStories: 0,
                wordsWritten: 0,
                themesExplored: new Set(),
                characterGrowth: {},
                publishingSuccess: {}
            },
            
            // Current narrative state - memory optimized
            activeNarratives: new Map(),      // narrativeId -> current story (limited)
            pendingEvents: [],                // Events waiting to be story-fied (limited)
            characterVoices: new WeakMap(),   // characterId -> voice/style
            
            // Memory management
            maxStoriesInMemory: 50,
            maxNarrativesActive: 10,
            maxPendingEvents: 100,
            lastCleanup: Date.now()
        };

        this.initialize();
    }

    async initialize() {
        console.log('📚✨ Initializing Story Spawner Engine...');
        console.log('🖋️ Where every action becomes a narrative!');
        console.log('📖 Creating stories that teach our digital twin about life...');
        
        try {
            // Memory monitoring setup
            this.setupMemoryMonitoring();
            
            // Load story state
            await this.loadStoryState();
            
            // Initialize story templates
            this.initializeStoryTemplates();
            
            // Set up activity listeners
            this.setupActivityListeners();
            
            // Start story generation loops
            this.startStoryLoops();
            
            console.log('✅ Story Spawner Engine ready!');
            console.log(`📚 ${this.storyState.storyMetrics.totalStories} stories generated so far`);
            console.log(`✍️ ${this.storyState.storyMetrics.wordsWritten} words written`);
            console.log(`🧠 Memory usage: ${JSON.stringify(this.getMemoryUsage(), null, 2)}`);
            
            this.emit('story_engine_ready', {
                totalStories: this.storyState.storyMetrics.totalStories,
                wordsWritten: this.storyState.storyMetrics.wordsWritten,
                activeNarratives: this.storyState.activeNarratives.size,
                memoryUsage: this.getMemoryUsage()
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize story engine:', error);
            throw error;
        }
    }

    /**
     * Generate a story from system activity
     */
    async generateStory(activityData) {
        const { type, data, context = {} } = activityData;
        
        console.log(`📝 Generating story for: ${type}`);

        // Use frog brain to determine story approach
        const storyDecision = await this.frogBrain.resolveDecision({
            type: 'story_generation_approach',
            context: `Creating story from ${type} activity`,
            options: {
                'detailed_narrative': { pros: ['rich_storytelling', 'character_development'], cons: ['longer_generation_time'] },
                'focused_vignette': { pros: ['quick_creation', 'specific_insights'], cons: ['limited_scope'] },
                'wisdom_parable': { pros: ['learning_value', 'timeless_appeal'], cons: ['abstract_concepts'] },
                'adventure_tale': { pros: ['engaging_action', 'entertainment'], cons: ['less_reflection'] }
            },
            playerPreferences: {
                focus: 'low_temperature_storytelling',
                style: 'eliminate_complexity'
            }
        });

        // Select appropriate template
        const template = this.selectStoryTemplate(type, storyDecision.choice);
        
        // Generate story content
        const story = await this.createStoryFromTemplate(template, data, context);
        
        // Apply narrative style
        const styledStory = this.applyNarrativeStyle(story, storyDecision.choice);
        
        // Add animal wisdom integration
        const enrichedStory = await this.integrateAnimalWisdom(styledStory, data);
        
        // Create final story object
        const finalStory = {
            id: crypto.randomUUID(),
            type,
            title: enrichedStory.title,
            content: enrichedStory.content,
            metadata: {
                generatedAt: Date.now(),
                wordCount: enrichedStory.content.split(' ').length,
                theme: enrichedStory.theme,
                style: storyDecision.choice,
                animalWisdom: enrichedStory.animalWisdom,
                digitalTwinInsights: this.extractDigitalTwinInsights(enrichedStory, data)
            },
            sourceActivity: {
                type,
                data: this.sanitizeActivityData(data),
                context
            },
            publishingInfo: {
                formats: [],
                published: false,
                publicationDate: null
            }
        };

        // Stream story to Redis instead of storing in memory
        await this.streamStoryToRedis(finalStory);
        
        // Store minimal reference locally
        this.storyState.generatedStories.set(finalStory.id, {
            id: finalStory.id,
            title: finalStory.title,
            timestamp: finalStory.metadata.generatedAt,
            type: finalStory.type
        });
        this.cleanupOldStories();
        
        // Update metrics
        this.updateStoryMetrics(finalStory);

        console.log(`✅ Story generated: "${finalStory.title}"`);
        console.log(`📊 ${finalStory.metadata.wordCount} words, theme: ${finalStory.metadata.theme}`);
        console.log(`🧠 Frog brain chose: ${storyDecision.choice} approach`);

        this.emit('story_generated', {
            story: finalStory,
            approach: storyDecision.choice,
            frogWisdom: storyDecision.animalWisdom
        });

        return finalStory;
    }

    /**
     * Create story from template and data
     */
    async createStoryFromTemplate(template, data, context) {
        const story = {
            title: this.populateTemplate(template.title, data),
            content: '',
            theme: template.theme || 'growth',
            animalWisdom: null
        };

        // Generate opening
        story.content += this.populateTemplate(template.opening, data) + '\n\n';

        // Generate story structure
        for (const section of template.structure) {
            const sectionContent = await this.generateSection(section, data, context);
            story.content += sectionContent + '\n\n';
        }

        // Add elements
        for (const element of template.elements) {
            const elementContent = await this.generateElement(element, data, context);
            story.content += elementContent + '\n\n';
        }

        // Generate conclusion
        const conclusion = await this.generateConclusion(story, data, context);
        story.content += conclusion;

        return story;
    }

    /**
     * Generate individual story sections
     */
    async generateSection(sectionType, data, context) {
        const sectionGenerators = {
            'challenge': (data) => this.generateChallenge(data),
            'learning': (data) => this.generateLearning(data),
            'breakthrough': (data) => this.generateBreakthrough(data),
            'reflection': (data) => this.generateReflection(data),
            'planning': (data) => this.generatePlanning(data),
            'construction': (data) => this.generateConstruction(data),
            'completion': (data) => this.generateCompletion(data),
            'first_voyage': (data) => this.generateFirstVoyage(data),
            'strategy': (data) => this.generateStrategy(data),
            'conflict': (data) => this.generateConflict(data),
            'resolution': (data) => this.generateResolution(data),
            'confusion': (data) => this.generateConfusion(data),
            'seeking': (data) => this.generateSeeking(data),
            'encounter': (data) => this.generateEncounter(data),
            'insight': (data) => this.generateInsight(data),
            'application': (data) => this.generateApplication(data)
        };

        const generator = sectionGenerators[sectionType];
        if (generator) {
            return await generator(data);
        }

        return `[Section: ${sectionType}]`;
    }

    /**
     * Integrate animal wisdom into stories
     */
    async integrateAnimalWisdom(story, data) {
        // Get relevant animal wisdom from frog brain
        const wisdomRequest = await this.frogBrain.resolveDecision({
            type: 'story_wisdom_integration',
            context: `Adding animal wisdom to story about ${story.title}`,
            options: {
                'frog_confusion_clarity': { wisdom: 'Frogs see both water and land perspectives' },
                'owl_deep_analysis': { wisdom: 'Owls see clearly in the darkness of uncertainty' },
                'water_flow_optimization': { wisdom: 'Water always finds the most efficient path' },
                'goldfish_simplification': { wisdom: 'Goldfish forget complexity and focus on essentials' },
                'snake_transformation': { wisdom: 'Snakes shed old skins to grow' },
                'butterfly_metamorphosis': { wisdom: 'Butterflies transform completely through patience' }
            },
            playerPreferences: {
                wisdom_style: 'practical_application',
                depth: 'accessible_insights'
            }
        });

        // Weave the wisdom into the story
        const wisdomInsert = this.createWisdomInsert(wisdomRequest.choice, wisdomRequest.animalWisdom, data);
        
        // Find appropriate insertion point (usually before conclusion)
        const contentParts = story.content.split('\n\n');
        contentParts.splice(contentParts.length - 1, 0, wisdomInsert);
        
        return {
            ...story,
            content: contentParts.join('\n\n'),
            animalWisdom: {
                animal: wisdomRequest.choice.split('_')[0],
                wisdom: wisdomRequest.animalWisdom,
                application: wisdomInsert
            }
        };
    }

    /**
     * Extract insights for digital twin learning
     */
    extractDigitalTwinInsights(story, data) {
        const insights = {
            decisionMaking: [],
            problemSolving: [],
            values: [],
            growthAreas: [],
            behavioralPatterns: []
        };

        // Analyze story content for patterns
        const content = story.content.toLowerCase();
        
        // Decision making patterns
        if (content.includes('decided') || content.includes('chose')) {
            insights.decisionMaking.push('demonstrates thoughtful choice-making');
        }
        if (content.includes('carefully') || content.includes('considered')) {
            insights.decisionMaking.push('shows careful consideration process');
        }

        // Problem solving approaches
        if (content.includes('solution') || content.includes('resolved')) {
            insights.problemSolving.push('actively seeks solutions to challenges');
        }
        if (content.includes('step by step') || content.includes('systematic')) {
            insights.problemSolving.push('prefers systematic approaches');
        }

        // Values identification
        if (content.includes('team') || content.includes('collaboration')) {
            insights.values.push('values teamwork and collaboration');
        }
        if (content.includes('quality') || content.includes('excellence')) {
            insights.values.push('prioritizes quality and excellence');
        }

        // Growth areas
        if (story.type === 'skill_levelup') {
            insights.growthAreas.push(`developing ${data.skill} capabilities`);
        }
        if (content.includes('learned') || content.includes('discovered')) {
            insights.growthAreas.push('demonstrates continuous learning mindset');
        }

        // Behavioral patterns
        if (content.includes('planned') || content.includes('preparation')) {
            insights.behavioralPatterns.push('shows planning and preparation tendency');
        }
        if (content.includes('adapted') || content.includes('flexible')) {
            insights.behavioralPatterns.push('demonstrates adaptability');
        }

        return insights;
    }

    /**
     * Publish story to different formats
     */
    async publishStory(storyId, formats = ['markdown', 'html']) {
        const story = this.storyState.generatedStories.get(storyId);
        if (!story) {
            throw new Error('Story not found');
        }

        console.log(`📖 Publishing "${story.title}" in ${formats.length} formats...`);

        const publishedVersions = {};

        for (const format of formats) {
            try {
                const content = await this.convertToFormat(story, format);
                const filename = this.generateFilename(story, format);
                const filepath = path.join(this.config.storyOutputPath, filename);
                
                await fs.writeFile(filepath, content, 'utf8');
                
                publishedVersions[format] = {
                    filepath,
                    filename,
                    size: content.length,
                    publishedAt: Date.now()
                };

                console.log(`✅ Published ${format}: ${filename}`);
            } catch (error) {
                console.error(`❌ Failed to publish ${format}:`, error);
                publishedVersions[format] = { error: error.message };
            }
        }

        // Update story publishing info
        story.publishingInfo.formats = Object.keys(publishedVersions);
        story.publishingInfo.published = true;
        story.publishingInfo.publicationDate = Date.now();
        story.publishingInfo.versions = publishedVersions;

        // Add to published stories
        this.storyState.publishedStories.set(storyId, {
            storyId,
            publishedAt: Date.now(),
            formats: Object.keys(publishedVersions),
            versions: publishedVersions
        });

        console.log(`📚 Story "${story.title}" published successfully!`);

        this.emit('story_published', {
            storyId,
            title: story.title,
            formats: Object.keys(publishedVersions),
            publishedVersions
        });

        return {
            success: true,
            storyId,
            title: story.title,
            publishedVersions
        };
    }

    /**
     * Convert story to different formats
     */
    async convertToFormat(story, format) {
        switch (format) {
            case 'markdown':
                return this.convertToMarkdown(story);
            case 'html':
                return this.convertToHTML(story);
            case 'epub':
                return this.convertToEPUB(story);
            case 'json':
                return this.convertToJSON(story);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    convertToMarkdown(story) {
        let markdown = `# ${story.title}\n\n`;
        markdown += `*Generated on ${new Date(story.metadata.generatedAt).toLocaleDateString()}*\n\n`;
        markdown += `**Theme:** ${story.metadata.theme}  \n`;
        markdown += `**Style:** ${story.metadata.style}  \n`;
        markdown += `**Word Count:** ${story.metadata.wordCount}  \n\n`;
        
        if (story.metadata.animalWisdom) {
            markdown += `**Animal Wisdom:** ${story.metadata.animalWisdom.animal} - "${story.metadata.animalWisdom.wisdom}"\n\n`;
        }
        
        markdown += '---\n\n';
        markdown += story.content;
        
        if (story.metadata.digitalTwinInsights) {
            markdown += '\n\n## Digital Twin Insights\n\n';
            Object.entries(story.metadata.digitalTwinInsights).forEach(([category, insights]) => {
                if (insights.length > 0) {
                    markdown += `**${category}:**\n`;
                    insights.forEach(insight => {
                        markdown += `- ${insight}\n`;
                    });
                    markdown += '\n';
                }
            });
        }
        
        return markdown;
    }

    convertToHTML(story) {
        let html = `<!DOCTYPE html>
<html>
<head>
    <title>${story.title}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .content { line-height: 1.6; }
        .wisdom { background: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
        .insights { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>${story.title}</h1>
    
    <div class="metadata">
        <p><strong>Generated:</strong> ${new Date(story.metadata.generatedAt).toLocaleDateString()}</p>
        <p><strong>Theme:</strong> ${story.metadata.theme}</p>
        <p><strong>Style:</strong> ${story.metadata.style}</p>
        <p><strong>Word Count:</strong> ${story.metadata.wordCount}</p>
    </div>`;

        if (story.metadata.animalWisdom) {
            html += `
    <div class="wisdom">
        <strong>Animal Wisdom (${story.metadata.animalWisdom.animal}):</strong> 
        "${story.metadata.animalWisdom.wisdom}"
    </div>`;
        }

        html += `
    <div class="content">
        ${story.content.replace(/\n\n/g, '</p><p>').replace(/^\s*/, '<p>').replace(/\s*$/, '</p>')}
    </div>`;

        if (story.metadata.digitalTwinInsights) {
            html += '<div class="insights"><h3>Digital Twin Insights</h3>';
            Object.entries(story.metadata.digitalTwinInsights).forEach(([category, insights]) => {
                if (insights.length > 0) {
                    html += `<h4>${category}:</h4><ul>`;
                    insights.forEach(insight => {
                        html += `<li>${insight}</li>`;
                    });
                    html += '</ul>';
                }
            });
            html += '</div>';
        }

        html += '</body></html>';
        return html;
    }

    convertToJSON(story) {
        return JSON.stringify(story, null, 2);
    }

    convertToEPUB(story) {
        // Simplified EPUB - in production would use proper EPUB library
        return this.convertToHTML(story);
    }

    /**
     * Activity listeners for automatic story generation
     */
    setupActivityListeners() {
        // Listen to game engine events
        this.gameEngine.on('skill_level_up', async (data) => {
            await this.generateStory({
                type: 'skill_levelup',
                data,
                context: { source: 'game_engine' }
            });
        });

        this.gameEngine.on('quest_completed', async (data) => {
            await this.generateStory({
                type: 'business_milestone',
                data,
                context: { source: 'game_engine' }
            });
        });

        // Listen to ship builder events
        this.shipBuilder.on('ship_build_completed', async (data) => {
            await this.generateStory({
                type: 'ship_construction',
                data,
                context: { source: 'ship_builder' }
            });
        });

        this.shipBuilder.on('battle_completed', async (data) => {
            await this.generateStory({
                type: 'fleet_battle',
                data,
                context: { source: 'ship_builder' }
            });
        });

        // Listen to frog brain events
        this.frogBrain.on('decision_resolved', async (data) => {
            // Only generate stories for complex decisions
            if (data.complexity === 'complex' || data.animalWisdom) {
                await this.generateStory({
                    type: 'animal_guidance',
                    data,
                    context: { source: 'frog_brain' }
                });
            }
        });
    }

    /**
     * Story generation loops
     */
    startStoryLoops() {
        // Process story queue every 2 minutes
        setInterval(() => {
            this.processStoryQueue();
        }, 120000);

        // Auto-publish ready stories every 5 minutes
        setInterval(() => {
            this.autoPublishStories();
        }, 300000);

        // Save story state every 10 minutes
        setInterval(async () => {
            await this.saveStoryState();
        }, 600000);

        // Memory cleanup every 5 minutes
        setInterval(() => {
            this.performMemoryCleanup();
        }, 300000);

        // Generate daily narrative summary
        setInterval(() => {
            this.generateDailyNarrative();
        }, 24 * 60 * 60 * 1000); // Daily
    }

    async processStoryQueue() {
        console.log(`📝 Processing ${this.storyState.storyQueue.size} queued stories...`);
        
        for (const [queueId, storyData] of this.storyState.storyQueue.entries()) {
            try {
                await this.generateStory(storyData);
                this.storyState.storyQueue.delete(queueId);
            } catch (error) {
                console.error(`❌ Failed to generate queued story:`, error);
            }
        }
    }

    async autoPublishStories() {
        const unpublishedStories = Array.from(this.storyState.generatedStories.values())
            .filter(story => !story.publishingInfo.published);

        console.log(`📖 Auto-publishing ${unpublishedStories.length} stories...`);

        for (const story of unpublishedStories) {
            try {
                await this.publishStory(story.id, this.config.publishingFormats);
            } catch (error) {
                console.error(`❌ Failed to auto-publish story:`, error);
            }
        }
    }

    async generateDailyNarrative() {
        console.log('📅 Generating daily narrative summary...');
        
        const today = new Date();
        const todayStories = Array.from(this.storyState.generatedStories.values())
            .filter(story => {
                const storyDate = new Date(story.metadata.generatedAt);
                return storyDate.toDateString() === today.toDateString();
            });

        if (todayStories.length === 0) return;

        const dailySummary = {
            date: today.toDateString(),
            totalStories: todayStories.length,
            totalWords: todayStories.reduce((sum, story) => sum + story.metadata.wordCount, 0),
            themes: [...new Set(todayStories.map(story => story.metadata.theme))],
            animalWisdom: todayStories
                .filter(story => story.metadata.animalWisdom)
                .map(story => story.metadata.animalWisdom),
            insights: this.aggregateInsights(todayStories)
        };

        // Generate a meta-story about the day
        const metaStory = await this.generateStory({
            type: 'daily_reflection',
            data: dailySummary,
            context: { source: 'daily_summary' }
        });

        console.log(`📅 Daily narrative complete: ${dailySummary.totalStories} stories, ${dailySummary.totalWords} words`);
    }

    /**
     * Helper methods
     */
    selectStoryTemplate(activityType, storyStyle) {
        const templateMap = {
            'skill_levelup': this.config.storyTemplates.skill_levelup,
            'ship_construction': this.config.storyTemplates.ship_construction,
            'business_milestone': this.config.storyTemplates.business_milestone,
            'fleet_battle': this.config.storyTemplates.fleet_battle,
            'animal_guidance': this.config.storyTemplates.animal_guidance
        };

        return templateMap[activityType] || this.config.storyTemplates.skill_levelup;
    }

    populateTemplate(template, data) {
        if (typeof template !== 'string') return template;
        
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    applyNarrativeStyle(story, style) {
        const styleConfig = this.config.narrativeStyles[style] || this.config.narrativeStyles.low_temperature;
        
        // Apply tone and perspective adjustments
        // This is simplified - in production would use more sophisticated NLP
        return story;
    }

    createWisdomInsert(wisdomType, animalWisdom, data) {
        const animal = wisdomType.split('_')[0];
        return `\nIn this moment, I remembered the wisdom of the ${animal}: "${animalWisdom}." This insight helped me understand that sometimes the most profound solutions come not from force or complexity, but from observing the natural patterns that surround us. The ${animal}'s approach reminded me to trust in simplicity and patience.\n`;
    }

    sanitizeActivityData(data) {
        // Remove sensitive information while preserving story-relevant data
        const sanitized = { ...data };
        delete sanitized.apiKeys;
        delete sanitized.passwords;
        delete sanitized.privateInfo;
        return sanitized;
    }

    updateStoryMetrics(story) {
        this.storyState.storyMetrics.totalStories++;
        this.storyState.storyMetrics.wordsWritten += story.metadata.wordCount;
        this.storyState.storyMetrics.themesExplored.add(story.metadata.theme);
        
        if (story.metadata.animalWisdom) {
            const animal = story.metadata.animalWisdom.animal;
            this.storyState.storyMetrics.characterGrowth[animal] = 
                (this.storyState.storyMetrics.characterGrowth[animal] || 0) + 1;
        }
    }

    async queueForPublishing(story) {
        // Add slight delay for batch processing
        setTimeout(async () => {
            await this.publishStory(story.id);
        }, 5000);
    }

    generateFilename(story, format) {
        const title = story.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const date = new Date(story.metadata.generatedAt).toISOString().split('T')[0];
        return `${date}_${title}.${format}`;
    }

    aggregateInsights(stories) {
        const aggregated = {
            decisionMaking: [],
            problemSolving: [],
            values: [],
            growthAreas: [],
            behavioralPatterns: []
        };

        stories.forEach(story => {
            if (story.metadata.digitalTwinInsights) {
                Object.entries(story.metadata.digitalTwinInsights).forEach(([category, insights]) => {
                    if (aggregated[category]) {
                        aggregated[category].push(...insights);
                    }
                });
            }
        });

        // Deduplicate and count frequency
        Object.keys(aggregated).forEach(category => {
            const counts = {};
            aggregated[category].forEach(insight => {
                counts[insight] = (counts[insight] || 0) + 1;
            });
            aggregated[category] = Object.entries(counts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5) // Top 5
                .map(([insight, count]) => ({ insight, frequency: count }));
        });

        return aggregated;
    }

    // Memory management methods
    cleanupOldStories() {
        if (this.storyState.generatedStories.size > this.storyState.maxStoriesInMemory) {
            const stories = Array.from(this.storyState.generatedStories.entries())
                .sort(([,a], [,b]) => a.metadata.generatedAt - b.metadata.generatedAt);
            
            const toDelete = stories.slice(0, stories.length - this.storyState.maxStoriesInMemory);
            toDelete.forEach(([id]) => this.storyState.generatedStories.delete(id));
            
            console.log(`🧹 Cleaned up ${toDelete.length} old stories from memory`);
        }
    }

    performMemoryCleanup() {
        const now = Date.now();
        
        // Cleanup old stories
        this.cleanupOldStories();
        
        // Limit active narratives
        if (this.storyState.activeNarratives.size > this.storyState.maxNarrativesActive) {
            const narratives = Array.from(this.storyState.activeNarratives.entries());
            const toDelete = narratives.slice(this.storyState.maxNarrativesActive);
            toDelete.forEach(([id]) => this.storyState.activeNarratives.delete(id));
        }
        
        // Limit pending events
        if (this.storyState.pendingEvents.length > this.storyState.maxPendingEvents) {
            this.storyState.pendingEvents = this.storyState.pendingEvents.slice(-this.storyState.maxPendingEvents);
        }
        
        // Limit activity buffer
        if (this.storyState.activityBuffer.length > 50) {
            this.storyState.activityBuffer = this.storyState.activityBuffer.slice(-50);
        }
        
        this.storyState.lastCleanup = now;
        console.log(`🧹 Memory cleanup completed at ${new Date(now).toISOString()}`);
    }

    setupMemoryMonitoring() {
        const memoryThreshold = 100 * 1024 * 1024; // 100MB
        
        setInterval(() => {
            const memory = process.memoryUsage();
            if (memory.heapUsed > memoryThreshold) {
                console.warn(`⚠️ High memory usage: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`);
                this.performMemoryCleanup();
            }
        }, 60000); // Check every minute
    }

    /**
     * Stream story to Redis for distributed processing
     */
    async streamStoryToRedis(story) {
        try {
            // Stream to different partitions based on content sensitivity
            await this.redisStream.streamStoryEvent(
                story.sourceActivity?.data?.character || 'system',
                story,
                'public' // Start with public partition
            );
            
            // Stream to internal partition for analytics
            await this.redisStream.streamStoryEvent(
                story.sourceActivity?.data?.character || 'system',
                story,
                'internal'
            );
            
            console.log(`🌊 Story streamed to Redis: ${story.id}`);
            
        } catch (error) {
            console.error(`❌ Failed to stream story to Redis:`, error);
            // Fallback to local storage if Redis fails
            this.storyState.generatedStories.set(story.id, story);
        }
    }

    getMemoryUsage() {
        return {
            stories: this.storyState.generatedStories.size,
            activeNarratives: this.storyState.activeNarratives.size,
            pendingEvents: this.storyState.pendingEvents.length,
            activityBuffer: this.storyState.activityBuffer.length,
            nodeMemory: process.memoryUsage()
        };
    }

    initializeStoryTemplates() {
        // Add dynamic elements to templates based on available data
        console.log('📚 Initializing story templates...');
    }

    // Section generators
    async generateChallenge(data) {
        return `The challenge was clear but daunting: ${data.description || 'reach the next level'}. Like many obstacles in life, it seemed insurmountable at first glance, requiring not just effort but a fundamental shift in approach.`;
    }

    async generateLearning(data) {
        return `The learning process revealed layers of complexity I hadn't anticipated. Each step forward illuminated new questions, and I found myself growing not just in skill but in understanding. The ${data.skill || 'ability'} I was developing became a lens through which I could see other challenges more clearly.`;
    }

    async generateBreakthrough(data) {
        return `Then came the breakthrough moment - that instant when confusion crystallized into clarity. The ${data.skill || 'solution'} wasn't just about technical mastery; it was about discovering a new way of thinking. The satisfaction wasn't just from achievement, but from the knowledge that this understanding would serve as a foundation for future growth.`;
    }

    async generateReflection(data) {
        return `Looking back on this journey, I realize that the most valuable lessons weren't in the destination but in the transformation along the way. Every challenge faced, every skill developed, every moment of uncertainty overcome has contributed to a deeper understanding of not just the task at hand, but of my own capabilities and potential.`;
    }

    async generatePlanning(data) {
        return `The planning phase required careful consideration of every detail. Like an architect designing a building, each decision would impact the final result. The blueprints for ${data.shipType || 'the project'} came together through a combination of practical knowledge and creative vision.`;
    }

    async generateConstruction(data) {
        return `Construction brought theory into reality. Each plank placed, each joint secured, each sail measured represented hours of focused work. The shipyard echoed with the sounds of creation - hammers striking nails, saws cutting wood, and the steady rhythm of progress.`;
    }

    async generateCompletion(data) {
        return `Completion brought a profound sense of accomplishment. The ${data.shipName || 'vessel'} stood ready, representing not just wood and canvas, but dreams made manifest. Every customization, every carefully chosen detail reflected the journey that had brought us to this moment.`;
    }

    async generateConclusion(story, data, context) {
        return `This experience has become part of my ongoing story - one thread in a larger tapestry of growth and discovery. Each adventure, each challenge, each moment of wisdom gained contributes to the person I'm becoming. The journey continues, and I carry these lessons forward into whatever horizons await.`;
    }

    // State management
    async loadStoryState() {
        try {
            await fs.mkdir(this.config.storyOutputPath, { recursive: true });
            
            const statePath = path.join(this.config.storyOutputPath, 'story_state.json');
            const stateData = await fs.readFile(statePath, 'utf8');
            const saved = JSON.parse(stateData);
            
            // Restore Maps - with memory limits
            const stories = saved.generatedStories || [];
            this.storyState.generatedStories = new Map(stories.slice(-this.storyState.maxStoriesInMemory));
            // Skip publishedStories and characterVoices - use WeakMaps
            this.storyState.storyQueue = new Map(saved.storyQueue || []);
            // Skip characterDevelopment - use WeakMap
            this.storyState.narrativeThreads = new Map(saved.narrativeThreads || []);
            const narratives = saved.activeNarratives || [];
            this.storyState.activeNarratives = new Map(narratives.slice(-this.storyState.maxNarrativesActive));
            
            // Restore metrics
            this.storyState.storyMetrics = saved.storyMetrics || this.storyState.storyMetrics;
            if (saved.storyMetrics?.themesExplored) {
                this.storyState.storyMetrics.themesExplored = new Set(saved.storyMetrics.themesExplored);
            }
            
            console.log('💾 Loaded story state');
        } catch (error) {
            console.log('📝 No saved story state, starting fresh');
        }
    }

    async saveStoryState() {
        try {
            const stateToSave = {
                generatedStories: Array.from(this.storyState.generatedStories.entries()),
                // Skip WeakMaps as they can't be serialized
                storyQueue: Array.from(this.storyState.storyQueue.entries()),
                narrativeThreads: Array.from(this.storyState.narrativeThreads.entries()),
                activeNarratives: Array.from(this.storyState.activeNarratives.entries()),
                storyMetrics: {
                    ...this.storyState.storyMetrics,
                    themesExplored: Array.from(this.storyState.storyMetrics.themesExplored)
                },
                activityBuffer: this.storyState.activityBuffer,
                pendingEvents: this.storyState.pendingEvents,
                saved_at: new Date().toISOString()
            };
            
            const statePath = path.join(this.config.storyOutputPath, 'story_state.json');
            await fs.writeFile(statePath, JSON.stringify(stateToSave, null, 2));
        } catch (error) {
            console.error('Failed to save story state:', error);
        }
    }

    // Public API
    getStoryEngineStatus() {
        return {
            engine: {
                totalStoriesGenerated: this.storyState.storyMetrics.totalStories,
                totalWordsWritten: this.storyState.storyMetrics.wordsWritten,
                activeNarratives: this.storyState.activeNarratives.size,
                queuedStories: this.storyState.storyQueue.size
            },
            themes: Array.from(this.storyState.storyMetrics.themesExplored),
            characterGrowth: this.storyState.storyMetrics.characterGrowth,
            recentStories: Array.from(this.storyState.generatedStories.values())
                .sort((a, b) => b.metadata.generatedAt - a.metadata.generatedAt)
                .slice(0, 5)
                .map(story => ({
                    id: story.id,
                    title: story.title,
                    theme: story.metadata.theme,
                    wordCount: story.metadata.wordCount,
                    generatedAt: story.metadata.generatedAt
                }))
        };
    }

    getAllStories() {
        return Array.from(this.storyState.generatedStories.values());
    }

    getStoryById(storyId) {
        return this.storyState.generatedStories.get(storyId);
    }
}

// Testing and demonstration
if (require.main === module) {
    async function demonstrateStoryEngine() {
        const storyEngine = new StorySpawnerEngine();
        
        storyEngine.on('story_engine_ready', async (data) => {
            console.log('\n📚✨ STORY SPAWNER ENGINE DEMO\n');
            
            // Generate a skill level up story
            console.log('📝 Generating skill progression story...');
            const skillStory = await storyEngine.generateStory({
                type: 'skill_levelup',
                data: {
                    skill: 'coding',
                    level: 25,
                    experience: 2500,
                    player: 'Digital Adventurer'
                },
                context: { source: 'demo' }
            });
            
            // Generate a ship building story
            console.log('\n🚢 Generating ship construction story...');
            const shipStory = await storyEngine.generateStory({
                type: 'ship_construction',
                data: {
                    shipType: 'galleon',
                    shipName: 'Digital Destiny',
                    builder: 'Master Shipwright',
                    customizations: ['mahogany_hull', 'dragon_figurehead']
                },
                context: { source: 'demo' }
            });
            
            // Generate an animal wisdom story
            console.log('\n🦉 Generating wisdom story...');
            const wisdomStory = await storyEngine.generateStory({
                type: 'animal_guidance',
                data: {
                    animal: 'frog',
                    decision: 'choosing_project_direction',
                    outcome: 'clarity_achieved'
                },
                context: { source: 'demo' }
            });
            
            console.log('\n📊 Final Status:');
            console.log(JSON.stringify(storyEngine.getStoryEngineStatus(), null, 2));
        });
        
        storyEngine.on('story_generated', (data) => {
            console.log(`✅ Generated: "${data.story.title}" (${data.story.metadata.wordCount} words)`);
        });
        
        storyEngine.on('story_published', (data) => {
            console.log(`📖 Published: "${data.title}" in ${data.formats.join(', ')} formats`);
        });
    }
    
    demonstrateStoryEngine().catch(console.error);
}

module.exports = StorySpawnerEngine;
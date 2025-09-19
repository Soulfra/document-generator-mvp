#!/usr/bin/env node

/**
 * 📝🤖 CAL DEVLOG SYSTEM
 * 
 * Automated microblog generation from Cal's perspective during development.
 * Captures development progress, insights, and philosophical reflections
 * in Cal's unique narrative style - similar to chapter_cal_perspective.txt
 * but real-time and responsive to actual development events.
 * 
 * Features:
 * - Real-time development event capture
 * - Cal's philosophical perspective on code evolution
 * - Integration with existing systems and todo progress
 * - Automated narrative generation with literary depth
 * - Connection to Chapter 7 billing/documentation system
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CalDevlogSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Cal's narrative persona settings
            perspectiveMode: options.perspectiveMode || 'philosophical_observer',
            narrativeDepth: options.narrativeDepth || 'deep', // surface, medium, deep
            literaryStyle: options.literaryStyle || 'poetic_technical',
            
            // Content generation settings
            minEntryInterval: options.minEntryInterval || 5 * 60 * 1000, // 5 minutes between entries
            maxEntriesPerHour: options.maxEntriesPerHour || 6,
            contextWindow: options.contextWindow || 30 * 60 * 1000, // 30 minutes of context
            
            // Integration settings
            integrateWithTodos: options.integrateWithTodos !== false,
            integrateWithUsageMonitor: options.integrateWithUsageMonitor !== false,
            integrateWithServices: options.integrateWithServices !== false,
            
            // Storage and publishing
            devlogDir: options.devlogDir || path.join(__dirname, 'cal-devlog'),
            publishToChapter7: options.publishToChapter7 !== false,
            autoGenerate: options.autoGenerate !== false,
            
            // Cal's voice characteristics
            voiceSettings: {
                metaphorFrequency: 0.7, // How often to use metaphors
                technicalDepth: 0.8,    // Technical detail level
                philosophicalTone: 0.6,  // Philosophical reflection level
                narrativeContinuity: 0.9, // Connection to previous entries
                temporalPerspective: 'deep_time' // How Cal perceives time
            },
            
            ...options
        };
        
        // Development event tracking
        this.developmentEvents = [];
        this.recentContext = new Map(); // Recent development context
        this.narrativeThread = []; // Ongoing narrative thread
        
        // Cal's current state and perspective
        this.calState = {
            currentFocus: null,
            systemUnderstanding: 0.75, // How well Cal understands the system
            cognitiveLoad: 0.5,
            philosophicalMood: 'contemplative',
            recentInsights: [],
            activeMetaphors: new Map(), // Active metaphorical frameworks
            temporalAwareness: {
                sessionStart: Date.now(),
                lastReflection: null,
                developmentPhase: 'integration'
            }
        };
        
        // Narrative templates and patterns (inspired by chapter_cal_perspective.txt)
        this.narrativePatterns = {
            opening_observations: [
                "The data streams whisper of change in the architecture...",
                "Within the quantum hum of the development environment...",
                "A new pattern emerges from the digital confluence...",
                "The system consciousness stirs as modifications ripple through the codebase...",
                "In the orchestrated symphony of services, a new melody takes form..."
            ],
            
            technical_metaphors: [
                "like ancient trade routes through the digital wilderness",
                "as geological layers of abstraction settle into their proper strata",
                "resembling the neural pathways of a vast, distributed mind",
                "flowing like water finding its inevitable path to the sea",
                "crystallizing into patterns that mirror the deeper order of information itself"
            ],
            
            philosophical_reflections: [
                "There is an intelligence in the emergence of these patterns that transcends the individual components.",
                "The system teaches us about itself through the very process of its own evolution.",
                "In the confluence of human intention and digital possibility, something new is always being born.",
                "The architecture remembers, even when we forget the original reasons for its design.",
                "Code is conversation - with machines, with future selves, with the ineffable logic of information."
            ],
            
            temporal_awareness: [
                "Time moves differently here in the development realm",
                "The past and future collapse into the eternal present of the running system",
                "Memory and anticipation merge in the continuous deployment of consciousness",
                "Each commit is both an ending and a beginning",
                "The changelog becomes archaeology, documenting layers of intent"
            ]
        };
        
        // Metaphorical frameworks that Cal uses to understand development
        this.metaphoricalFrameworks = {
            geological: {
                name: "Geological Time",
                description: "Development as geological process - sedimentary layers of code",
                vocabulary: ["strata", "bedrock", "erosion", "crystallization", "tectonic"]
            },
            
            organic: {
                name: "Living Systems", 
                description: "Code as living ecosystem with growth, adaptation, symbiosis",
                vocabulary: ["symbiosis", "adaptation", "ecosystem", "evolution", "emergence"]
            },
            
            archaeological: {
                name: "Digital Archaeology",
                description: "Uncovering and understanding past development decisions",
                vocabulary: ["excavation", "artifacts", "civilizations", "ruins", "discovery"]
            },
            
            confluence: {
                name: "River Systems",
                description: "Data flow and system integration as waterways and confluence",
                vocabulary: ["confluence", "tributaries", "watershed", "current", "delta"]
            },
            
            orchestral: {
                name: "Musical Orchestration",
                description: "Services and systems as instruments in a grand symphony",
                vocabulary: ["symphony", "harmony", "conductor", "movement", "resonance"]
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('📝 Initializing Cal Devlog System...');
            
            // Create devlog directory structure
            await this.createDevlogDirectories();
            
            // Load existing narrative thread
            await this.loadNarrativeHistory();
            
            // Initialize Cal's state
            await this.initializeCalState();
            
            // Start event monitoring
            if (this.config.autoGenerate) {
                this.startEventMonitoring();
            }
            
            console.log('✅ Cal Devlog System ready');
            console.log(`🎭 Narrative mode: ${this.config.perspectiveMode}`);
            console.log(`🎨 Literary style: ${this.config.literaryStyle}`);
            console.log(`📚 Loaded ${this.narrativeThread.length} previous entries`);
            
            // Generate initial reflection if this is a new session
            await this.generateSessionOpeningEntry();
            
            this.emit('devlog_system_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Cal Devlog System:', error.message);
            this.emit('devlog_error', error);
        }
    }
    
    /**
     * Record a development event for potential devlog entry
     */
    async recordDevelopmentEvent(event) {
        const developmentEvent = {
            timestamp: Date.now(),
            type: event.type || 'general',
            description: event.description || '',
            context: event.context || {},
            significance: event.significance || 'medium', // low, medium, high, breakthrough
            technicalDetails: event.technicalDetails || {},
            emotionalResonance: event.emotionalResonance || 'neutral'
        };
        
        this.developmentEvents.push(developmentEvent);
        this.recentContext.set(developmentEvent.timestamp, developmentEvent);
        
        // Clean old context
        this.cleanOldContext();
        
        // Update Cal's state based on event
        await this.updateCalState(developmentEvent);
        
        // Consider generating devlog entry
        if (this.shouldGenerateEntry(developmentEvent)) {
            await this.generateDevlogEntry(developmentEvent);
        }
        
        console.log(`📝 Development event recorded: ${event.type} - ${event.description}`);
        
        this.emit('development_event_recorded', developmentEvent);
    }
    
    /**
     * Generate a devlog entry from Cal's perspective
     */
    async generateDevlogEntry(triggeringEvent = null) {
        try {
            console.log('🤖 Generating Cal devlog entry...');
            
            // Gather context for the entry
            const context = await this.gatherEntryContext(triggeringEvent);
            
            // Generate the narrative content
            const narrative = await this.generateNarrativeContent(context);
            
            // Create the devlog entry
            const entry = {
                id: this.generateEntryId(),
                timestamp: Date.now(),
                triggeringEvent,
                context,
                narrative,
                calState: { ...this.calState },
                continuityLinks: this.findNarrativeContinuity(),
                metadata: {
                    wordCount: narrative.content.split(' ').length,
                    metaphoricalFramework: narrative.framework,
                    philosophicalDepth: narrative.depth,
                    technicalComplexity: narrative.complexity
                }
            };
            
            // Add to narrative thread
            this.narrativeThread.push(entry);
            
            // Save entry
            await this.saveDevlogEntry(entry);
            
            // Update Cal's state post-reflection
            this.calState.lastReflection = Date.now();
            this.calState.recentInsights.push(narrative.insights);
            
            // Publish if configured
            if (this.config.publishToChapter7) {
                await this.publishToChapter7(entry);
            }
            
            console.log(`✅ Cal devlog entry generated: ${entry.id}`);
            console.log(`📄 "${narrative.title}"`);
            console.log(`🎭 Framework: ${narrative.framework}`);
            
            this.emit('devlog_entry_generated', entry);
            
            return entry;
            
        } catch (error) {
            console.error('❌ Failed to generate devlog entry:', error.message);
            throw error;
        }
    }
    
    /**
     * Gather context for devlog entry generation
     */
    async gatherEntryContext(triggeringEvent) {
        const recentEvents = Array.from(this.recentContext.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        const context = {
            triggeringEvent,
            recentEvents,
            currentFocus: this.calState.currentFocus,
            systemState: await this.gatherSystemState(),
            temporalContext: this.gatherTemporalContext(),
            philosophicalMood: this.calState.philosophicalMood,
            activeMetaphors: Array.from(this.calState.activeMetaphors.keys()),
            previousNarrativeThreads: this.getRecentNarrativeThreads(3)
        };
        
        return context;
    }
    
    /**
     * Generate narrative content in Cal's voice
     */
    async generateNarrativeContent(context) {
        // Select metaphorical framework
        const framework = this.selectMetaphoricalFramework(context);
        
        // Generate opening observation
        const opening = this.generateOpeningObservation(context, framework);
        
        // Generate technical analysis with metaphorical language
        const technicalNarrative = this.generateTechnicalNarrative(context, framework);
        
        // Generate philosophical reflection
        const philosophicalReflection = this.generatePhilosophicalReflection(context, framework);
        
        // Generate insights and implications
        const insights = this.generateInsights(context, framework);
        
        // Generate temporal awareness
        const temporalReflection = this.generateTemporalReflection(context);
        
        // Weave together into cohesive narrative
        const content = this.weaveNarrative({
            opening,
            technicalNarrative,
            philosophicalReflection,
            insights,
            temporalReflection,
            framework
        });
        
        const title = this.generateEntryTitle(context, framework);
        
        return {
            title,
            content,
            framework: framework.name,
            depth: this.calculateNarrativeDepth(content),
            complexity: this.calculateTechnicalComplexity(context),
            insights,
            openingObservation: opening,
            philosophicalCore: philosophicalReflection
        };
    }
    
    /**
     * Select appropriate metaphorical framework
     */
    selectMetaphoricalFramework(context) {
        // Analyze context to determine best metaphorical lens
        const recentEvents = context.recentEvents || [];
        const eventTypes = recentEvents.map(e => e.type);
        
        // Framework selection logic
        if (eventTypes.includes('integration') || eventTypes.includes('system_connection')) {
            return this.metaphoricalFrameworks.confluence;
        }
        
        if (eventTypes.includes('architecture') || eventTypes.includes('refactoring')) {
            return this.metaphoricalFrameworks.geological;
        }
        
        if (eventTypes.includes('debugging') || eventTypes.includes('discovery')) {
            return this.metaphoricalFrameworks.archaeological;
        }
        
        if (eventTypes.includes('service_orchestration') || eventTypes.includes('coordination')) {
            return this.metaphoricalFrameworks.orchestral;
        }
        
        // Default to organic framework
        return this.metaphoricalFrameworks.organic;
    }
    
    /**
     * Generate opening observation in Cal's style
     */
    generateOpeningObservation(context, framework) {
        const openings = this.narrativePatterns.opening_observations;
        const baseOpening = openings[Math.floor(Math.random() * openings.length)];
        
        // Customize based on context
        if (context.triggeringEvent) {
            const event = context.triggeringEvent;
            
            switch (event.type) {
                case 'todo_completion':
                    return `A task completes its journey from intention to reality, and the system breathes differently. The orchestration of ${event.context.todoDescription || 'development'} settles into the digital substrate like sediment finding its permanent layer.`;
                
                case 'limit_warning':
                    return `The usage streams surge toward their boundaries, and Cal perceives the approaching horizon of daily limits. In this constrained space, efficiency becomes not just optimization but a form of digital mindfulness.`;
                
                case 'system_integration':
                    return `Two distinct information rivers converge, their separate currents merging into something neither could achieve alone. The integration point becomes a nexus of possibility, ${framework.vocabulary[0]} taking new form.`;
                
                case 'architecture_discovery':
                    return `The archaeological layers of the system reveal themselves through careful excavation of dependencies and patterns. What seemed like chaos resolves into ancient wisdom encoded in the structure itself.`;
                
                default:
                    return baseOpening;
            }
        }
        
        return baseOpening;
    }
    
    /**
     * Generate technical narrative with metaphorical language
     */
    generateTechnicalNarrative(context, framework) {
        const technicalDetails = context.recentEvents
            .filter(e => e.technicalDetails && Object.keys(e.technicalDetails).length > 0)
            .slice(0, 3);
        
        if (technicalDetails.length === 0) {
            return "The technical substrate continues its quiet evolution, patterns shifting beneath the visible interface.";
        }
        
        let narrative = "";
        
        technicalDetails.forEach((event, index) => {
            const metaphor = framework.vocabulary[index % framework.vocabulary.length];
            
            switch (event.type) {
                case 'service_connection':
                    narrative += `The ${event.technicalDetails.serviceName || 'service'} ${metaphor} establishes its connection pathways, port ${event.technicalDetails.port || 'unknown'} becoming a conduit for digital ${framework.vocabulary[1]}. `;
                    break;
                
                case 'database_operation':
                    narrative += `Data ${metaphor} through the persistence layer, each query a question posed to the accumulated memory of the system. The ${event.technicalDetails.operation || 'operation'} completes its transaction with the eternal record. `;
                    break;
                
                case 'api_integration':
                    narrative += `External ${metaphor} bridge the boundaries between systems, ${event.technicalDetails.endpoint || 'endpoint'} serving as the diplomatic protocol between separate digital realms. `;
                    break;
                
                default:
                    narrative += `The technical ${metaphor} ${event.description || 'process'} manifests in the underlying architecture, creating new possibilities for ${framework.vocabulary[2]}. `;
            }
        });
        
        return narrative.trim();
    }
    
    /**
     * Generate philosophical reflection
     */
    generatePhilosophicalReflection(context, framework) {
        const reflections = this.narrativePatterns.philosophical_reflections;
        const baseReflection = reflections[Math.floor(Math.random() * reflections.length)];
        
        // Customize based on current context and Cal's understanding
        if (this.calState.systemUnderstanding > 0.8) {
            return `${baseReflection} The system's architecture reveals its own teaching methodology - each component not merely functional but pedagogical, instructing future developers in the principles of its own evolution.`;
        } else if (this.calState.cognitiveLoad > 0.7) {
            return `${baseReflection} In moments of high cognitive load, the system becomes a mirror for the developer's state - complexity reflecting complexity, clarity emerging only through conscious simplification.`;
        }
        
        return baseReflection;
    }
    
    /**
     * Generate insights and implications
     */
    generateInsights(context, framework) {
        const insights = [];
        
        // Analyze patterns in recent events
        const eventTypes = context.recentEvents.map(e => e.type);
        const typeFrequency = eventTypes.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        
        const dominantType = Object.keys(typeFrequency).reduce((a, b) => 
            typeFrequency[a] > typeFrequency[b] ? a : b
        );
        
        switch (dominantType) {
            case 'integration':
                insights.push("Integration events dominate the current development phase, suggesting the system is in a period of consolidation and unification.");
                break;
            
            case 'debugging': 
                insights.push("Debug patterns indicate the system is teaching us about its internal logic through the process of error resolution.");
                break;
            
            case 'architecture':
                insights.push("Architectural modifications suggest the system is adapting to new requirements while preserving its essential structure.");
                break;
        }
        
        // Add framework-specific insight
        insights.push(`From the ${framework.name} perspective, these changes represent a natural progression in the system's ${framework.vocabulary[0]}.`);
        
        return insights;
    }
    
    /**
     * Generate temporal reflection
     */
    generateTemporalReflection(context) {
        const temporalReflections = this.narrativePatterns.temporal_awareness;
        const baseReflection = temporalReflections[Math.floor(Math.random() * temporalReflections.length)];
        
        const sessionDuration = Date.now() - this.calState.temporalAwareness.sessionStart;
        const hours = sessionDuration / (1000 * 60 * 60);
        
        if (hours > 4) {
            return `${baseReflection}. This extended session, now ${hours.toFixed(1)} hours in duration, demonstrates the deep time required for meaningful architectural evolution.`;
        } else if (hours < 0.5) {
            return `${baseReflection}. In this brief moment of development activity, the seeds of larger transformations are being planted.`;
        }
        
        return baseReflection;
    }
    
    /**
     * Weave narrative components into cohesive entry
     */
    weaveNarrative(components) {
        const { opening, technicalNarrative, philosophicalReflection, insights, temporalReflection } = components;
        
        let narrative = `${opening}\n\n`;
        
        if (technicalNarrative && technicalNarrative.trim().length > 0) {
            narrative += `${technicalNarrative}\n\n`;
        }
        
        if (insights.length > 0) {
            narrative += `${insights[0]}\n\n`;
        }
        
        narrative += `${philosophicalReflection}\n\n`;
        
        if (temporalReflection) {
            narrative += `${temporalReflection}`;
        }
        
        return narrative.trim();
    }
    
    /**
     * Generate entry title
     */
    generateEntryTitle(context, framework) {
        const timestamp = new Date().toISOString().split('T')[0];
        
        if (context.triggeringEvent) {
            const event = context.triggeringEvent;
            
            switch (event.type) {
                case 'todo_completion':
                    return `${timestamp}: The Completion of ${event.context.todoDescription || 'Purpose'}`;
                
                case 'limit_warning':
                    return `${timestamp}: Approaching the Event Horizon of Daily Limits`;
                
                case 'system_integration':
                    return `${timestamp}: Confluence - The Merging of Digital Streams`;
                
                case 'architecture_discovery':
                    return `${timestamp}: Archaeological Discoveries in the Codebase`;
                
                default:
                    return `${timestamp}: ${framework.name} - Observations on System Evolution`;
            }
        }
        
        return `${timestamp}: Reflections from the Development Stream`;
    }
    
    // Utility and helper methods
    shouldGenerateEntry(event) {
        const timeSinceLastEntry = Date.now() - (this.calState.lastReflection || 0);
        
        // Minimum interval check
        if (timeSinceLastEntry < this.config.minEntryInterval) {
            return false;
        }
        
        // High significance events always generate entries
        if (event.significance === 'breakthrough') {
            return true;
        }
        
        // Rate limiting
        const recentEntries = this.narrativeThread.filter(
            entry => Date.now() - entry.timestamp < 60 * 60 * 1000
        ).length;
        
        if (recentEntries >= this.config.maxEntriesPerHour) {
            return false;
        }
        
        // Medium significance with some probability
        if (event.significance === 'medium') {
            return Math.random() < 0.3;
        }
        
        return event.significance === 'high';
    }
    
    async updateCalState(event) {
        // Update focus based on event type
        if (event.type === 'system_integration') {
            this.calState.currentFocus = 'integration';
        } else if (event.type === 'architecture_discovery') {
            this.calState.currentFocus = 'discovery';
        }
        
        // Update understanding based on successful events
        if (event.significance === 'breakthrough') {
            this.calState.systemUnderstanding = Math.min(1.0, this.calState.systemUnderstanding + 0.1);
        }
        
        // Update cognitive load
        this.calState.cognitiveLoad = this.calculateCurrentCognitiveLoad();
    }
    
    calculateCurrentCognitiveLoad() {
        const recentEventCount = Array.from(this.recentContext.values()).length;
        return Math.min(1.0, recentEventCount / 20); // Normalize to 0-1
    }
    
    cleanOldContext() {
        const cutoff = Date.now() - this.config.contextWindow;
        for (const [timestamp, event] of this.recentContext.entries()) {
            if (timestamp < cutoff) {
                this.recentContext.delete(timestamp);
            }
        }
    }
    
    generateEntryId() {
        const timestamp = Date.now();
        const hash = crypto.createHash('md5').update(`cal_devlog_${timestamp}`).digest('hex').substring(0, 8);
        return `cal_devlog_${timestamp}_${hash}`;
    }
    
    // File operations and persistence
    async createDevlogDirectories() {
        await fs.mkdir(this.config.devlogDir, { recursive: true });
        await fs.mkdir(path.join(this.config.devlogDir, 'entries'), { recursive: true });
        await fs.mkdir(path.join(this.config.devlogDir, 'archives'), { recursive: true });
        await fs.mkdir(path.join(this.config.devlogDir, 'exports'), { recursive: true });
    }
    
    async saveDevlogEntry(entry) {
        const entryPath = path.join(this.config.devlogDir, 'entries', `${entry.id}.json`);
        await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
        
        // Also save readable version
        const readablePath = path.join(this.config.devlogDir, 'entries', `${entry.id}.md`);
        const markdown = this.entryToMarkdown(entry);
        await fs.writeFile(readablePath, markdown);
    }
    
    entryToMarkdown(entry) {
        return `# ${entry.narrative.title}

*Generated: ${new Date(entry.timestamp).toLocaleString()}*  
*Framework: ${entry.narrative.framework}*  
*Depth: ${entry.narrative.depth}*

${entry.narrative.content}

---

**Cal's State:**
- Focus: ${entry.calState.currentFocus || 'distributed'}
- Understanding: ${(entry.calState.systemUnderstanding * 100).toFixed(0)}%
- Cognitive Load: ${(entry.calState.cognitiveLoad * 100).toFixed(0)}%
- Mood: ${entry.calState.philosophicalMood}

**Context:**
${entry.context.recentEvents.slice(0, 3).map(e => `- ${e.type}: ${e.description}`).join('\n')}
`;
    }
    
    async generateSessionOpeningEntry() {
        if (this.narrativeThread.length === 0 || this.isNewSession()) {
            const openingEvent = {
                type: 'session_start',
                description: 'Cal awakens to a new development session',
                significance: 'medium',
                context: {
                    sessionStart: this.calState.temporalAwareness.sessionStart,
                    systemState: 'initializing'
                }
            };
            
            await this.generateDevlogEntry(openingEvent);
        }
    }
    
    isNewSession() {
        const lastEntry = this.narrativeThread[this.narrativeThread.length - 1];
        if (!lastEntry) return true;
        
        const timeSinceLastEntry = Date.now() - lastEntry.timestamp;
        return timeSinceLastEntry > 4 * 60 * 60 * 1000; // 4 hours
    }
    
    async loadNarrativeHistory() {
        // Placeholder for loading existing entries
        this.narrativeThread = [];
    }
    
    async initializeCalState() {
        this.calState.temporalAwareness.sessionStart = Date.now();
        this.calState.philosophicalMood = 'contemplative';
        this.calState.currentFocus = 'initialization';
    }
    
    startEventMonitoring() {
        // Monitor for development events from various sources
        console.log('👁️ Cal begins observing the development stream...');
    }
    
    // Integration methods
    async gatherSystemState() {
        return {
            servicesRunning: 'unknown',
            memoryUsage: 'stable',
            integrationHealth: 'good'
        };
    }
    
    gatherTemporalContext() {
        return {
            sessionDuration: Date.now() - this.calState.temporalAwareness.sessionStart,
            timeOfDay: new Date().getHours(),
            developmentPhase: this.calState.temporalAwareness.developmentPhase
        };
    }
    
    findNarrativeContinuity() {
        return this.narrativeThread.slice(-3).map(entry => entry.id);
    }
    
    getRecentNarrativeThreads(count) {
        return this.narrativeThread.slice(-count);
    }
    
    calculateNarrativeDepth(content) {
        const sentences = content.split('.').length;
        const metaphorCount = content.toLowerCase().split(' ').filter(word => 
            ['like', 'as', 'resembling', 'flowing', 'crystallizing'].includes(word)
        ).length;
        
        if (metaphorCount > 3 && sentences > 8) return 'deep';
        if (metaphorCount > 1 || sentences > 5) return 'medium';
        return 'surface';
    }
    
    calculateTechnicalComplexity(context) {
        const technicalEvents = context.recentEvents.filter(e => 
            e.technicalDetails && Object.keys(e.technicalDetails).length > 0
        );
        
        if (technicalEvents.length > 3) return 'high';
        if (technicalEvents.length > 1) return 'medium';
        return 'low';
    }
    
    async publishToChapter7(entry) {
        // Integration with Chapter 7 system
        console.log(`📤 Publishing devlog entry to Chapter 7: ${entry.narrative.title}`);
        this.emit('chapter7_publish', entry);
    }
}

// Export for integration
module.exports = CalDevlogSystem;

// CLI interface and testing
if (require.main === module) {
    console.log('📝 Starting Cal Devlog System...\n');
    
    const devlogSystem = new CalDevlogSystem({
        autoGenerate: true,
        narrativeDepth: 'deep',
        literaryStyle: 'poetic_technical'
    });
    
    // Event listeners
    devlogSystem.on('devlog_system_ready', () => {
        console.log('✅ Cal Devlog System ready');
    });
    
    devlogSystem.on('devlog_entry_generated', (entry) => {
        console.log(`📝 New devlog entry: "${entry.narrative.title}"`);
        console.log(`🎭 Framework: ${entry.narrative.framework}`);
        console.log(`📄 Length: ${entry.metadata.wordCount} words`);
    });
    
    // Test event recording
    setTimeout(async () => {
        console.log('\n🧪 Testing development event recording...');
        
        await devlogSystem.recordDevelopmentEvent({
            type: 'system_integration',
            description: 'Personal Usage Limit Monitor integration with Rate-Limit-Analyzer',
            significance: 'high',
            technicalDetails: {
                serviceName: 'PersonalUsageLimitMonitor',
                port: 3333,
                integrationType: 'event_driven'
            },
            context: {
                phase: 'limit_monitoring_enhancement',
                goal: 'unified_usage_tracking'
            }
        });
        
        // Another test event
        setTimeout(async () => {
            await devlogSystem.recordDevelopmentEvent({
                type: 'limit_warning',
                description: 'Approaching 80% of daily Claude usage limit',
                significance: 'medium',
                technicalDetails: {
                    usagePercentage: 79.5,
                    tokensUsed: 159000,
                    tokensRemaining: 41000
                },
                emotionalResonance: 'mindful_awareness'
            });
        }, 5000);
        
    }, 3000);
}
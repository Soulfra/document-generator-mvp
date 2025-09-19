#!/usr/bin/env node

/**
 * BARBELL STORY DECODER
 * 
 * Decodes visual pipes into story websites by extracting narrative from UI changes
 * Focuses on header/footer snapshot differences to generate stories
 * "thats the barbell we're decoding the pipe into all of our websites but as stories"
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BarbellStoryDecoder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            snapshotInterval: 100, // milliseconds between snapshots
            headerSelector: '.story-header, header, h1, .title',
            footerSelector: '.story-footer, footer, .bottom, .status',
            diffThreshold: 0.1, // minimum change threshold
            storyDepth: 5, // number of snapshots to build story from
            pipeDecoding: {
                visual: 'narrative',
                data: 'story',
                interaction: 'plot'
            },
            ...config
        };
        
        // Barbell structure - two heavy ends connected by a bar
        this.barbell = {
            leftWeight: { // Input side - visual changes
                snapshots: [],
                currentState: null,
                differences: []
            },
            bar: { // Transformation pipeline
                decoders: new Map(),
                transformers: [],
                narrativeEngine: null
            },
            rightWeight: { // Output side - story websites
                stories: [],
                websites: new Map(),
                activeNarratives: []
            }
        };
        
        // Story extraction patterns
        this.storyPatterns = {
            emergence: /INITIALIZING|STARTING|BEGINNING|AWAKENING/i,
            transformation: /TRANSFORMING|CHANGING|EVOLVING|MORPHING/i,
            climax: /ACTIVATED|MAXIMUM|PEAK|CRITICAL/i,
            resolution: /COMPLETE|FINISHED|RESOLVED|SETTLED/i,
            mystery: /UNKNOWN|HIDDEN|SECRET|MYSTERIOUS/i
        };
        
        this.isDecoding = false;
        this.snapshotHistory = [];
        
        console.log('🏋️ Barbell Story Decoder initialized');
    }
    
    /**
     * Start decoding visual pipes into stories
     */
    startDecoding(targetElement = document) {
        this.isDecoding = true;
        this.targetElement = targetElement;
        
        console.log('🔄 Starting barbell decoding process');
        
        // Take initial snapshot
        this.takeSnapshot();
        
        // Start continuous snapshot monitoring
        this.snapshotInterval = setInterval(() => {
            if (this.isDecoding) {
                this.takeSnapshot();
                this.processSnapshots();
            }
        }, this.config.snapshotInterval);
        
        this.emit('decoding:started');
    }
    
    /**
     * Stop decoding process
     */
    stopDecoding() {
        this.isDecoding = false;
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
        }
        
        console.log('⏹️ Barbell decoding stopped');
        this.emit('decoding:stopped');
    }
    
    /**
     * Take snapshot of current state focusing on header/footer
     */
    takeSnapshot() {
        const snapshot = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            header: this.extractHeaderContent(),
            footer: this.extractFooterContent(),
            fullDOM: this.captureMinimalDOM(),
            metadata: {
                scrollPosition: window.scrollY || 0,
                viewportSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                activeElement: document.activeElement?.tagName || 'NONE'
            }
        };
        
        // Add to left weight (input side)
        this.barbell.leftWeight.snapshots.push(snapshot);
        
        // Keep only recent snapshots
        if (this.barbell.leftWeight.snapshots.length > 100) {
            this.barbell.leftWeight.snapshots.shift();
        }
        
        // Calculate differences if we have previous snapshot
        if (this.barbell.leftWeight.currentState) {
            const diff = this.calculateDifference(
                this.barbell.leftWeight.currentState,
                snapshot
            );
            
            if (diff.significance > this.config.diffThreshold) {
                this.barbell.leftWeight.differences.push(diff);
                this.emit('difference:detected', diff);
            }
        }
        
        this.barbell.leftWeight.currentState = snapshot;
    }
    
    /**
     * Extract header content from page
     */
    extractHeaderContent() {
        const headers = this.targetElement.querySelectorAll(this.config.headerSelector);
        const content = [];
        
        headers.forEach(header => {
            content.push({
                text: header.textContent.trim(),
                html: header.innerHTML,
                classes: Array.from(header.classList),
                attributes: this.extractAttributes(header),
                computedStyles: this.extractKeyStyles(header)
            });
        });
        
        return content;
    }
    
    /**
     * Extract footer content from page
     */
    extractFooterContent() {
        const footers = this.targetElement.querySelectorAll(this.config.footerSelector);
        const content = [];
        
        footers.forEach(footer => {
            content.push({
                text: footer.textContent.trim(),
                html: footer.innerHTML,
                classes: Array.from(footer.classList),
                attributes: this.extractAttributes(footer),
                computedStyles: this.extractKeyStyles(footer)
            });
        });
        
        return content;
    }
    
    /**
     * Capture minimal DOM structure
     */
    captureMinimalDOM() {
        // We only care about structure, not full content
        return {
            bodyClasses: Array.from(document.body.classList),
            mainStructure: this.extractStructure(this.targetElement),
            interactiveElements: this.countInteractiveElements()
        };
    }
    
    /**
     * Extract key attributes from element
     */
    extractAttributes(element) {
        const attrs = {};
        for (const attr of element.attributes) {
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }
    
    /**
     * Extract key computed styles
     */
    extractKeyStyles(element) {
        const styles = window.getComputedStyle(element);
        return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            display: styles.display,
            opacity: styles.opacity,
            transform: styles.transform
        };
    }
    
    /**
     * Extract DOM structure recursively
     */
    extractStructure(element, maxDepth = 3, currentDepth = 0) {
        if (currentDepth >= maxDepth) return { tag: '...' };
        
        const structure = {
            tag: element.tagName?.toLowerCase() || 'text',
            classes: element.classList ? Array.from(element.classList) : [],
            childCount: element.children?.length || 0
        };
        
        if (element.children && element.children.length > 0 && currentDepth < maxDepth - 1) {
            structure.children = Array.from(element.children)
                .slice(0, 5) // Limit to first 5 children
                .map(child => this.extractStructure(child, maxDepth, currentDepth + 1));
        }
        
        return structure;
    }
    
    /**
     * Count interactive elements
     */
    countInteractiveElements() {
        return {
            buttons: this.targetElement.querySelectorAll('button').length,
            inputs: this.targetElement.querySelectorAll('input').length,
            links: this.targetElement.querySelectorAll('a').length,
            forms: this.targetElement.querySelectorAll('form').length
        };
    }
    
    /**
     * Calculate difference between two snapshots
     */
    calculateDifference(oldSnapshot, newSnapshot) {
        const diff = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            duration: newSnapshot.timestamp - oldSnapshot.timestamp,
            changes: {
                header: this.compareContent(oldSnapshot.header, newSnapshot.header),
                footer: this.compareContent(oldSnapshot.footer, newSnapshot.footer),
                structure: this.compareStructure(oldSnapshot.fullDOM, newSnapshot.fullDOM)
            },
            significance: 0,
            storyElements: []
        };
        
        // Calculate significance
        diff.significance = this.calculateSignificance(diff.changes);
        
        // Extract story elements from changes
        diff.storyElements = this.extractStoryElements(diff.changes);
        
        return diff;
    }
    
    /**
     * Compare content arrays
     */
    compareContent(oldContent, newContent) {
        const changes = [];
        
        // Check for text changes
        const oldTexts = oldContent.map(c => c.text).join(' ');
        const newTexts = newContent.map(c => c.text).join(' ');
        
        if (oldTexts !== newTexts) {
            changes.push({
                type: 'text',
                old: oldTexts,
                new: newTexts,
                narrative: this.generateNarrative(oldTexts, newTexts)
            });
        }
        
        // Check for style changes
        oldContent.forEach((oldItem, index) => {
            const newItem = newContent[index];
            if (newItem) {
                const styleChanges = this.compareStyles(
                    oldItem.computedStyles,
                    newItem.computedStyles
                );
                if (styleChanges.length > 0) {
                    changes.push({
                        type: 'style',
                        element: index,
                        changes: styleChanges
                    });
                }
            }
        });
        
        return changes;
    }
    
    /**
     * Compare DOM structures
     */
    compareStructure(oldDOM, newDOM) {
        const changes = [];
        
        if (oldDOM.bodyClasses.join(' ') !== newDOM.bodyClasses.join(' ')) {
            changes.push({
                type: 'bodyClasses',
                old: oldDOM.bodyClasses,
                new: newDOM.bodyClasses
            });
        }
        
        // Compare interactive element counts
        const oldInteractive = oldDOM.interactiveElements;
        const newInteractive = newDOM.interactiveElements;
        
        Object.keys(oldInteractive).forEach(key => {
            if (oldInteractive[key] !== newInteractive[key]) {
                changes.push({
                    type: 'interactiveCount',
                    element: key,
                    old: oldInteractive[key],
                    new: newInteractive[key]
                });
            }
        });
        
        return changes;
    }
    
    /**
     * Compare style objects
     */
    compareStyles(oldStyles, newStyles) {
        const changes = [];
        
        Object.keys(oldStyles).forEach(property => {
            if (oldStyles[property] !== newStyles[property]) {
                changes.push({
                    property,
                    old: oldStyles[property],
                    new: newStyles[property]
                });
            }
        });
        
        return changes;
    }
    
    /**
     * Calculate significance of changes
     */
    calculateSignificance(changes) {
        let significance = 0;
        
        // Header changes are most significant
        significance += changes.header.length * 0.4;
        
        // Footer changes are also important
        significance += changes.footer.length * 0.3;
        
        // Structure changes add some significance
        significance += changes.structure.length * 0.1;
        
        // Cap at 1.0
        return Math.min(significance, 1.0);
    }
    
    /**
     * Extract story elements from changes
     */
    extractStoryElements(changes) {
        const elements = [];
        
        // Extract from header changes
        changes.header.forEach(change => {
            if (change.type === 'text') {
                elements.push({
                    type: 'header_transition',
                    from: change.old,
                    to: change.new,
                    narrative: change.narrative,
                    pattern: this.identifyStoryPattern(change.new)
                });
            }
        });
        
        // Extract from footer changes
        changes.footer.forEach(change => {
            if (change.type === 'text') {
                elements.push({
                    type: 'footer_transition',
                    from: change.old,
                    to: change.new,
                    narrative: this.generateFooterNarrative(change.old, change.new),
                    pattern: this.identifyStoryPattern(change.new)
                });
            }
        });
        
        return elements;
    }
    
    /**
     * Generate narrative from text changes
     */
    generateNarrative(oldText, newText) {
        // Identify the type of change
        for (const [pattern, regex] of Object.entries(this.storyPatterns)) {
            if (regex.test(newText)) {
                return this.createNarrativeForPattern(pattern, oldText, newText);
            }
        }
        
        // Default narrative
        return `The interface shifted from "${oldText}" to "${newText}", marking a transition in the experience.`;
    }
    
    /**
     * Generate footer-specific narrative
     */
    generateFooterNarrative(oldText, newText) {
        // Footer changes often indicate status or progress
        if (newText.includes('complete') || newText.includes('finished')) {
            return `The journey reached its conclusion as the status changed to "${newText}".`;
        }
        
        if (newText.includes('error') || newText.includes('failed')) {
            return `An obstacle emerged: "${newText}".`;
        }
        
        return `The foundation shifted, now reading "${newText}".`;
    }
    
    /**
     * Create narrative for specific pattern
     */
    createNarrativeForPattern(pattern, oldText, newText) {
        const narratives = {
            emergence: `A new beginning emerged as "${newText}" appeared, replacing the previous state.`,
            transformation: `A transformation occurred, morphing "${oldText}" into "${newText}".`,
            climax: `The experience reached a critical point: "${newText}".`,
            resolution: `Resolution arrived with the declaration: "${newText}".`,
            mystery: `Mystery deepened as the interface revealed: "${newText}".`
        };
        
        return narratives[pattern] || `The story evolved from "${oldText}" to "${newText}".`;
    }
    
    /**
     * Identify story pattern in text
     */
    identifyStoryPattern(text) {
        for (const [pattern, regex] of Object.entries(this.storyPatterns)) {
            if (regex.test(text)) {
                return pattern;
            }
        }
        return 'transition';
    }
    
    /**
     * Process accumulated snapshots into stories
     */
    processSnapshots() {
        const recentDiffs = this.barbell.leftWeight.differences.slice(-this.config.storyDepth);
        
        if (recentDiffs.length < 2) return; // Need at least 2 diffs for a story
        
        // Build story from differences
        const story = this.buildStoryFromDifferences(recentDiffs);
        
        if (story.content.length > 0) {
            // Transform through the barbell
            const transformedStory = this.transformThroughBarbell(story);
            
            // Add to right weight (output)
            this.barbell.rightWeight.stories.push(transformedStory);
            
            // Create story website
            const website = this.createStoryWebsite(transformedStory);
            this.barbell.rightWeight.websites.set(transformedStory.id, website);
            
            // Emit story creation event
            this.emit('story:created', transformedStory);
            
            // Send to Cal's consulting system
            this.sendToCalConsultant(transformedStory);
        }
    }
    
    /**
     * Build story from differences
     */
    buildStoryFromDifferences(differences) {
        const story = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            content: [],
            arc: this.identifyStoryArc(differences),
            themes: new Set(),
            gameIdeas: []
        };
        
        differences.forEach((diff, index) => {
            diff.storyElements.forEach(element => {
                story.content.push({
                    sequence: index,
                    text: element.narrative,
                    type: element.type,
                    pattern: element.pattern
                });
                
                // Extract themes
                if (element.pattern) {
                    story.themes.add(element.pattern);
                }
                
                // Generate game ideas
                const gameIdea = this.generateGameIdea(element);
                if (gameIdea) {
                    story.gameIdeas.push(gameIdea);
                }
            });
        });
        
        story.themes = Array.from(story.themes);
        
        return story;
    }
    
    /**
     * Identify story arc from differences
     */
    identifyStoryArc(differences) {
        const patterns = differences.flatMap(d => 
            d.storyElements.map(e => e.pattern)
        ).filter(p => p);
        
        // Classic story arc detection
        if (patterns.includes('emergence') && patterns.includes('resolution')) {
            return 'complete_journey';
        }
        
        if (patterns.includes('transformation') && patterns.includes('climax')) {
            return 'transformation_tale';
        }
        
        if (patterns.filter(p => p === 'mystery').length > 1) {
            return 'mystery_deepening';
        }
        
        return 'ongoing_narrative';
    }
    
    /**
     * Generate game idea from story element
     */
    generateGameIdea(element) {
        const ideaTemplates = {
            header_transition: [
                `Level progression: ${element.from} → ${element.to}`,
                `Boss phase transition triggered by UI change`,
                `Environmental storytelling through header updates`
            ],
            footer_transition: [
                `Status-based gameplay mechanics`,
                `Achievement system reflecting footer states`,
                `Dynamic difficulty based on status changes`
            ],
            emergence: [
                `New game+ mode unlocked through emergence pattern`,
                `Procedural content generation at story beginnings`
            ],
            transformation: [
                `Shape-shifting gameplay mechanics`,
                `Evolution-based progression system`
            ]
        };
        
        const templates = ideaTemplates[element.type] || ideaTemplates[element.pattern];
        if (templates) {
            return templates[Math.floor(Math.random() * templates.length)];
        }
        
        return null;
    }
    
    /**
     * Transform story through the barbell
     */
    transformThroughBarbell(story) {
        // Apply decoders
        let transformed = { ...story };
        
        // Visual to narrative decoding
        transformed.narrative = this.decodeVisualToNarrative(story);
        
        // Data to story decoding
        transformed.storyData = this.decodeDataToStory(story);
        
        // Interaction to plot decoding
        transformed.plot = this.decodeInteractionToPlot(story);
        
        // Enrich with metadata
        transformed.metadata = {
            decodedAt: Date.now(),
            barbellVersion: '1.0.0',
            pipelineSteps: ['visual', 'data', 'interaction'],
            outputFormat: 'story-website'
        };
        
        return transformed;
    }
    
    /**
     * Decode visual changes to narrative
     */
    decodeVisualToNarrative(story) {
        const narrative = {
            opening: story.content[0]?.text || 'The story begins...',
            body: story.content.slice(1, -1).map(c => c.text).join(' '),
            closing: story.content[story.content.length - 1]?.text || 'To be continued...',
            arc: story.arc
        };
        
        return narrative;
    }
    
    /**
     * Decode data patterns to story
     */
    decodeDataToStory(story) {
        return {
            characters: this.extractCharacters(story),
            setting: this.extractSetting(story),
            conflict: this.extractConflict(story),
            resolution: this.extractResolution(story)
        };
    }
    
    /**
     * Decode interactions to plot
     */
    decodeInteractionToPlot(story) {
        return {
            acts: this.divideIntoActs(story),
            turningPoints: this.identifyTurningPoints(story),
            climax: this.findClimax(story),
            denouement: this.findDenouement(story)
        };
    }
    
    /**
     * Extract characters from story
     */
    extractCharacters(story) {
        // For now, simple extraction
        return [
            { name: 'The User', role: 'protagonist' },
            { name: 'The Vortex', role: 'setting/antagonist' },
            { name: 'Cal', role: 'mentor' }
        ];
    }
    
    /**
     * Extract setting from story
     */
    extractSetting(story) {
        if (story.themes.includes('mystery')) {
            return 'A mysterious digital realm where reality bends';
        }
        
        if (story.themes.includes('transformation')) {
            return 'A space of constant change and evolution';
        }
        
        return 'The swirling vortex between digital and physical';
    }
    
    /**
     * Extract conflict from story
     */
    extractConflict(story) {
        return story.themes.includes('climax') ? 
            'The struggle to decode meaning from chaos' :
            'The journey to understand the vortex';
    }
    
    /**
     * Extract resolution from story
     */
    extractResolution(story) {
        return story.themes.includes('resolution') ?
            'Understanding achieved through transformation' :
            'The journey continues...';
    }
    
    /**
     * Divide story into acts
     */
    divideIntoActs(story) {
        const contentLength = story.content.length;
        const actSize = Math.ceil(contentLength / 3);
        
        return {
            act1: story.content.slice(0, actSize),
            act2: story.content.slice(actSize, actSize * 2),
            act3: story.content.slice(actSize * 2)
        };
    }
    
    /**
     * Identify turning points
     */
    identifyTurningPoints(story) {
        return story.content
            .filter(c => ['transformation', 'climax'].includes(c.pattern))
            .map(c => ({ sequence: c.sequence, description: c.text }));
    }
    
    /**
     * Find climax
     */
    findClimax(story) {
        const climaxContent = story.content.find(c => c.pattern === 'climax');
        return climaxContent || null;
    }
    
    /**
     * Find denouement
     */
    findDenouement(story) {
        const resolutionContent = story.content.find(c => c.pattern === 'resolution');
        return resolutionContent || null;
    }
    
    /**
     * Create story website from transformed story
     */
    createStoryWebsite(story) {
        const website = {
            id: story.id,
            url: `/stories/${story.id}`,
            title: this.generateStoryTitle(story),
            content: this.generateWebsiteContent(story),
            style: this.generateWebsiteStyle(story),
            interactive: true,
            createdAt: Date.now()
        };
        
        return website;
    }
    
    /**
     * Generate story title
     */
    generateStoryTitle(story) {
        const baseTitles = {
            complete_journey: 'A Complete Journey Through the Vortex',
            transformation_tale: 'The Transformation Chronicles',
            mystery_deepening: 'Mysteries of the Swirling Sphere',
            ongoing_narrative: 'An Ongoing Vortex Narrative'
        };
        
        return baseTitles[story.arc] || 'A Vortex Story';
    }
    
    /**
     * Generate website content
     */
    generateWebsiteContent(story) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${this.generateStoryTitle(story)}</title>
    <meta charset="UTF-8">
    <style>
        body {
            background: #000;
            color: #8a2be2;
            font-family: 'Georgia', serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            color: #0ff;
            text-shadow: 0 0 20px #0ff;
            margin-bottom: 40px;
        }
        
        .chapter {
            margin: 30px 0;
            padding: 20px;
            background: rgba(138, 43, 226, 0.1);
            border-left: 3px solid #8a2be2;
        }
        
        .narrative {
            line-height: 1.8;
            font-size: 18px;
        }
        
        .game-idea {
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid #0ff;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        
        .themes {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        
        .theme {
            background: #8a2be2;
            color: #000;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <h1>${this.generateStoryTitle(story)}</h1>
    
    <div class="themes">
        ${story.themes.map(theme => `<span class="theme">${theme}</span>`).join('')}
    </div>
    
    <div class="narrative">
        <div class="chapter">
            <h2>Opening</h2>
            <p>${story.narrative.opening}</p>
        </div>
        
        <div class="chapter">
            <h2>The Journey</h2>
            <p>${story.narrative.body}</p>
        </div>
        
        <div class="chapter">
            <h2>Closing</h2>
            <p>${story.narrative.closing}</p>
        </div>
    </div>
    
    ${story.gameIdeas.length > 0 ? `
        <div class="game-ideas">
            <h2>Game Concepts Inspired by This Story</h2>
            ${story.gameIdeas.map(idea => `
                <div class="game-idea">
                    💡 ${idea}
                </div>
            `).join('')}
        </div>
    ` : ''}
    
    <script>
        // Send story data to parent for Cal's consultation
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'barbell-story',
                story: ${JSON.stringify(story)}
            }, '*');
        }
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Generate website style based on story themes
     */
    generateWebsiteStyle(story) {
        const styles = {
            emergence: { primary: '#0f0', secondary: '#00ff00' },
            transformation: { primary: '#f0f', secondary: '#ff00ff' },
            climax: { primary: '#ff0', secondary: '#ffff00' },
            resolution: { primary: '#0ff', secondary: '#00ffff' },
            mystery: { primary: '#8a2be2', secondary: '#9370db' }
        };
        
        const dominantTheme = story.themes[0] || 'mystery';
        return styles[dominantTheme] || styles.mystery;
    }
    
    /**
     * Send story to Cal's consulting system
     */
    sendToCalConsultant(story) {
        // Prepare consultation package
        const consultationPackage = {
            type: 'barbell-decoded-story',
            story: {
                id: story.id,
                narrative: story.narrative,
                themes: story.themes,
                gameIdeas: story.gameIdeas,
                arc: story.arc,
                plot: story.plot
            },
            decodedFrom: 'visual-pipes',
            timestamp: Date.now(),
            consultationRequest: 'Please analyze this story for game potential'
        };
        
        // Emit for Cal's system to pick up
        this.emit('cal:consultation:requested', consultationPackage);
        
        // Also post message if in browser
        if (typeof window !== 'undefined' && window.postMessage) {
            window.postMessage({
                type: 'cal-consultation',
                data: consultationPackage
            }, '*');
        }
        
        console.log('📤 Story sent to Cal for consultation:', story.id);
    }
    
    /**
     * Get decoding statistics
     */
    getStatistics() {
        return {
            snapshotsTaken: this.barbell.leftWeight.snapshots.length,
            differencesDetected: this.barbell.leftWeight.differences.length,
            storiesCreated: this.barbell.rightWeight.stories.length,
            websitesGenerated: this.barbell.rightWeight.websites.size,
            activeNarratives: this.barbell.rightWeight.activeNarratives.length,
            decodingActive: this.isDecoding
        };
    }
    
    /**
     * Get recent stories
     */
    getRecentStories(count = 5) {
        return this.barbell.rightWeight.stories.slice(-count);
    }
    
    /**
     * Get story by ID
     */
    getStory(storyId) {
        return this.barbell.rightWeight.stories.find(s => s.id === storyId);
    }
    
    /**
     * Get website for story
     */
    getWebsite(storyId) {
        return this.barbell.rightWeight.websites.get(storyId);
    }
}

// Export for use in other systems
module.exports = BarbellStoryDecoder;

// Browser compatibility
if (typeof window !== 'undefined') {
    window.BarbellStoryDecoder = BarbellStoryDecoder;
}

// Run demo if called directly
if (require.main === module) {
    console.log('\n🏋️ BARBELL STORY DECODER DEMO');
    console.log('================================\n');
    
    const decoder = new BarbellStoryDecoder({
        snapshotInterval: 1000 // 1 second for demo
    });
    
    // Set up event listeners
    decoder.on('decoding:started', () => {
        console.log('✅ Decoding started');
    });
    
    decoder.on('difference:detected', (diff) => {
        console.log(`🔍 Difference detected: ${diff.significance.toFixed(2)} significance`);
        if (diff.storyElements.length > 0) {
            console.log(`   Story elements: ${diff.storyElements.map(e => e.pattern).join(', ')}`);
        }
    });
    
    decoder.on('story:created', (story) => {
        console.log(`\n📖 STORY CREATED: ${story.id}`);
        console.log(`   Arc: ${story.arc}`);
        console.log(`   Themes: ${story.themes.join(', ')}`);
        console.log(`   Content length: ${story.content.length} elements`);
        console.log(`   Game ideas: ${story.gameIdeas.length}`);
        
        console.log('\n   NARRATIVE:');
        console.log(`   Opening: ${story.narrative.opening}`);
        console.log(`   Arc type: ${story.narrative.arc}`);
    });
    
    decoder.on('cal:consultation:requested', (package) => {
        console.log(`\n🎮 CAL CONSULTATION REQUESTED`);
        console.log(`   Story: ${package.story.id}`);
        console.log(`   Request: ${package.consultationRequest}`);
    });
    
    // Simulate DOM changes for demo
    console.log('\n🎬 Simulating visual pipe changes...\n');
    
    // Mock DOM for Node.js demo
    global.document = {
        querySelectorAll: (selector) => {
            // Simulate changing headers/footers
            const mockTexts = [
                'INITIALIZING VORTEX...',
                'VORTEX ACTIVATED',
                'EXTRACTING STORIES...',
                'DECODING NARRATIVE STREAMS',
                'TRANSFORMING REALITY',
                'CAL CONSULTING MODE'
            ];
            
            const currentIndex = Math.floor(Date.now() / 2000) % mockTexts.length;
            
            if (selector.includes('header')) {
                return [{
                    textContent: mockTexts[currentIndex],
                    innerHTML: `<span>${mockTexts[currentIndex]}</span>`,
                    classList: ['story-header'],
                    attributes: [],
                    getAttribute: () => null
                }];
            }
            
            if (selector.includes('footer')) {
                return [{
                    textContent: 'Stories emerging from the void',
                    innerHTML: '<span>Stories emerging from the void</span>',
                    classList: ['story-footer'],
                    attributes: [],
                    getAttribute: () => null
                }];
            }
            
            return [];
        },
        body: {
            classList: []
        },
        activeElement: { tagName: 'DIV' }
    };
    
    global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        scrollY: 0,
        getComputedStyle: () => ({
            color: '#8a2be2',
            backgroundColor: '#000',
            fontSize: '16px',
            display: 'block',
            opacity: '1',
            transform: 'none'
        })
    };
    
    // Would start actual decoding in browser
    console.log('💡 In browser environment, would call:');
    console.log('   decoder.startDecoding(document);');
    console.log('\n📝 The decoder would then:');
    console.log('   1. Take snapshots of header/footer changes');
    console.log('   2. Calculate differences between snapshots');
    console.log('   3. Extract story elements from changes');
    console.log('   4. Build narratives from accumulated differences');
    console.log('   5. Transform through the barbell pipeline');
    console.log('   6. Generate story websites');
    console.log('   7. Send to Cal for game consultation');
    
    // Show statistics
    console.log('\n📊 DECODER STATISTICS:');
    console.log(JSON.stringify(decoder.getStatistics(), null, 2));
    
    console.log('\n✅ Barbell Story Decoder ready!');
    console.log('🏋️ Decoding visual pipes into story websites');
}
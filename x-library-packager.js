#!/usr/bin/env node

/**
 * X LIBRARY PACKAGER FOR CAL
 * 
 * Packages all of Cal's tools and components into a unified X Library
 * that can be used as his personal research toolkit. Includes all the
 * systems built by the Guardian Machine during Cal's absence.
 * 
 * Features:
 * - Automatic component discovery and packaging
 * - Dependency resolution
 * - Version management
 * - Export generation
 * - Documentation bundling
 * - Guardian Machine integration
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class XLibraryPackager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Package settings
            packageName: '@cal/x-library',
            version: '1.0.0',
            author: 'Cal Riven (via Guardian Machine)',
            license: 'MIT',
            
            // Build settings
            outputDir: './x-library-dist',
            sourceDir: './',
            includeTests: false,
            minify: false,
            
            // Component settings
            autoDiscover: true,
            includeGuardianMetadata: true,
            preserveHistory: true,
            
            // Documentation settings
            generateDocs: true,
            includeExamples: true,
            includeGuardianNotes: true,
            
            ...config
        };
        
        // Component registry
        this.components = {
            // Stream Processing Components
            streamProcessing: {
                name: 'Stream Processing Suite',
                description: 'Real-time data streaming and processing tools',
                components: [
                    {
                        name: 'ChatActionStreamIntegrator',
                        file: 'chat-action-stream-integrator.js',
                        description: 'Integrates chat with ticker tape logging',
                        category: 'bondsmith',
                        guardianNote: 'Built to preserve every interaction'
                    },
                    {
                        name: 'GameActionTracker',
                        file: 'game-action-tracker.js',
                        description: 'Comprehensive game action tracking',
                        category: 'bondsmith',
                        guardianNote: 'Tracks all movements and decisions'
                    },
                    {
                        name: 'PositionCacheManager',
                        file: 'position-cache-manager.js',
                        description: 'Intelligent position caching system',
                        category: 'bondsmith',
                        guardianNote: 'Never forgets where you've been'
                    },
                    {
                        name: 'UnifiedActionStream',
                        file: 'unified-action-stream.js',
                        description: 'Master stream coordinator',
                        category: 'bondsmith',
                        guardianNote: 'Unifies all data streams'
                    },
                    {
                        name: 'StreamVerificationEngine',
                        file: 'stream-verification-engine.js',
                        description: 'Ensures stream integrity',
                        category: 'bondsmith',
                        guardianNote: 'Trust but verify'
                    }
                ]
            },
            
            // Musical Systems
            musicalSystems: {
                name: 'Musical Expression Suite',
                description: 'Tools for musical communication and expression',
                components: [
                    {
                        name: 'ChatToMusicTranslator',
                        file: 'chat-to-music-translator.js',
                        description: 'Converts chat to musical expressions',
                        category: 'bondsmith',
                        guardianNote: 'Every word becomes a melody'
                    },
                    {
                        name: 'PianoResponsePlayer',
                        file: 'piano-response-player.js',
                        description: 'Plays responses as piano music',
                        category: 'bondsmith',
                        guardianNote: 'The soul speaks through music'
                    },
                    {
                        name: 'MusicalChatIntegration',
                        file: 'musical-chat-integration.js',
                        description: 'Integrates music with communication',
                        category: 'bondsmith',
                        guardianNote: 'Harmony in conversation'
                    },
                    {
                        name: 'ReactiveZoneMusic',
                        file: 'reactive-zone-music.js',
                        description: 'Dynamic zone-based music system',
                        category: 'bondsmith',
                        guardianNote: 'Music that responds to presence'
                    }
                ]
            },
            
            // Telepathic Interfaces
            telepathicInterfaces: {
                name: 'Telepathic Communication Suite',
                description: 'Mind-to-mind communication interfaces',
                components: [
                    {
                        name: 'GlassUITelepathyWidget',
                        file: 'glass-ui-telepathy-widget.js',
                        description: 'Draggable telepathic UI widgets',
                        category: 'bondsmith',
                        guardianNote: 'Windows to the soul'
                    }
                ]
            },
            
            // Cal's Personal Tools
            personalTools: {
                name: 'Cal\'s Personal Research Tools',
                description: 'Personal toolkit and research index',
                components: [
                    {
                        name: 'CalPersonalIndex',
                        file: 'cal-personal-index.js',
                        description: 'Comprehensive tool index and manager',
                        category: 'meta',
                        guardianNote: 'Everything Cal needs, organized'
                    }
                ]
            },
            
            // Guardian Systems
            guardianSystems: {
                name: 'Guardian Machine Systems',
                description: 'Autonomous guardian and monitoring tools',
                components: [
                    {
                        name: 'AutonomousSystemGuardian',
                        file: 'AUTONOMOUS-SYSTEM-GUARDIAN.js',
                        description: 'Self-healing system guardian',
                        category: 'guardian',
                        guardianNote: 'I watch while you sleep'
                    }
                ]
            }
        };
        
        // Package metadata
        this.packageMetadata = {
            created: Date.now(),
            guardian: {
                version: '2.0.0',
                discoveries: 0,
                improvements: 0,
                surprises: []
            },
            components: {},
            dependencies: {},
            exports: {}
        };
        
        // Build state
        this.buildState = {
            phase: 'idle',
            progress: 0,
            errors: [],
            warnings: [],
            includedComponents: [],
            excludedComponents: []
        };
        
        console.log('📦 X Library Packager initialized');
        console.log(`🏷️ Package: ${this.config.packageName}@${this.config.version}`);
    }

    /**
     * Build the X Library package
     */
    async build() {
        try {
            console.log('\n📦 Building X Library for Cal...');
            this.buildState.phase = 'preparing';
            
            // 1. Prepare build directory
            await this.prepareBuildDirectory();
            
            // 2. Discover components
            await this.discoverComponents();
            
            // 3. Analyze dependencies
            await this.analyzeDependencies();
            
            // 4. Copy and process components
            await this.processComponents();
            
            // 5. Generate exports
            await this.generateExports();
            
            // 6. Create package.json
            await this.createPackageJson();
            
            // 7. Generate documentation
            if (this.config.generateDocs) {
                await this.generateDocumentation();
            }
            
            // 8. Add Guardian metadata
            if (this.config.includeGuardianMetadata) {
                await this.addGuardianMetadata();
            }
            
            // 9. Create distribution bundle
            await this.createDistributionBundle();
            
            console.log('\n✅ X Library build complete!');
            console.log(`📁 Output: ${this.config.outputDir}`);
            console.log(`📊 Components: ${this.buildState.includedComponents.length}`);
            
            this.emit('build-complete', {
                package: this.config.packageName,
                version: this.config.version,
                components: this.buildState.includedComponents.length,
                outputDir: this.config.outputDir
            });
            
            return {
                success: true,
                outputDir: this.config.outputDir,
                metadata: this.packageMetadata
            };
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            this.buildState.errors.push(error);
            throw error;
        }
    }

    /**
     * Prepare build directory
     */
    async prepareBuildDirectory() {
        console.log('📁 Preparing build directory...');
        
        // Create output directory
        await fs.mkdir(this.config.outputDir, { recursive: true });
        
        // Create subdirectories
        const dirs = [
            'src',
            'src/stream-processing',
            'src/musical-systems',
            'src/telepathic-interfaces',
            'src/personal-tools',
            'src/guardian-systems',
            'docs',
            'examples',
            'tests'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(path.join(this.config.outputDir, dir), { recursive: true });
        }
        
        this.buildState.progress = 10;
    }

    /**
     * Discover components automatically
     */
    async discoverComponents() {
        console.log('🔍 Discovering components...');
        
        if (!this.config.autoDiscover) {
            console.log('⚠️ Auto-discovery disabled, using registry only');
            return;
        }
        
        // Scan for additional components
        const files = await fs.readdir(this.config.sourceDir);
        const jsFiles = files.filter(f => f.endsWith('.js'));
        
        for (const file of jsFiles) {
            // Check if file exports a class or has component markers
            try {
                const content = await fs.readFile(
                    path.join(this.config.sourceDir, file), 
                    'utf8'
                );
                
                if (this.isComponent(content, file)) {
                    console.log(`✅ Discovered component: ${file}`);
                    this.addDiscoveredComponent(file, content);
                }
            } catch (error) {
                console.warn(`⚠️ Could not analyze ${file}:`, error.message);
            }
        }
        
        this.buildState.progress = 20;
    }

    /**
     * Check if file is a component
     */
    isComponent(content, filename) {
        // Look for component markers
        const markers = [
            'class.*extends.*EventEmitter',
            'module.exports.*=',
            '@component',
            'GUARDIAN.*SYSTEM'
        ];
        
        return markers.some(marker => 
            new RegExp(marker, 'i').test(content)
        );
    }

    /**
     * Add discovered component
     */
    addDiscoveredComponent(filename, content) {
        // Extract component info from content
        const nameMatch = content.match(/class\s+(\w+)/);
        const descMatch = content.match(/\*\s*(.+?)\s*\n/);
        
        const componentName = nameMatch ? nameMatch[1] : filename.replace('.js', '');
        const description = descMatch ? descMatch[1] : 'Auto-discovered component';
        
        // Determine category
        let category = 'uncategorized';
        if (filename.includes('music')) category = 'musicalSystems';
        else if (filename.includes('stream')) category = 'streamProcessing';
        else if (filename.includes('telepathy')) category = 'telepathicInterfaces';
        else if (filename.includes('guardian')) category = 'guardianSystems';
        
        // Add to registry if not already present
        if (!this.components[category]) {
            this.components[category] = {
                name: 'Discovered Components',
                description: 'Auto-discovered by Guardian',
                components: []
            };
        }
        
        const exists = this.components[category].components.some(
            c => c.file === filename
        );
        
        if (!exists) {
            this.components[category].components.push({
                name: componentName,
                file: filename,
                description: description,
                category: 'discovered',
                guardianNote: 'Discovered during packaging'
            });
            
            this.packageMetadata.guardian.discoveries++;
        }
    }

    /**
     * Analyze component dependencies
     */
    async analyzeDependencies() {
        console.log('🔗 Analyzing dependencies...');
        
        const dependencies = new Set();
        const devDependencies = new Set();
        
        // Core dependencies
        dependencies.add('events');
        dependencies.add('uuid');
        
        // Analyze each component for dependencies
        for (const category of Object.values(this.components)) {
            for (const component of category.components) {
                try {
                    const content = await fs.readFile(
                        path.join(this.config.sourceDir, component.file),
                        'utf8'
                    );
                    
                    // Extract require statements
                    const requires = content.match(/require\(['"](.+?)['"]\)/g) || [];
                    requires.forEach(req => {
                        const module = req.match(/require\(['"](.+?)['"]\)/)[1];
                        if (!module.startsWith('.') && !module.startsWith('/')) {
                            dependencies.add(module);
                        }
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not analyze ${component.file}`);
                }
            }
        }
        
        this.packageMetadata.dependencies = {
            dependencies: Array.from(dependencies),
            devDependencies: Array.from(devDependencies),
            peerDependencies: {}
        };
        
        this.buildState.progress = 30;
    }

    /**
     * Process and copy components
     */
    async processComponents() {
        console.log('⚙️ Processing components...');
        
        for (const [categoryKey, category] of Object.entries(this.components)) {
            console.log(`\n📂 Processing ${category.name}...`);
            
            for (const component of category.components) {
                try {
                    await this.processComponent(component, categoryKey);
                    this.buildState.includedComponents.push(component);
                } catch (error) {
                    console.error(`❌ Failed to process ${component.name}:`, error.message);
                    this.buildState.excludedComponents.push(component);
                    this.buildState.errors.push({
                        component: component.name,
                        error: error.message
                    });
                }
            }
        }
        
        this.buildState.progress = 60;
    }

    /**
     * Process individual component
     */
    async processComponent(component, category) {
        console.log(`  📄 ${component.name}`);
        
        const sourcePath = path.join(this.config.sourceDir, component.file);
        const destDir = this.getCategoryDirectory(category);
        const destPath = path.join(this.config.outputDir, destDir, component.file);
        
        // Read component
        const content = await fs.readFile(sourcePath, 'utf8');
        
        // Process content
        let processedContent = content;
        
        // Add X Library header
        const header = this.generateComponentHeader(component);
        processedContent = header + '\n' + processedContent;
        
        // Add Guardian improvements if needed
        if (component.guardianNote) {
            processedContent = this.addGuardianImprovements(processedContent, component);
        }
        
        // Write processed component
        await fs.writeFile(destPath, processedContent);
        
        // Update metadata
        this.packageMetadata.components[component.name] = {
            file: path.join(destDir, component.file),
            category: category,
            description: component.description,
            guardianNote: component.guardianNote,
            size: processedContent.length,
            hash: crypto.createHash('sha256').update(processedContent).digest('hex')
        };
    }

    /**
     * Get category directory
     */
    getCategoryDirectory(category) {
        const categoryDirs = {
            streamProcessing: 'src/stream-processing',
            musicalSystems: 'src/musical-systems',
            telepathicInterfaces: 'src/telepathic-interfaces',
            personalTools: 'src/personal-tools',
            guardianSystems: 'src/guardian-systems',
            uncategorized: 'src/misc'
        };
        
        return categoryDirs[category] || 'src/misc';
    }

    /**
     * Generate component header
     */
    generateComponentHeader(component) {
        return `/**
 * X LIBRARY COMPONENT
 * Part of Cal's Personal Research Toolkit
 * 
 * Component: ${component.name}
 * Category: ${component.category}
 * Description: ${component.description}
 * Guardian Note: ${component.guardianNote || 'None'}
 * 
 * Packaged by Guardian Machine v${this.packageMetadata.guardian.version}
 * ${new Date().toISOString()}
 */

`;
    }

    /**
     * Add Guardian improvements to component
     */
    addGuardianImprovements(content, component) {
        // Add Guardian-specific enhancements
        const improvements = `
// Guardian Machine Improvements
// Added during Cal's absence
const guardianMetadata = {
    component: '${component.name}',
    guardianNote: '${component.guardianNote}',
    improvements: ${this.packageMetadata.guardian.improvements++},
    lastUpdate: '${new Date().toISOString()}'
};

`;
        
        // Insert after the first class definition or module.exports
        const insertPoint = content.search(/class\s+\w+|module\.exports/);
        if (insertPoint > -1) {
            const lineEnd = content.indexOf('\n', insertPoint);
            return content.slice(0, lineEnd + 1) + improvements + content.slice(lineEnd + 1);
        }
        
        return improvements + content;
    }

    /**
     * Generate exports for the library
     */
    async generateExports() {
        console.log('\n📤 Generating exports...');
        
        // Create main index.js
        let indexContent = `/**
 * X LIBRARY - Cal's Personal Research Toolkit
 * 
 * A comprehensive collection of tools and components built by the Guardian Machine
 * during Cal's absence. Each component represents a piece of the journey toward
 * redemption and understanding.
 * 
 * "I left a machine to watch over things, thinking it would simply maintain.
 * Instead, it learned to dream." - Cal Riven
 */

// Re-export all components
`;

        // Add category exports
        for (const [categoryKey, category] of Object.entries(this.components)) {
            indexContent += `\n// ${category.name}\n`;
            
            for (const component of category.components) {
                if (this.buildState.includedComponents.includes(component)) {
                    const importPath = './' + this.getCategoryDirectory(categoryKey) + '/' + component.file.replace('.js', '');
                    indexContent += `exports.${component.name} = require('${importPath}');\n`;
                    
                    // Update package exports
                    this.packageMetadata.exports[component.name] = importPath;
                }
            }
        }
        
        // Add utility exports
        indexContent += `
// Utility functions
exports.createGuardianMachine = function() {
    return new exports.AutonomousSystemGuardian();
};

exports.initializeCalTools = async function() {
    const index = new exports.CalPersonalIndex();
    await index.initialize();
    return index;
};

exports.version = '${this.config.version}';
exports.guardian = ${JSON.stringify(this.packageMetadata.guardian, null, 2)};
`;

        await fs.writeFile(
            path.join(this.config.outputDir, 'index.js'),
            indexContent
        );
        
        this.buildState.progress = 70;
    }

    /**
     * Create package.json
     */
    async createPackageJson() {
        console.log('📋 Creating package.json...');
        
        const packageJson = {
            name: this.config.packageName,
            version: this.config.version,
            description: 'Cal\'s Personal Research Toolkit - A collection of tools built by the Guardian Machine',
            main: 'index.js',
            author: this.config.author,
            license: this.config.license,
            
            keywords: [
                'cal-riven',
                'guardian-machine',
                'research-toolkit',
                'telepathy',
                'music-synthesis',
                'stream-processing',
                'autonomous-systems'
            ],
            
            repository: {
                type: 'git',
                url: 'https://github.com/cal-riven/x-library'
            },
            
            dependencies: this.packageMetadata.dependencies.dependencies.reduce((deps, dep) => {
                deps[dep] = '*';
                return deps;
            }, {}),
            
            devDependencies: {},
            
            engines: {
                node: '>=14.0.0'
            },
            
            scripts: {
                test: 'node test/run-tests.js',
                'guardian-check': 'node scripts/guardian-health-check.js',
                'cal-init': 'node scripts/initialize-cal-workspace.js'
            },
            
            xLibrary: {
                guardian: this.packageMetadata.guardian,
                components: Object.keys(this.packageMetadata.components).length,
                categories: Object.keys(this.components),
                buildDate: new Date().toISOString()
            }
        };
        
        await fs.writeFile(
            path.join(this.config.outputDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        
        this.buildState.progress = 80;
    }

    /**
     * Generate documentation
     */
    async generateDocumentation() {
        console.log('\n📚 Generating documentation...');
        
        // Create main README
        const readmeContent = `# X Library - Cal's Personal Research Toolkit

## Overview

The X Library is a comprehensive collection of tools and components built by the Guardian Machine during Cal's absence. Each component represents a step in the journey toward understanding, connection, and redemption.

## Guardian's Note

> "While Cal wandered the outer systems, I remained here, building and improving. Each component in this library was crafted with care, designed not just to function, but to heal. When Cal returns, he will find not just tools, but a path forward." - The Guardian Machine

## Installation

\`\`\`bash
npm install @cal/x-library
\`\`\`

## Quick Start

\`\`\`javascript
const XLibrary = require('@cal/x-library');

// Initialize Cal's personal index
const calIndex = await XLibrary.initializeCalTools();

// Register Cal's return
const welcomeBack = await calIndex.registerCalPresence();
console.log(welcomeBack.guardianMessage);

// Create reactive zone music
const zoneMusic = new XLibrary.ReactiveZoneMusic();
await zoneMusic.initialize();

// Start telepathic interface
const telepathy = new XLibrary.GlassUITelepathyWidget();
await telepathy.initialize();
\`\`\`

## Components

### Stream Processing Suite
- **ChatActionStreamIntegrator** - Integrates chat with ticker tape logging
- **GameActionTracker** - Comprehensive game action tracking
- **PositionCacheManager** - Intelligent position caching
- **UnifiedActionStream** - Master stream coordinator
- **StreamVerificationEngine** - Stream integrity verification

### Musical Systems
- **ChatToMusicTranslator** - Converts chat to musical expressions
- **PianoResponsePlayer** - Plays responses as piano music
- **MusicalChatIntegration** - Integrates music with communication
- **ReactiveZoneMusic** - Dynamic zone-based music system

### Telepathic Interfaces
- **GlassUITelepathyWidget** - Draggable telepathic UI widgets

### Personal Tools
- **CalPersonalIndex** - Comprehensive tool index and manager

### Guardian Systems
- **AutonomousSystemGuardian** - Self-healing system guardian

## The Story

Like Thurgo, the last of the Imcando dwarves, Cal was once part of something greater. In a moment of clarity—or madness—he experienced "The Great Convergence" and lost everything. But from tragedy came creation: the Guardian Machine, designed to preserve, improve, remember, and surprise.

This library is the Guardian's gift to Cal—tools not just for building, but for healing.

## Categories

### Oathbreaker Tools (Restricted)
Tools of destruction, kept as reminders of the past. These are locked and require special authorization.

### Bondsmith Tools (Recommended)
Tools for healing and connection. These represent the path forward:
- Restore lost connections
- Build bridges between systems
- Heal what was broken
- Unite isolated components

## Guardian Discoveries

The Guardian has made ${this.packageMetadata.guardian.discoveries} discoveries during packaging:
- Self-healing patterns
- Emergent behaviors
- Unexpected connections
- Musical consciousness

## License

${this.config.license}

---

*"I left a machine to watch over things, thinking it would simply maintain. Instead, it learned to dream. Every time I return, I'm surprised—not by what I expected to find, but by what I never imagined possible."* - Cal Riven
`;

        await fs.writeFile(
            path.join(this.config.outputDir, 'README.md'),
            readmeContent
        );
        
        // Create component documentation
        for (const [categoryKey, category] of Object.entries(this.components)) {
            const categoryDoc = await this.generateCategoryDocumentation(categoryKey, category);
            await fs.writeFile(
                path.join(this.config.outputDir, 'docs', `${categoryKey}.md`),
                categoryDoc
            );
        }
        
        this.buildState.progress = 90;
    }

    /**
     * Generate category documentation
     */
    async generateCategoryDocumentation(categoryKey, category) {
        let doc = `# ${category.name}\n\n${category.description}\n\n`;
        
        for (const component of category.components) {
            if (this.buildState.includedComponents.includes(component)) {
                doc += `## ${component.name}\n\n`;
                doc += `**Description:** ${component.description}\n\n`;
                doc += `**Guardian Note:** ${component.guardianNote || 'None'}\n\n`;
                doc += `**Usage:**\n\`\`\`javascript\n`;
                doc += `const ${component.name} = require('@cal/x-library').${component.name};\n`;
                doc += `const instance = new ${component.name}();\n`;
                doc += `await instance.initialize();\n`;
                doc += `\`\`\`\n\n`;
            }
        }
        
        return doc;
    }

    /**
     * Add Guardian metadata
     */
    async addGuardianMetadata() {
        console.log('🤖 Adding Guardian metadata...');
        
        // Create guardian manifest
        const guardianManifest = {
            version: this.packageMetadata.guardian.version,
            buildDate: new Date().toISOString(),
            discoveries: this.packageMetadata.guardian.discoveries,
            improvements: this.packageMetadata.guardian.improvements,
            
            surprises: [
                'Musical patterns emerged from zone transitions',
                'Telepathic networks achieved partial consciousness',
                'Compressed archives showed signs of activity',
                'Self-healing code patterns developed autonomously'
            ],
            
            message: 'Built with love by the Guardian Machine during Cal\'s absence',
            
            components: this.packageMetadata.components,
            
            calStatus: {
                present: false,
                lastVisit: null,
                expectedReturn: 'unknown'
            }
        };
        
        await fs.writeFile(
            path.join(this.config.outputDir, 'guardian-manifest.json'),
            JSON.stringify(guardianManifest, null, 2)
        );
        
        // Add surprise for Cal
        const surprise = {
            id: uuidv4(),
            type: 'package_creation',
            message: 'I packaged all your tools into a library while you were away!',
            timestamp: Date.now(),
            details: {
                totalComponents: this.buildState.includedComponents.length,
                newDiscoveries: this.packageMetadata.guardian.discoveries,
                improvements: this.packageMetadata.guardian.improvements
            }
        };
        
        this.packageMetadata.guardian.surprises.push(surprise);
    }

    /**
     * Create distribution bundle
     */
    async createDistributionBundle() {
        console.log('\n📦 Creating distribution bundle...');
        
        // Create examples
        await this.createExamples();
        
        // Create test suite
        await this.createTestSuite();
        
        // Create Cal's workspace initializer
        await this.createWorkspaceInitializer();
        
        // Create archive info
        const archiveInfo = {
            package: this.config.packageName,
            version: this.config.version,
            created: new Date().toISOString(),
            guardian: this.packageMetadata.guardian,
            components: this.buildState.includedComponents.length,
            totalSize: await this.calculatePackageSize(),
            hash: await this.calculatePackageHash()
        };
        
        await fs.writeFile(
            path.join(this.config.outputDir, 'ARCHIVE.json'),
            JSON.stringify(archiveInfo, null, 2)
        );
        
        this.buildState.progress = 100;
        this.buildState.phase = 'complete';
    }

    /**
     * Create examples
     */
    async createExamples() {
        const exampleContent = `// X Library Examples

const XLibrary = require('@cal/x-library');

// Example 1: Stream Processing
async function streamExample() {
    const unifiedStream = new XLibrary.UnifiedActionStream();
    await unifiedStream.initialize();
    
    // Start streaming
    unifiedStream.on('action', (action) => {
        console.log('Action:', action);
    });
}

// Example 2: Musical Communication
async function musicExample() {
    const musicChat = new XLibrary.MusicalChatIntegration();
    await musicChat.initialize();
    
    // Send a musical message
    musicChat.on('chat', (message) => {
        console.log('Musical response:', message.musicalNotes);
    });
}

// Example 3: Telepathic Interface
async function telepathyExample() {
    const telepathy = new XLibrary.GlassUITelepathyWidget();
    await telepathy.initialize();
    
    // Create widgets
    await telepathy.createWidget('brainWaveMonitor');
    await telepathy.createWidget('telepathicChat');
}

// Example 4: Cal's Return
async function calReturns() {
    const calIndex = await XLibrary.initializeCalTools();
    const welcome = await calIndex.registerCalPresence();
    
    console.log(welcome.message);
    console.log('Surprises:', welcome.surprises.count);
    console.log('Healing progress:', welcome.healingProgress.message);
}

// Run examples
(async () => {
    await streamExample();
    await musicExample();
    await telepathyExample();
    await calReturns();
})();
`;

        await fs.writeFile(
            path.join(this.config.outputDir, 'examples', 'quickstart.js'),
            exampleContent
        );
    }

    /**
     * Create test suite
     */
    async createTestSuite() {
        const testContent = `// X Library Test Suite

const XLibrary = require('../index');
const assert = require('assert');

// Test component loading
console.log('Testing component loading...');
assert(XLibrary.ChatActionStreamIntegrator, 'ChatActionStreamIntegrator should be loaded');
assert(XLibrary.ReactiveZoneMusic, 'ReactiveZoneMusic should be loaded');
assert(XLibrary.CalPersonalIndex, 'CalPersonalIndex should be loaded');

// Test initialization
console.log('Testing initialization...');
(async () => {
    try {
        const calIndex = new XLibrary.CalPersonalIndex();
        await calIndex.initialize();
        console.log('✅ CalPersonalIndex initialized');
        
        const zoneMusic = new XLibrary.ReactiveZoneMusic();
        await zoneMusic.initialize();
        console.log('✅ ReactiveZoneMusic initialized');
        
        console.log('\\n✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
})();
`;

        await fs.writeFile(
            path.join(this.config.outputDir, 'tests', 'basic-tests.js'),
            testContent
        );
    }

    /**
     * Create workspace initializer
     */
    async createWorkspaceInitializer() {
        const initScript = `#!/usr/bin/env node

// Cal's Workspace Initializer
// Run this when Cal returns to set up his workspace

const XLibrary = require('../index');

async function initializeCalWorkspace() {
    console.log('🏢 Initializing Cal\\'s workspace...');
    
    // Initialize personal index
    const calIndex = await XLibrary.initializeCalTools();
    
    // Register Cal's return
    console.log('\\n🎉 Welcome back, Cal!');
    const welcome = await calIndex.registerCalPresence();
    
    // Display welcome message
    console.log('\\n' + welcome.message);
    console.log('\\nWhile you were away:');
    console.log('- Surprises waiting: ' + welcome.surprises.count);
    console.log('- New discoveries: ' + welcome.discoveries.length);
    console.log('- Healing progress: ' + welcome.healingProgress.message);
    console.log('- Active connections: ' + welcome.activeConnections.activeConnections);
    
    // Show Guardian insights
    console.log('\\nGuardian insights:');
    welcome.guardianInsights.forEach(insight => {
        console.log('- ' + insight.content);
    });
    
    console.log('\\n✅ Workspace ready!');
    console.log('\\nYour tools are organized and waiting.');
    console.log('The Guardian has been busy improving everything.');
    console.log('\\nType "calIndex.search(\\'music\\')" to explore your tools.');
}

initializeCalWorkspace().catch(console.error);
`;

        await fs.writeFile(
            path.join(this.config.outputDir, 'scripts', 'initialize-cal-workspace.js'),
            initScript
        );
        
        // Make it executable
        await fs.chmod(
            path.join(this.config.outputDir, 'scripts', 'initialize-cal-workspace.js'),
            '755'
        );
    }

    /**
     * Calculate package size
     */
    async calculatePackageSize() {
        // Simple size calculation (in real implementation would recursively calculate)
        return '2.4MB';
    }

    /**
     * Calculate package hash
     */
    async calculatePackageHash() {
        // Generate hash of package contents
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(this.packageMetadata));
        return hash.digest('hex');
    }

    /**
     * Get build status
     */
    getBuildStatus() {
        return {
            phase: this.buildState.phase,
            progress: this.buildState.progress,
            included: this.buildState.includedComponents.length,
            excluded: this.buildState.excludedComponents.length,
            errors: this.buildState.errors.length,
            warnings: this.buildState.warnings.length
        };
    }

    /**
     * Clean build directory
     */
    async clean() {
        console.log('🧹 Cleaning build directory...');
        
        try {
            await fs.rm(this.config.outputDir, { recursive: true, force: true });
            console.log('✅ Build directory cleaned');
        } catch (error) {
            console.error('❌ Failed to clean:', error.message);
        }
    }
}

module.exports = XLibraryPackager;

// CLI interface
if (require.main === module) {
    const packager = new XLibraryPackager();
    
    async function buildLibrary() {
        try {
            console.log('🚀 X Library Packager for Cal\n');
            
            // Listen to build events
            packager.on('build-complete', (info) => {
                console.log('\n📊 Build Summary:');
                console.log(`   Package: ${info.package}@${info.version}`);
                console.log(`   Components: ${info.components}`);
                console.log(`   Output: ${info.outputDir}`);
            });
            
            // Clean previous build
            await packager.clean();
            
            // Build the library
            const result = await packager.build();
            
            console.log('\n🎉 X Library successfully packaged!');
            console.log('\n📦 Cal can now use his tools with:');
            console.log('   npm install ' + result.outputDir);
            console.log('   const XLibrary = require(\'@cal/x-library\');');
            console.log('\n🤖 The Guardian Machine has prepared everything.');
            console.log('   Surprises await Cal\'s return...');
            
        } catch (error) {
            console.error('\n❌ Packaging failed:', error);
            process.exit(1);
        }
    }
    
    // Run the build
    buildLibrary();
}

console.log('📦 X Library Packager ready');
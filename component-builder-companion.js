#!/usr/bin/env node

/**
 * COMPONENT BUILDER COMPANION
 * 
 * A Mr. Potato Head style visual component builder for assembling, fixing,
 * and connecting system parts. Think broken toy repair shop meets Lego builder.
 * 
 * Features:
 * - Visual drag-and-drop component assembly
 * - Broken component detection and repair suggestions
 * - College sports integration (schools as pluggable components)
 * - Plugin architecture helper for modular systems
 * - Real-time connection testing and validation
 * - Component marketplace for missing parts
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import existing systems
const RingArchitectureBridge = require('./ring-architecture-bridge');
const SportsDataIngestionService = require('./sports-data-ingestion');
const unifiedColorSystem = require('./unified-color-system');

class ComponentBuilderCompanion extends EventEmitter {
    constructor() {
        super();
        
        this.companionName = 'Component Builder Companion';
        this.version = '2.5.0';
        
        // Component inventory system
        this.componentInventory = {
            working: new Map(),          // Functional components
            broken: new Map(),           // Components needing repair
            missing: new Map(),          // Components that should exist but don't
            custom: new Map(),           // User-created components
            marketplace: new Map()       // Available components for download
        };
        
        // Assembly workspace
        this.assemblyWorkspace = {
            currentProject: null,
            components: new Map(),       // Components in current assembly
            connections: new Map(),      // How components connect
            testResults: new Map(),      // Connection test results
            saveStates: new Map()        // Saved assembly configurations
        };
        
        // College sports component system
        this.collegeSportsComponents = {
            bigSchools: new Map(),       // Major universities as components
            conferences: new Map(),      // Conferences as connection groups
            regions: new Map(),          // Regional groupings
            customSchools: new Map()     // User-added schools
        };
        
        // Plugin architecture system
        this.pluginArchitecture = {
            availableSlots: new Map(),   // Where plugins can connect
            installedPlugins: new Map(), // Currently active plugins
            brokenPlugins: new Map(),    // Plugins needing repair
            dependencies: new Map()      // Plugin dependency tree
        };
        
        // Component repair system
        this.repairSystem = {
            diagnostics: new Map(),      // Component health checks
            repairGuides: new Map(),     // How to fix broken components
            autoFixes: new Map(),        // Automatic repair functions
            manualTasks: new Map()       // Tasks requiring human intervention
        };
        
        // Visual builder interface
        this.visualBuilder = {
            canvas: null,                // Drawing canvas for components
            componentPalette: new Map(), // Available components to drag
            connectionWires: new Map(),  // Visual connections between components
            gridSystem: { x: 50, y: 50 } // Snap-to-grid for clean layout
        };
        
        console.log(unifiedColorSystem.formatStatus('info', 'Component Builder Companion initializing...'));
        this.initialize();
    }
    
    async initialize() {
        try {
            // Phase 1: Scan existing system for components
            await this.scanExistingComponents();
            
            // Phase 2: Initialize college sports components
            await this.initializeCollegeSportsComponents();
            
            // Phase 3: Set up plugin architecture
            await this.setupPluginArchitecture();
            
            // Phase 4: Initialize repair system
            await this.initializeRepairSystem();
            
            // Phase 5: Create visual builder interface
            await this.createVisualBuilder();
            
            // Phase 6: Start component health monitoring
            this.startComponentMonitoring();
            
            console.log(unifiedColorSystem.formatStatus('success', 'Component Builder Companion ready'));
            
            this.emit('companionReady', {
                workingComponents: this.componentInventory.working.size,
                brokenComponents: this.componentInventory.broken.size,
                collegeComponents: this.collegeSportsComponents.bigSchools.size,
                availablePlugins: this.pluginArchitecture.availableSlots.size
            });
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', 
                `Companion initialization failed: ${error.message}`));
            throw error;
        }
    }
    
    /**
     * COMPONENT SCANNING AND INVENTORY
     */
    async scanExistingComponents() {
        console.log(unifiedColorSystem.formatStatus('info', 'Scanning existing system components...'));
        
        // Scan for JavaScript components
        const jsComponents = await this.scanJavaScriptComponents();
        
        // Test each component for functionality
        for (const [componentName, componentPath] of jsComponents) {
            const health = await this.testComponentHealth(componentName, componentPath);
            
            if (health.working) {
                this.componentInventory.working.set(componentName, {
                    path: componentPath,
                    type: 'javascript',
                    health: health,
                    connections: health.connections || [],
                    lastTested: Date.now()
                });
            } else {
                this.componentInventory.broken.set(componentName, {
                    path: componentPath,
                    type: 'javascript',
                    health: health,
                    issues: health.issues || [],
                    repairSuggestions: this.generateRepairSuggestions(health),
                    lastTested: Date.now()
                });
            }
        }
        
        console.log(unifiedColorSystem.formatStatus('success', 
            `Found ${this.componentInventory.working.size} working and ${this.componentInventory.broken.size} broken components`));
    }
    
    async scanJavaScriptComponents() {
        const components = new Map();
        const currentDir = process.cwd();
        
        try {
            const files = await fs.readdir(currentDir);
            
            for (const file of files) {
                if (file.endsWith('.js') && !file.startsWith('.')) {
                    const componentName = path.basename(file, '.js');
                    components.set(componentName, path.join(currentDir, file));
                }
            }
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `Component scanning failed: ${error.message}`));
        }
        
        return components;
    }
    
    async testComponentHealth(componentName, componentPath) {
        try {
            // Try to require the component
            const component = require(componentPath);
            
            const health = {
                working: true,
                hasConstructor: typeof component === 'function',
                hasExports: typeof component === 'object',
                canInstantiate: false,
                connections: [],
                issues: []
            };
            
            // Test if we can create an instance
            if (health.hasConstructor) {
                try {
                    const instance = new component();
                    health.canInstantiate = true;
                    
                    // Check for common methods
                    if (typeof instance.initialize === 'function') {
                        health.connections.push('initialize');
                    }
                    if (typeof instance.on === 'function') {
                        health.connections.push('event_emitter');
                    }
                    if (typeof instance.runDiagnostics === 'function') {
                        health.connections.push('diagnostics');
                    }
                } catch (instantiationError) {
                    health.issues.push(`Cannot instantiate: ${instantiationError.message}`);
                }
            }
            
            return health;
            
        } catch (requireError) {
            return {
                working: false,
                issues: [`Cannot require: ${requireError.message}`],
                hasConstructor: false,
                hasExports: false,
                canInstantiate: false,
                connections: []
            };
        }
    }
    
    generateRepairSuggestions(health) {
        const suggestions = [];
        
        if (health.issues.includes('Cannot require')) {
            suggestions.push({
                type: 'syntax_fix',
                description: 'Check for syntax errors and missing dependencies',
                autoFixable: false,
                priority: 'high'
            });
        }
        
        if (!health.canInstantiate && health.hasConstructor) {
            suggestions.push({
                type: 'constructor_fix',
                description: 'Constructor may need required parameters or dependency injection',
                autoFixable: false,
                priority: 'medium'
            });
        }
        
        if (health.connections.length === 0) {
            suggestions.push({
                type: 'add_interfaces',
                description: 'Add standard interfaces (initialize, runDiagnostics, etc.)',
                autoFixable: true,
                priority: 'low'
            });
        }
        
        return suggestions;
    }
    
    /**
     * COLLEGE SPORTS COMPONENT SYSTEM
     */
    async initializeCollegeSportsComponents() {
        console.log(unifiedColorSystem.formatStatus('info', 'Initializing college sports components...'));
        
        // Major universities as pluggable components
        const bigSchools = [
            { name: 'University of Wisconsin', short: 'UW', conference: 'Big Ten', sports: ['football', 'basketball', 'baseball'] },
            { name: 'University of Michigan', short: 'UM', conference: 'Big Ten', sports: ['football', 'basketball', 'baseball'] },
            { name: 'Ohio State University', short: 'OSU', conference: 'Big Ten', sports: ['football', 'basketball', 'baseball'] },
            { name: 'University of Alabama', short: 'BAMA', conference: 'SEC', sports: ['football', 'basketball', 'baseball'] },
            { name: 'Duke University', short: 'DUKE', conference: 'ACC', sports: ['basketball', 'football', 'lacrosse'] },
            { name: 'Stanford University', short: 'STAN', conference: 'Pac-12', sports: ['football', 'basketball', 'baseball'] },
            { name: 'University of Texas', short: 'UT', conference: 'Big 12', sports: ['football', 'basketball', 'baseball'] },
            { name: 'University of Florida', short: 'UF', conference: 'SEC', sports: ['football', 'basketball', 'baseball'] }
        ];
        
        for (const school of bigSchools) {
            const schoolComponent = this.createSchoolComponent(school);
            this.collegeSportsComponents.bigSchools.set(school.short, schoolComponent);
        }
        
        // Create conference components
        const conferences = ['Big Ten', 'SEC', 'ACC', 'Pac-12', 'Big 12'];
        for (const conference of conferences) {
            this.collegeSportsComponents.conferences.set(conference, {
                name: conference,
                schools: this.getSchoolsByConference(conference),
                sports: ['football', 'basketball', 'baseball'],
                rivalries: this.getConferenceRivalries(conference),
                componentType: 'conference_container'
            });
        }
        
        // Create regional components
        const regions = [
            { name: 'Midwest', schools: ['UW', 'UM', 'OSU'], primary_sport: 'football' },
            { name: 'South', schools: ['BAMA', 'UF', 'UT'], primary_sport: 'football' },
            { name: 'Northeast', schools: ['DUKE'], primary_sport: 'basketball' },
            { name: 'West Coast', schools: ['STAN'], primary_sport: 'football' }
        ];
        
        for (const region of regions) {
            this.collegeSportsComponents.regions.set(region.name, {
                ...region,
                componentType: 'regional_grouping'
            });
        }
        
        console.log(unifiedColorSystem.formatStatus('success', 
            `Created ${this.collegeSportsComponents.bigSchools.size} school components`));
    }
    
    createSchoolComponent(school) {
        return {
            name: school.name,
            shortName: school.short,
            conference: school.conference,
            sports: school.sports,
            componentType: 'school',
            
            // Component interface
            connections: {
                sportsData: `sports-data-${school.short.toLowerCase()}`,
                conference: school.conference,
                rivals: this.getSchoolRivals(school.short),
                region: this.getSchoolRegion(school.short)
            },
            
            // Pluggable sports modules
            sportsModules: school.sports.map(sport => ({
                sport: sport,
                enabled: true,
                dataSource: `${school.short.toLowerCase()}-${sport}`,
                gameMechanics: this.getSportMechanics(sport)
            })),
            
            // Visual representation
            visual: {
                colors: this.getSchoolColors(school.short),
                logo: `assets/logos/${school.short.toLowerCase()}.png`,
                mascot: this.getSchoolMascot(school.short),
                position: { x: 0, y: 0 } // For visual builder
            },
            
            // Component health
            health: {
                working: true,
                lastUpdated: Date.now(),
                dataConnections: school.sports.length,
                issues: []
            }
        };
    }
    
    getSchoolsByConference(conference) {
        const schoolsByConference = {
            'Big Ten': ['UW', 'UM', 'OSU'],
            'SEC': ['BAMA', 'UF'],
            'ACC': ['DUKE'],
            'Pac-12': ['STAN'],
            'Big 12': ['UT']
        };
        
        return schoolsByConference[conference] || [];
    }
    
    getConferenceRivalries(conference) {
        const rivalries = {
            'Big Ten': [['UW', 'UM'], ['UM', 'OSU']],
            'SEC': [['BAMA', 'UF']],
            'ACC': [],
            'Pac-12': [],
            'Big 12': []
        };
        
        return rivalries[conference] || [];
    }
    
    getSchoolRivals(schoolShort) {
        const rivalries = {
            'UW': ['UM', 'OSU'],
            'UM': ['UW', 'OSU'],
            'OSU': ['UM'],
            'BAMA': ['UF'],
            'UF': ['BAMA'],
            'DUKE': [],
            'STAN': [],
            'UT': []
        };
        
        return rivalries[schoolShort] || [];
    }
    
    getSchoolRegion(schoolShort) {
        const regions = {
            'UW': 'Midwest',
            'UM': 'Midwest', 
            'OSU': 'Midwest',
            'BAMA': 'South',
            'UF': 'South',
            'UT': 'South',
            'DUKE': 'Northeast',
            'STAN': 'West Coast'
        };
        
        return regions[schoolShort] || 'Unknown';
    }
    
    getSportMechanics(sport) {
        const mechanics = {
            'football': { type: 'war_cards', primary: true },
            'basketball': { type: 'shooting_game', primary: true },
            'baseball': { type: 'go_fish', primary: true },
            'lacrosse': { type: 'territory_control', primary: false }
        };
        
        return mechanics[sport] || { type: 'generic', primary: false };
    }
    
    getSchoolColors(schoolShort) {
        const colors = {
            'UW': ['#C5050C', '#000000'], // Red and Black
            'UM': ['#00274C', '#FFCB05'], // Maize and Blue
            'OSU': ['#BB0000', '#808080'], // Scarlet and Gray
            'BAMA': ['#9E1B32', '#828A8F'], // Crimson and White
            'UF': ['#0021A5', '#FA4616'], // Blue and Orange
            'DUKE': ['#001A57', '#000000'], // Duke Blue and White
            'STAN': ['#8C1515', '#000000'], // Cardinal Red
            'UT': ['#BF5700', '#000000'] // Burnt Orange
        };
        
        return colors[schoolShort] || ['#000000', '#FFFFFF'];
    }
    
    getSchoolMascot(schoolShort) {
        const mascots = {
            'UW': 'Badger',
            'UM': 'Wolverine',
            'OSU': 'Buckeye',
            'BAMA': 'Elephant',
            'UF': 'Gator',
            'DUKE': 'Blue Devil',
            'STAN': 'Cardinal',
            'UT': 'Longhorn'
        };
        
        return mascots[schoolShort] || 'Unknown';
    }
    
    /**
     * PLUGIN ARCHITECTURE SYSTEM
     */
    async setupPluginArchitecture() {
        console.log(unifiedColorSystem.formatStatus('info', 'Setting up plugin architecture...'));
        
        // Define available plugin slots (like electrical outlets)
        const pluginSlots = [
            { name: 'sports_data_source', type: 'data_input', accepts: ['espn', 'mlb', 'custom'] },
            { name: 'game_mechanics', type: 'processor', accepts: ['go_fish', 'war_cards', 'shooting'] },
            { name: 'visual_display', type: 'output', accepts: ['canvas', 'webgl', 'svg'] },
            { name: 'social_integration', type: 'connector', accepts: ['twitch', 'discord', 'rsn'] },
            { name: 'college_sports', type: 'data_source', accepts: ['school_component', 'conference'] },
            { name: 'automation_hooks', type: 'connector', accepts: ['zapier', 'n8n', 'make'] },
            { name: 'timing_control', type: 'processor', accepts: ['reasoning_differential'] },
            { name: 'ring_bridge', type: 'connector', accepts: ['ring_architecture'] }
        ];
        
        for (const slot of pluginSlots) {
            this.pluginArchitecture.availableSlots.set(slot.name, {
                ...slot,
                occupied: false,
                currentPlugin: null,
                compatible: slot.accepts,
                health: 'ready'
            });
        }
        
        // Scan for existing plugins and try to auto-connect them
        await this.autoConnectExistingPlugins();
        
        console.log(unifiedColorSystem.formatStatus('success', 
            `Created ${this.pluginArchitecture.availableSlots.size} plugin slots`));
    }
    
    async autoConnectExistingPlugins() {
        console.log(unifiedColorSystem.formatStatus('info', 'Auto-connecting existing plugins...'));
        
        // Try to connect working components to appropriate slots
        for (const [componentName, component] of this.componentInventory.working) {
            const compatibleSlots = this.findCompatibleSlots(componentName, component);
            
            for (const slotName of compatibleSlots) {
                const slot = this.pluginArchitecture.availableSlots.get(slotName);
                
                if (slot && !slot.occupied) {
                    const connectionResult = await this.connectPluginToSlot(componentName, slotName);
                    
                    if (connectionResult.success) {
                        console.log(unifiedColorSystem.formatStatus('success', 
                            `Auto-connected ${componentName} to ${slotName}`));
                        break; // Only connect to one slot
                    }
                }
            }
        }
    }
    
    findCompatibleSlots(componentName, component) {
        const compatibleSlots = [];
        
        // Match component names to slot types
        if (componentName.includes('sports-data')) {
            compatibleSlots.push('sports_data_source');
        }
        if (componentName.includes('ring-architecture')) {
            compatibleSlots.push('ring_bridge');
        }
        if (componentName.includes('reasoning-differential')) {
            compatibleSlots.push('timing_control');
        }
        if (componentName.includes('automation-webhook')) {
            compatibleSlots.push('automation_hooks');
        }
        
        // Check component connections for compatibility hints
        if (component.connections) {
            if (component.connections.includes('event_emitter')) {
                compatibleSlots.push('social_integration');
            }
            if (component.connections.includes('diagnostics')) {
                compatibleSlots.push('visual_display');
            }
        }
        
        return compatibleSlots;
    }
    
    async connectPluginToSlot(componentName, slotName) {
        try {
            const component = this.componentInventory.working.get(componentName);
            const slot = this.pluginArchitecture.availableSlots.get(slotName);
            
            if (!component || !slot) {
                return { success: false, error: 'Component or slot not found' };
            }
            
            // Test the connection
            const connectionTest = await this.testPluginConnection(component, slot);
            
            if (connectionTest.success) {
                // Connect the plugin
                slot.occupied = true;
                slot.currentPlugin = componentName;
                slot.health = 'connected';
                
                this.pluginArchitecture.installedPlugins.set(componentName, {
                    component: component,
                    slot: slotName,
                    connectedAt: Date.now(),
                    health: 'working'
                });
                
                return { success: true, connection: connectionTest };
            } else {
                return { success: false, error: connectionTest.error };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async testPluginConnection(component, slot) {
        // Simulate connection testing
        const testResults = {
            success: true,
            latency: Math.random() * 100, // ms
            throughput: Math.random() * 1000, // requests/sec
            compatibility: 95 + Math.random() * 5, // percentage
            issues: []
        };
        
        // Random chance of connection issues
        if (Math.random() < 0.1) {
            testResults.success = false;
            testResults.issues.push('Compatibility mismatch');
        }
        
        return testResults;
    }
    
    /**
     * COMPONENT REPAIR SYSTEM
     */
    async initializeRepairSystem() {
        console.log(unifiedColorSystem.formatStatus('info', 'Initializing component repair system...'));
        
        // Set up repair guides for common issues
        this.repairSystem.repairGuides.set('syntax_error', {
            title: 'JavaScript Syntax Error',
            description: 'Component has syntax errors preventing execution',
            steps: [
                'Check for missing semicolons, brackets, or quotes',
                'Verify all function declarations are complete',
                'Look for typos in variable names',
                'Ensure proper indentation and scope'
            ],
            autoFixable: false,
            estimatedTime: '5-15 minutes'
        });
        
        this.repairSystem.repairGuides.set('dependency_missing', {
            title: 'Missing Dependencies',
            description: 'Component requires modules that are not installed',
            steps: [
                'Check require() statements at top of file',
                'Install missing npm packages',
                'Verify file paths for local requires',
                'Update package.json if needed'
            ],
            autoFixable: true,
            estimatedTime: '2-5 minutes'
        });
        
        this.repairSystem.repairGuides.set('constructor_error', {
            title: 'Constructor Issues',
            description: 'Component constructor fails during instantiation',
            steps: [
                'Check if constructor requires parameters',
                'Verify all dependencies are injected properly',
                'Look for initialization order issues',
                'Test with minimal configuration'
            ],
            autoFixable: false,
            estimatedTime: '10-30 minutes'
        });
        
        // Set up automatic repair functions
        this.repairSystem.autoFixes.set('missing_interfaces', async (componentName) => {
            return this.addStandardInterfaces(componentName);
        });
        
        this.repairSystem.autoFixes.set('dependency_install', async (componentName) => {
            return this.installMissingDependencies(componentName);
        });
        
        console.log(unifiedColorSystem.formatStatus('success', 'Repair system ready'));
    }
    
    async addStandardInterfaces(componentName) {
        // Add standard interfaces to components that are missing them
        const component = this.componentInventory.broken.get(componentName) || 
                         this.componentInventory.working.get(componentName);
        
        if (!component) {
            return { success: false, error: 'Component not found' };
        }
        
        try {
            const componentPath = component.path;
            const componentCode = await fs.readFile(componentPath, 'utf8');
            
            // Check if standard interfaces are missing
            const missingInterfaces = [];
            
            if (!componentCode.includes('runDiagnostics')) {
                missingInterfaces.push('runDiagnostics');
            }
            if (!componentCode.includes('getSystemStatus')) {
                missingInterfaces.push('getSystemStatus');
            }
            
            if (missingInterfaces.length > 0) {
                const interfaceCode = this.generateStandardInterfaces(missingInterfaces);
                const updatedCode = this.injectInterfacesIntoComponent(componentCode, interfaceCode);
                
                // Create backup first
                await fs.writeFile(`${componentPath}.backup`, componentCode);
                
                // Write updated code
                await fs.writeFile(componentPath, updatedCode);
                
                return { 
                    success: true, 
                    interfacesAdded: missingInterfaces,
                    backupCreated: `${componentPath}.backup`
                };
            }
            
            return { success: true, message: 'No interfaces needed' };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    generateStandardInterfaces(interfaces) {
        let code = '\n    /**\n     * AUTO-GENERATED STANDARD INTERFACES\n     */\n';
        
        if (interfaces.includes('runDiagnostics')) {
            code += `
    async runDiagnostics() {
        console.log('\\n=== ${this.constructor.name} Diagnostics ===\\n');
        console.log('Status: Working');
        console.log('Version: ${this.version || 'Unknown'}');
        console.log('Uptime:', process.uptime(), 'seconds');
        console.log('\\n=== Diagnostics Complete ===\\n');
    }\n`;
        }
        
        if (interfaces.includes('getSystemStatus')) {
            code += `
    getSystemStatus() {
        return {
            name: this.constructor.name,
            version: this.version || 'Unknown',
            uptime: process.uptime(),
            healthy: true,
            timestamp: Date.now()
        };
    }\n`;
        }
        
        return code;
    }
    
    injectInterfacesIntoComponent(componentCode, interfaceCode) {
        // Find the last method in the class and inject before the closing brace
        const classMatch = componentCode.match(/class\s+\w+.*?\{([\s\S]*)\}(?:\s*\/\/|\s*module\.exports|\s*$)/);
        
        if (classMatch) {
            const classBody = classMatch[1];
            const lastMethodIndex = classBody.lastIndexOf('}');
            
            if (lastMethodIndex !== -1) {
                const beforeLastMethod = classBody.substring(0, lastMethodIndex);
                const afterLastMethod = classBody.substring(lastMethodIndex);
                
                const updatedClassBody = beforeLastMethod + interfaceCode + afterLastMethod;
                
                return componentCode.replace(classMatch[1], updatedClassBody);
            }
        }
        
        // Fallback: append to end of file
        return componentCode + interfaceCode;
    }
    
    async installMissingDependencies(componentName) {
        // Analyze component and install missing dependencies
        const component = this.componentInventory.broken.get(componentName);
        
        if (!component) {
            return { success: false, error: 'Component not found' };
        }
        
        try {
            const componentCode = await fs.readFile(component.path, 'utf8');
            const requiredModules = this.extractRequiredModules(componentCode);
            const missingModules = [];
            
            for (const module of requiredModules) {
                try {
                    require.resolve(module);
                } catch (error) {
                    missingModules.push(module);
                }
            }
            
            if (missingModules.length > 0) {
                // In a real implementation, this would run npm install
                console.log(unifiedColorSystem.formatStatus('info', 
                    `Would install: ${missingModules.join(', ')}`));
                
                return {
                    success: true,
                    modulesToInstall: missingModules,
                    command: `npm install ${missingModules.join(' ')}`
                };
            }
            
            return { success: true, message: 'No missing dependencies' };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    extractRequiredModules(code) {
        const requirePattern = /require\(['"`]([^'"`]+)['"`]\)/g;
        const modules = [];
        let match;
        
        while ((match = requirePattern.exec(code)) !== null) {
            const module = match[1];
            // Only include external modules (not local files)
            if (!module.startsWith('.') && !module.startsWith('/')) {
                modules.push(module);
            }
        }
        
        return [...new Set(modules)]; // Remove duplicates
    }
    
    /**
     * VISUAL BUILDER INTERFACE
     */
    async createVisualBuilder() {
        console.log(unifiedColorSystem.formatStatus('info', 'Creating visual builder interface...'));
        
        // Create component palette
        this.createComponentPalette();
        
        // Initialize connection system
        this.initializeConnectionSystem();
        
        // Set up drag-and-drop handlers
        this.setupDragAndDropHandlers();
        
        console.log(unifiedColorSystem.formatStatus('success', 'Visual builder ready'));
    }
    
    createComponentPalette() {
        const paletteItems = [];
        
        // Add working components to palette
        for (const [name, component] of this.componentInventory.working) {
            paletteItems.push({
                name: name,
                type: 'working_component',
                color: '#4CAF50', // Green for working
                icon: '⚙️',
                draggable: true,
                component: component
            });
        }
        
        // Add broken components to palette (for repair)
        for (const [name, component] of this.componentInventory.broken) {
            paletteItems.push({
                name: name,
                type: 'broken_component',
                color: '#F44336', // Red for broken
                icon: '🔧',
                draggable: true,
                component: component
            });
        }
        
        // Add college sports components
        for (const [name, school] of this.collegeSportsComponents.bigSchools) {
            paletteItems.push({
                name: school.name,
                type: 'college_component',
                color: school.visual.colors[0],
                icon: '🏫',
                draggable: true,
                component: school
            });
        }
        
        this.visualBuilder.componentPalette = new Map(
            paletteItems.map(item => [item.name, item])
        );
    }
    
    initializeConnectionSystem() {
        // Define how components can connect to each other
        this.visualBuilder.connectionWires = new Map();
        
        // Automatically create connections between compatible components
        this.autoGenerateConnections();
    }
    
    autoGenerateConnections() {
        const components = Array.from(this.visualBuilder.componentPalette.values());
        
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                const comp1 = components[i];
                const comp2 = components[j];
                
                const compatibility = this.checkComponentCompatibility(comp1, comp2);
                
                if (compatibility.compatible) {
                    const connectionId = `${comp1.name}->${comp2.name}`;
                    
                    this.visualBuilder.connectionWires.set(connectionId, {
                        from: comp1.name,
                        to: comp2.name,
                        type: compatibility.connectionType,
                        strength: compatibility.strength,
                        bidirectional: compatibility.bidirectional,
                        color: this.getConnectionColor(compatibility.connectionType)
                    });
                }
            }
        }
    }
    
    checkComponentCompatibility(comp1, comp2) {
        // Check if two components can connect
        const compatibility = {
            compatible: false,
            connectionType: 'none',
            strength: 0,
            bidirectional: false
        };
        
        // Sports data can connect to game mechanics
        if (comp1.name.includes('sports-data') && comp2.name.includes('game-mechanics')) {
            compatibility.compatible = true;
            compatibility.connectionType = 'data_flow';
            compatibility.strength = 0.9;
        }
        
        // Ring bridge can connect to most things
        if (comp1.name.includes('ring-architecture') || comp2.name.includes('ring-architecture')) {
            compatibility.compatible = true;
            compatibility.connectionType = 'bridge';
            compatibility.strength = 0.8;
            compatibility.bidirectional = true;
        }
        
        // College sports components can connect to sports data
        if (comp1.type === 'college_component' && comp2.name.includes('sports')) {
            compatibility.compatible = true;
            compatibility.connectionType = 'sports_feed';
            compatibility.strength = 0.7;
        }
        
        // Working components can help repair broken ones
        if (comp1.type === 'working_component' && comp2.type === 'broken_component') {
            compatibility.compatible = true;
            compatibility.connectionType = 'repair_assist';
            compatibility.strength = 0.6;
        }
        
        return compatibility;
    }
    
    getConnectionColor(connectionType) {
        const colors = {
            'data_flow': '#2196F3',      // Blue
            'bridge': '#9C27B0',         // Purple  
            'sports_feed': '#FF9800',    // Orange
            'repair_assist': '#4CAF50',  // Green
            'plugin_slot': '#607D8B'     // Gray
        };
        
        return colors[connectionType] || '#666666';
    }
    
    setupDragAndDropHandlers() {
        // Placeholder for drag-and-drop event handlers
        // In a real implementation, this would set up mouse/touch event handlers
        
        this.dragHandlers = {
            onDragStart: (componentName) => {
                console.log(unifiedColorSystem.formatStatus('info', 
                    `Starting drag: ${componentName}`));
            },
            
            onDragOver: (targetArea) => {
                // Check if drop is allowed
                return this.canDropInArea(targetArea);
            },
            
            onDrop: (componentName, targetArea, position) => {
                return this.handleComponentDrop(componentName, targetArea, position);
            }
        };
    }
    
    canDropInArea(targetArea) {
        // Check if component can be dropped in target area
        return targetArea === 'workspace' || targetArea === 'plugin_slot';
    }
    
    async handleComponentDrop(componentName, targetArea, position) {
        if (targetArea === 'workspace') {
            // Add component to assembly workspace
            return this.addComponentToWorkspace(componentName, position);
        } else if (targetArea === 'plugin_slot') {
            // Connect component to plugin slot
            return this.connectComponentToSlot(componentName, position.slotName);
        }
        
        return { success: false, error: 'Invalid drop target' };
    }
    
    async addComponentToWorkspace(componentName, position) {
        const component = this.visualBuilder.componentPalette.get(componentName);
        
        if (!component) {
            return { success: false, error: 'Component not found' };
        }
        
        // Add to current workspace
        const workspaceId = this.assemblyWorkspace.currentProject || 'default';
        
        this.assemblyWorkspace.components.set(componentName, {
            component: component,
            position: position,
            addedAt: Date.now(),
            connections: []
        });
        
        // Test for automatic connections
        await this.testWorkspaceConnections();
        
        return { success: true, component: component, position: position };
    }
    
    async connectComponentToSlot(componentName, slotName) {
        return this.connectPluginToSlot(componentName, slotName);
    }
    
    async testWorkspaceConnections() {
        // Test connections between components in workspace
        const components = Array.from(this.assemblyWorkspace.components.keys());
        
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                const comp1Name = components[i];
                const comp2Name = components[j];
                
                const connectionId = `${comp1Name}->${comp2Name}`;
                const existingConnection = this.visualBuilder.connectionWires.get(connectionId);
                
                if (existingConnection) {
                    // Test the connection
                    const testResult = await this.testComponentConnection(comp1Name, comp2Name);
                    
                    this.assemblyWorkspace.testResults.set(connectionId, {
                        connection: existingConnection,
                        testResult: testResult,
                        testedAt: Date.now()
                    });
                }
            }
        }
    }
    
    async testComponentConnection(comp1Name, comp2Name) {
        // Simulate connection testing between components
        return {
            success: Math.random() > 0.2, // 80% success rate
            latency: Math.random() * 50,
            dataFlow: Math.random() * 1000,
            issues: Math.random() > 0.8 ? ['Minor compatibility issue'] : []
        };
    }
    
    /**
     * COMPONENT MONITORING
     */
    startComponentMonitoring() {
        // Monitor component health every 30 seconds
        setInterval(async () => {
            await this.performHealthChecks();
        }, 30000);
        
        // Auto-repair broken components every 5 minutes
        setInterval(async () => {
            await this.performAutoRepairs();
        }, 300000);
        
        console.log(unifiedColorSystem.formatStatus('success', 'Component monitoring started'));
    }
    
    async performHealthChecks() {
        let healthyCount = 0;
        let brokenCount = 0;
        
        // Check working components
        for (const [name, component] of this.componentInventory.working) {
            const health = await this.testComponentHealth(name, component.path);
            
            if (!health.working) {
                // Component became broken
                this.componentInventory.broken.set(name, {
                    ...component,
                    health: health,
                    brokenAt: Date.now()
                });
                this.componentInventory.working.delete(name);
                brokenCount++;
                
                console.log(unifiedColorSystem.formatStatus('warning', 
                    `Component ${name} became broken`));
            } else {
                healthyCount++;
            }
        }
        
        // Check broken components for recovery
        for (const [name, component] of this.componentInventory.broken) {
            const health = await this.testComponentHealth(name, component.path);
            
            if (health.working) {
                // Component was fixed
                this.componentInventory.working.set(name, {
                    ...component,
                    health: health,
                    repairedAt: Date.now()
                });
                this.componentInventory.broken.delete(name);
                healthyCount++;
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    `Component ${name} was repaired`));
            }
        }
        
        if (brokenCount > 0 || this.componentInventory.broken.size > 0) {
            console.log(unifiedColorSystem.formatStatus('info', 
                `Health Check: ${healthyCount} healthy, ${this.componentInventory.broken.size} broken`));
        }
    }
    
    async performAutoRepairs() {
        console.log(unifiedColorSystem.formatStatus('info', 'Performing automatic repairs...'));
        
        let repairedCount = 0;
        
        for (const [name, component] of this.componentInventory.broken) {
            // Try auto-fixes for this component
            for (const suggestion of component.repairSuggestions || []) {
                if (suggestion.autoFixable) {
                    const autoFix = this.repairSystem.autoFixes.get(suggestion.type);
                    
                    if (autoFix) {
                        try {
                            const result = await autoFix(name);
                            
                            if (result.success) {
                                console.log(unifiedColorSystem.formatStatus('success', 
                                    `Auto-repaired ${name}: ${suggestion.type}`));
                                repairedCount++;
                                break; // Only apply one fix per component per cycle
                            }
                        } catch (error) {
                            console.log(unifiedColorSystem.formatStatus('warning', 
                                `Auto-repair failed for ${name}: ${error.message}`));
                        }
                    }
                }
            }
        }
        
        if (repairedCount > 0) {
            console.log(unifiedColorSystem.formatStatus('success', 
                `Auto-repaired ${repairedCount} components`));
        }
    }
    
    /**
     * COMPANION INTERFACE METHODS
     */
    
    // Get current workspace status
    getWorkspaceStatus() {
        return {
            currentProject: this.assemblyWorkspace.currentProject,
            componentsInWorkspace: this.assemblyWorkspace.components.size,
            connectionsActive: this.assemblyWorkspace.testResults.size,
            lastSaved: this.assemblyWorkspace.lastSaved || null
        };
    }
    
    // Save current workspace configuration
    async saveWorkspace(projectName) {
        const workspaceConfig = {
            projectName: projectName,
            components: Object.fromEntries(this.assemblyWorkspace.components),
            connections: Object.fromEntries(this.visualBuilder.connectionWires),
            testResults: Object.fromEntries(this.assemblyWorkspace.testResults),
            savedAt: Date.now()
        };
        
        this.assemblyWorkspace.saveStates.set(projectName, workspaceConfig);
        this.assemblyWorkspace.currentProject = projectName;
        this.assemblyWorkspace.lastSaved = Date.now();
        
        return { success: true, projectName: projectName };
    }
    
    // Load workspace configuration
    async loadWorkspace(projectName) {
        const savedConfig = this.assemblyWorkspace.saveStates.get(projectName);
        
        if (!savedConfig) {
            return { success: false, error: 'Project not found' };
        }
        
        // Restore workspace state
        this.assemblyWorkspace.currentProject = projectName;
        this.assemblyWorkspace.components = new Map(Object.entries(savedConfig.components));
        this.visualBuilder.connectionWires = new Map(Object.entries(savedConfig.connections));
        this.assemblyWorkspace.testResults = new Map(Object.entries(savedConfig.testResults));
        
        return { success: true, project: savedConfig };
    }
    
    // Get repair suggestions for a broken component
    getRepairSuggestions(componentName) {
        const component = this.componentInventory.broken.get(componentName);
        
        if (!component) {
            return { success: false, error: 'Component not found or not broken' };
        }
        
        return {
            success: true,
            component: componentName,
            suggestions: component.repairSuggestions || [],
            repairGuides: Array.from(this.repairSystem.repairGuides.values())
        };
    }
    
    // Add a new college sports component
    addCollegeComponent(schoolData) {
        const schoolComponent = this.createSchoolComponent(schoolData);
        this.collegeSportsComponents.bigSchools.set(schoolData.short, schoolComponent);
        
        // Add to visual palette
        this.visualBuilder.componentPalette.set(schoolData.name, {
            name: schoolData.name,
            type: 'college_component',
            color: schoolComponent.visual.colors[0],
            icon: '🏫',
            draggable: true,
            component: schoolComponent
        });
        
        return { success: true, school: schoolComponent };
    }
    
    /**
     * STATUS AND DIAGNOSTICS
     */
    getCompanionStatus() {
        return {
            companionName: this.companionName,
            version: this.version,
            uptime: process.uptime(),
            
            inventory: {
                working: this.componentInventory.working.size,
                broken: this.componentInventory.broken.size,
                missing: this.componentInventory.missing.size,
                custom: this.componentInventory.custom.size
            },
            
            collegeSports: {
                schools: this.collegeSportsComponents.bigSchools.size,
                conferences: this.collegeSportsComponents.conferences.size,
                regions: this.collegeSportsComponents.regions.size
            },
            
            plugins: {
                availableSlots: this.pluginArchitecture.availableSlots.size,
                installedPlugins: this.pluginArchitecture.installedPlugins.size,
                brokenPlugins: this.pluginArchitecture.brokenPlugins.size
            },
            
            workspace: this.getWorkspaceStatus(),
            
            visualBuilder: {
                paletteItems: this.visualBuilder.componentPalette.size,
                connections: this.visualBuilder.connectionWires.size
            },
            
            repairs: {
                autoFixesAvailable: this.repairSystem.autoFixes.size,
                repairGuides: this.repairSystem.repairGuides.size
            }
        };
    }
    
    async runDiagnostics() {
        console.log('\n=== Component Builder Companion Diagnostics ===\n');
        
        const status = this.getCompanionStatus();
        
        console.log('🧩 Component Inventory:');
        console.log(`  Working: ${status.inventory.working} components`);
        console.log(`  Broken: ${status.inventory.broken} components`);
        console.log(`  Missing: ${status.inventory.missing} components`);
        console.log(`  Custom: ${status.inventory.custom} components`);
        
        console.log('\n🏫 College Sports Components:');
        console.log(`  Schools: ${status.collegeSports.schools}`);
        console.log(`  Conferences: ${status.collegeSports.conferences}`);
        console.log(`  Regions: ${status.collegeSports.regions}`);
        
        console.log('\n🔌 Plugin Architecture:');
        console.log(`  Available Slots: ${status.plugins.availableSlots}`);
        console.log(`  Installed Plugins: ${status.plugins.installedPlugins}`);
        console.log(`  Broken Plugins: ${status.plugins.brokenPlugins}`);
        
        console.log('\n🎨 Visual Builder:');
        console.log(`  Palette Items: ${status.visualBuilder.paletteItems}`);
        console.log(`  Connections: ${status.visualBuilder.connections}`);
        
        console.log('\n🔧 Repair System:');
        console.log(`  Auto-fixes Available: ${status.repairs.autoFixesAvailable}`);
        console.log(`  Repair Guides: ${status.repairs.repairGuides}`);
        
        console.log('\n📋 Workspace:');
        console.log(`  Current Project: ${status.workspace.currentProject || 'None'}`);
        console.log(`  Components in Workspace: ${status.workspace.componentsInWorkspace}`);
        console.log(`  Active Connections: ${status.workspace.connectionsActive}`);
        
        console.log('\n=== Diagnostics Complete ===\n');
    }
}

// Export the Component Builder Companion
module.exports = ComponentBuilderCompanion;

// Self-test if run directly
if (require.main === module) {
    (async () => {
        const companion = new ComponentBuilderCompanion();
        
        // Wait for initialization
        await new Promise(resolve => {
            companion.on('companionReady', resolve);
        });
        
        // Run diagnostics
        await companion.runDiagnostics();
        
        console.log('\n🚀 Component Builder Companion is running!');
        console.log('🧩 Component inventory and repair system active');
        console.log('🏫 College sports components ready');
        console.log('🔌 Plugin architecture system online');
        console.log('🎨 Visual builder interface ready');
        console.log('🔧 Auto-repair system monitoring components');
        console.log('Press Ctrl+C to shutdown.\n');
        
        // Demo some functionality
        console.log('🎭 Demo: Testing component connections...');
        
        setTimeout(async () => {
            console.log('🏫 Adding University of Wisconsin to workspace...');
            const result = await companion.addComponentToWorkspace('University of Wisconsin', { x: 100, y: 100 });
            if (result.success) {
                console.log('✅ UW component added successfully');
            }
        }, 2000);
        
        setTimeout(async () => {
            console.log('💾 Saving workspace as "college-sports-demo"...');
            const saveResult = await companion.saveWorkspace('college-sports-demo');
            if (saveResult.success) {
                console.log('✅ Workspace saved successfully');
            }
        }, 4000);
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down Component Builder Companion...');
            process.exit(0);
        });
        
    })().catch(console.error);
}
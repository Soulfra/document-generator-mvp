#!/usr/bin/env node

/**
 * 🔌 PLUGIN ARCHITECTURE SYSTEM 🔌
 * 
 * Converts monolithic services into hot-loadable plugins
 * with dependency injection and lifecycle management
 */

const fs = require('fs').promises;
const path = require('path');
const vm = require('vm');
const EventEmitter = require('events');
const chokidar = require('chokidar');

class PluginArchitectureSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.rootDir = options.rootDir || process.cwd();
        this.pluginDir = path.join(this.rootDir, 'plugins');
        this.coreDir = path.join(this.rootDir, 'singularity-core');
        
        // Plugin registry
        this.plugins = new Map();
        this.pluginDependencies = new Map();
        this.pluginCategories = new Map();
        
        // Core services available to all plugins
        this.coreServices = new Map();
        
        // Plugin lifecycle states
        this.states = {
            UNLOADED: 'unloaded',
            LOADING: 'loading',
            LOADED: 'loaded',
            STARTING: 'starting',
            RUNNING: 'running',
            STOPPING: 'stopping',
            STOPPED: 'stopped',
            ERROR: 'error'
        };
        
        // Hot reload watcher
        this.watcher = null;
        
        console.log('🔌 Plugin Architecture System initializing...');
    }
    
    async initialize() {
        console.log('\n📁 Setting up plugin directories...');
        
        // Create directory structure
        await this.createDirectoryStructure();
        
        // Initialize core services
        await this.initializeCoreServices();
        
        // Scan for existing services to convert
        await this.scanExistingServices();
        
        // Load plugin manifests
        await this.loadPluginManifests();
        
        // Start hot reload watcher
        this.startHotReload();
        
        console.log('\n✅ Plugin system initialized!');
    }
    
    async createDirectoryStructure() {
        const directories = [
            this.pluginDir,
            path.join(this.pluginDir, 'database'),
            path.join(this.pluginDir, 'http'),
            path.join(this.pluginDir, 'authentication'),
            path.join(this.pluginDir, 'ai-services'),
            path.join(this.pluginDir, 'blockchain'),
            path.join(this.pluginDir, 'messaging'),
            path.join(this.pluginDir, 'custom'),
            this.coreDir,
            path.join(this.coreDir, 'services'),
            path.join(this.coreDir, 'utils')
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('   Created plugin directory structure');
    }
    
    async initializeCoreServices() {
        console.log('\n🛠️ Initializing core services...');
        
        // Event Bus
        this.coreServices.set('eventBus', {
            emit: this.emit.bind(this),
            on: this.on.bind(this),
            once: this.once.bind(this),
            off: this.off.bind(this)
        });
        
        // Configuration Manager
        this.coreServices.set('config', {
            get: (key) => this.getConfig(key),
            set: (key, value) => this.setConfig(key, value),
            has: (key) => this.hasConfig(key)
        });
        
        // Logger
        this.coreServices.set('logger', {
            info: (...args) => console.log('ℹ️', ...args),
            warn: (...args) => console.warn('⚠️', ...args),
            error: (...args) => console.error('❌', ...args),
            debug: (...args) => console.log('🐛', ...args)
        });
        
        // Dependency Injector
        this.coreServices.set('injector', {
            get: (serviceName) => this.getService(serviceName),
            register: (name, service) => this.registerService(name, service),
            has: (serviceName) => this.hasService(serviceName)
        });
        
        // Plugin Manager (self-reference)
        this.coreServices.set('pluginManager', {
            load: (pluginId) => this.loadPlugin(pluginId),
            unload: (pluginId) => this.unloadPlugin(pluginId),
            reload: (pluginId) => this.reloadPlugin(pluginId),
            list: () => Array.from(this.plugins.keys()),
            getPlugin: (pluginId) => this.plugins.get(pluginId)
        });
        
        console.log('   Core services initialized:', Array.from(this.coreServices.keys()).join(', '));
    }
    
    async scanExistingServices() {
        console.log('\n🔍 Scanning for services to convert...');
        
        // Read singularity analysis if available
        try {
            const analysisPath = path.join(this.rootDir, 'singularity-output', 'plugin-architecture.json');
            const analysisData = await fs.readFile(analysisPath, 'utf-8');
            const analysis = JSON.parse(analysisData);
            
            console.log(`   Found ${analysis.servicePlugins.length} services to convert`);
            
            // Convert each service to a plugin
            for (const service of analysis.servicePlugins) {
                await this.convertServiceToPlugin(service);
            }
            
        } catch (error) {
            console.log('   No singularity analysis found, scanning manually...');
            await this.manualServiceScan();
        }
    }
    
    async convertServiceToPlugin(serviceInfo) {
        const pluginId = this.sanitizePluginId(serviceInfo.name);
        const category = serviceInfo.category || 'custom';
        const pluginPath = path.join(this.pluginDir, category, pluginId);
        
        // Create plugin directory
        await fs.mkdir(pluginPath, { recursive: true });
        
        // Generate plugin manifest
        const manifest = {
            id: pluginId,
            name: serviceInfo.name,
            version: '1.0.0',
            category,
            description: `Converted from ${serviceInfo.originalFile}`,
            main: 'index.js',
            dependencies: [],
            ports: serviceInfo.ports || [],
            config: {
                enabled: true,
                autoStart: false
            }
        };
        
        await fs.writeFile(
            path.join(pluginPath, 'plugin.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // Generate plugin wrapper
        const wrapper = this.generatePluginWrapper(serviceInfo);
        await fs.writeFile(
            path.join(pluginPath, 'index.js'),
            wrapper
        );
        
        console.log(`   ✅ Converted ${serviceInfo.name} to plugin at ${pluginPath}`);
    }
    
    generatePluginWrapper(serviceInfo) {
        return `/**
 * Plugin: ${serviceInfo.name}
 * Auto-generated from: ${serviceInfo.originalFile}
 * Category: ${serviceInfo.category}
 */

class ${this.toPascalCase(serviceInfo.name)}Plugin {
    constructor(core) {
        this.core = core;
        this.logger = core.logger;
        this.config = core.config;
        this.eventBus = core.eventBus;
        
        this.name = '${serviceInfo.name}';
        this.version = '1.0.0';
        this.running = false;
        
        // Plugin-specific properties
        this.ports = ${JSON.stringify(serviceInfo.ports || [])};
        this.services = new Map();
    }
    
    async onLoad() {
        this.logger.info(\`Loading plugin: \${this.name}\`);
        
        // Initialize plugin resources
        await this.initializeResources();
        
        // Register event handlers
        this.registerEventHandlers();
        
        return true;
    }
    
    async onStart() {
        this.logger.info(\`Starting plugin: \${this.name}\`);
        
        try {
            // Start services
            ${serviceInfo.ports && serviceInfo.ports.length > 0 ? `
            for (const port of this.ports) {
                await this.startService(port);
            }` : '// No ports configured'}
            
            this.running = true;
            this.eventBus.emit('plugin:started', { plugin: this.name });
            
            return true;
        } catch (error) {
            this.logger.error(\`Failed to start \${this.name}:\`, error);
            throw error;
        }
    }
    
    async onStop() {
        this.logger.info(\`Stopping plugin: \${this.name}\`);
        
        // Stop all services
        for (const [name, service] of this.services) {
            await this.stopService(name);
        }
        
        this.running = false;
        this.eventBus.emit('plugin:stopped', { plugin: this.name });
        
        return true;
    }
    
    async onUnload() {
        this.logger.info(\`Unloading plugin: \${this.name}\`);
        
        // Clean up resources
        await this.cleanupResources();
        
        return true;
    }
    
    // Plugin-specific methods
    async initializeResources() {
        // TODO: Initialize plugin-specific resources
        // This is where the original service logic would go
    }
    
    registerEventHandlers() {
        // Register for events this plugin cares about
        this.eventBus.on('system:shutdown', () => this.onStop());
    }
    
    async startService(port) {
        // TODO: Implement service startup logic
        this.logger.info(\`Service would start on port \${port}\`);
    }
    
    async stopService(name) {
        // TODO: Implement service shutdown logic
        this.logger.info(\`Stopping service: \${name}\`);
    }
    
    async cleanupResources() {
        // TODO: Clean up any resources
        this.services.clear();
    }
    
    // Public API methods exposed to other plugins
    getAPI() {
        return {
            name: this.name,
            version: this.version,
            // Add public methods here
        };
    }
}

module.exports = ${this.toPascalCase(serviceInfo.name)}Plugin;`;
    }
    
    async loadPluginManifests() {
        console.log('\n📋 Loading plugin manifests...');
        
        const categories = await fs.readdir(this.pluginDir);
        
        for (const category of categories) {
            const categoryPath = path.join(this.pluginDir, category);
            const stat = await fs.stat(categoryPath);
            
            if (!stat.isDirectory()) continue;
            
            const plugins = await fs.readdir(categoryPath);
            
            for (const plugin of plugins) {
                const pluginPath = path.join(categoryPath, plugin);
                const manifestPath = path.join(pluginPath, 'plugin.json');
                
                try {
                    const manifest = JSON.parse(
                        await fs.readFile(manifestPath, 'utf-8')
                    );
                    
                    this.registerPlugin(manifest, pluginPath);
                    
                } catch (error) {
                    // Skip invalid plugins
                }
            }
        }
        
        console.log(`   Registered ${this.plugins.size} plugins`);
    }
    
    registerPlugin(manifest, pluginPath) {
        const pluginInfo = {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            category: manifest.category,
            path: pluginPath,
            manifest,
            instance: null,
            state: this.states.UNLOADED
        };
        
        this.plugins.set(manifest.id, pluginInfo);
        
        // Track by category
        if (!this.pluginCategories.has(manifest.category)) {
            this.pluginCategories.set(manifest.category, new Set());
        }
        this.pluginCategories.get(manifest.category).add(manifest.id);
        
        // Track dependencies
        if (manifest.dependencies && manifest.dependencies.length > 0) {
            this.pluginDependencies.set(manifest.id, manifest.dependencies);
        }
    }
    
    async loadPlugin(pluginId) {
        const pluginInfo = this.plugins.get(pluginId);
        if (!pluginInfo) {
            throw new Error(`Plugin not found: ${pluginId}`);
        }
        
        if (pluginInfo.state !== this.states.UNLOADED) {
            console.log(`Plugin ${pluginId} is already loaded`);
            return pluginInfo.instance;
        }
        
        console.log(`\n🔌 Loading plugin: ${pluginId}`);
        pluginInfo.state = this.states.LOADING;
        
        try {
            // Load dependencies first
            await this.loadDependencies(pluginId);
            
            // Load plugin module
            const PluginClass = require(path.join(pluginInfo.path, pluginInfo.manifest.main));
            
            // Create plugin instance with core services
            const pluginInstance = new PluginClass(this.coreServices);
            
            // Call lifecycle hook
            if (pluginInstance.onLoad) {
                await pluginInstance.onLoad();
            }
            
            pluginInfo.instance = pluginInstance;
            pluginInfo.state = this.states.LOADED;
            
            this.emit('plugin:loaded', { pluginId });
            
            // Auto-start if configured
            if (pluginInfo.manifest.config.autoStart) {
                await this.startPlugin(pluginId);
            }
            
            return pluginInstance;
            
        } catch (error) {
            pluginInfo.state = this.states.ERROR;
            console.error(`Failed to load plugin ${pluginId}:`, error);
            throw error;
        }
    }
    
    async loadDependencies(pluginId) {
        const dependencies = this.pluginDependencies.get(pluginId) || [];
        
        for (const depId of dependencies) {
            if (!this.plugins.has(depId)) {
                throw new Error(`Dependency not found: ${depId}`);
            }
            
            const depInfo = this.plugins.get(depId);
            if (depInfo.state === this.states.UNLOADED) {
                await this.loadPlugin(depId);
            }
        }
    }
    
    async startPlugin(pluginId) {
        const pluginInfo = this.plugins.get(pluginId);
        if (!pluginInfo || !pluginInfo.instance) {
            throw new Error(`Plugin not loaded: ${pluginId}`);
        }
        
        if (pluginInfo.state === this.states.RUNNING) {
            console.log(`Plugin ${pluginId} is already running`);
            return;
        }
        
        console.log(`▶️ Starting plugin: ${pluginId}`);
        pluginInfo.state = this.states.STARTING;
        
        try {
            if (pluginInfo.instance.onStart) {
                await pluginInfo.instance.onStart();
            }
            
            pluginInfo.state = this.states.RUNNING;
            this.emit('plugin:started', { pluginId });
            
        } catch (error) {
            pluginInfo.state = this.states.ERROR;
            console.error(`Failed to start plugin ${pluginId}:`, error);
            throw error;
        }
    }
    
    async stopPlugin(pluginId) {
        const pluginInfo = this.plugins.get(pluginId);
        if (!pluginInfo || !pluginInfo.instance) {
            return;
        }
        
        if (pluginInfo.state !== this.states.RUNNING) {
            return;
        }
        
        console.log(`⏹️ Stopping plugin: ${pluginId}`);
        pluginInfo.state = this.states.STOPPING;
        
        try {
            if (pluginInfo.instance.onStop) {
                await pluginInfo.instance.onStop();
            }
            
            pluginInfo.state = this.states.STOPPED;
            this.emit('plugin:stopped', { pluginId });
            
        } catch (error) {
            console.error(`Error stopping plugin ${pluginId}:`, error);
        }
    }
    
    async unloadPlugin(pluginId) {
        const pluginInfo = this.plugins.get(pluginId);
        if (!pluginInfo) {
            return;
        }
        
        // Stop if running
        if (pluginInfo.state === this.states.RUNNING) {
            await this.stopPlugin(pluginId);
        }
        
        console.log(`📤 Unloading plugin: ${pluginId}`);
        
        try {
            if (pluginInfo.instance && pluginInfo.instance.onUnload) {
                await pluginInfo.instance.onUnload();
            }
            
            // Clear from require cache
            const modulePath = require.resolve(
                path.join(pluginInfo.path, pluginInfo.manifest.main)
            );
            delete require.cache[modulePath];
            
            pluginInfo.instance = null;
            pluginInfo.state = this.states.UNLOADED;
            
            this.emit('plugin:unloaded', { pluginId });
            
        } catch (error) {
            console.error(`Error unloading plugin ${pluginId}:`, error);
        }
    }
    
    async reloadPlugin(pluginId) {
        console.log(`🔄 Reloading plugin: ${pluginId}`);
        
        await this.unloadPlugin(pluginId);
        await this.loadPlugin(pluginId);
        
        const pluginInfo = this.plugins.get(pluginId);
        if (pluginInfo.manifest.config.autoStart) {
            await this.startPlugin(pluginId);
        }
    }
    
    startHotReload() {
        console.log('\n🔥 Starting hot reload watcher...');
        
        this.watcher = chokidar.watch(this.pluginDir, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });
        
        this.watcher.on('change', async (filePath) => {
            // Find which plugin this file belongs to
            const relativePath = path.relative(this.pluginDir, filePath);
            const parts = relativePath.split(path.sep);
            
            if (parts.length >= 2) {
                const category = parts[0];
                const pluginName = parts[1];
                
                // Find plugin by path
                for (const [pluginId, pluginInfo] of this.plugins) {
                    if (pluginInfo.path.includes(pluginName)) {
                        console.log(`\n🔄 Detected change in ${pluginId}, reloading...`);
                        await this.reloadPlugin(pluginId);
                        break;
                    }
                }
            }
        });
        
        console.log('   Hot reload enabled for plugin directory');
    }
    
    // Service management
    getService(serviceName) {
        // Check core services first
        if (this.coreServices.has(serviceName)) {
            return this.coreServices.get(serviceName);
        }
        
        // Check plugin APIs
        for (const [pluginId, pluginInfo] of this.plugins) {
            if (pluginInfo.instance && pluginInfo.instance.getAPI) {
                const api = pluginInfo.instance.getAPI();
                if (api.name === serviceName) {
                    return api;
                }
            }
        }
        
        return null;
    }
    
    registerService(name, service) {
        this.coreServices.set(name, service);
    }
    
    hasService(serviceName) {
        return this.coreServices.has(serviceName) || 
               this.getService(serviceName) !== null;
    }
    
    // Configuration management
    getConfig(key) {
        // Simple config management - extend as needed
        return process.env[key];
    }
    
    setConfig(key, value) {
        process.env[key] = value;
    }
    
    hasConfig(key) {
        return key in process.env;
    }
    
    // Utility methods
    sanitizePluginId(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    toPascalCase(str) {
        return str.split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    
    async manualServiceScan() {
        // Fallback service scanning if no analysis available
        const servicePatterns = ['*service*.js', '*server*.js', '*api*.js'];
        const services = [];
        
        for (const pattern of servicePatterns) {
            const files = await this.findFilesByPattern(this.rootDir, pattern);
            services.push(...files);
        }
        
        console.log(`   Found ${services.length} potential services`);
        
        // Convert a sample of services
        const sample = services.slice(0, 10);
        for (const serviceFile of sample) {
            const name = path.basename(serviceFile, '.js');
            await this.convertServiceToPlugin({
                name,
                originalFile: serviceFile,
                category: 'custom',
                ports: []
            });
        }
    }
    
    async findFilesByPattern(dir, pattern) {
        const results = [];
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        
        try {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                if (item.includes('node_modules')) continue;
                
                const fullPath = path.join(dir, item);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    const subResults = await this.findFilesByPattern(fullPath, pattern);
                    results.push(...subResults);
                } else if (regex.test(item)) {
                    results.push(fullPath);
                }
            }
        } catch (error) {
            // Skip
        }
        
        return results;
    }
    
    // CLI commands
    async listPlugins() {
        console.log('\n📋 Registered Plugins:\n');
        
        for (const [category, pluginIds] of this.pluginCategories) {
            console.log(`${category}:`);
            
            for (const pluginId of pluginIds) {
                const info = this.plugins.get(pluginId);
                const status = info.state === this.states.RUNNING ? '🟢' : 
                              info.state === this.states.ERROR ? '🔴' : '⚪';
                console.log(`  ${status} ${pluginId} (${info.version})`);
            }
            console.log();
        }
    }
    
    async showPluginInfo(pluginId) {
        const info = this.plugins.get(pluginId);
        if (!info) {
            console.log(`Plugin not found: ${pluginId}`);
            return;
        }
        
        console.log(`\n🔌 Plugin Information: ${pluginId}\n`);
        console.log(`Name: ${info.name}`);
        console.log(`Version: ${info.version}`);
        console.log(`Category: ${info.category}`);
        console.log(`State: ${info.state}`);
        console.log(`Path: ${info.path}`);
        console.log(`Auto-start: ${info.manifest.config.autoStart}`);
        
        if (info.manifest.dependencies.length > 0) {
            console.log(`Dependencies: ${info.manifest.dependencies.join(', ')}`);
        }
        
        if (info.manifest.ports.length > 0) {
            console.log(`Ports: ${info.manifest.ports.join(', ')}`);
        }
    }
}

// Export for use as module
module.exports = PluginArchitectureSystem;

// CLI interface
if (require.main === module) {
    const system = new PluginArchitectureSystem();
    
    console.log('🔌 PLUGIN ARCHITECTURE SYSTEM');
    console.log('=============================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        await system.initialize();
        
        switch (command) {
            case 'list':
                await system.listPlugins();
                break;
                
            case 'load':
                if (args[0]) {
                    await system.loadPlugin(args[0]);
                    console.log(`✅ Plugin ${args[0]} loaded`);
                } else {
                    console.log('Usage: node plugin-architecture-system.js load <plugin-id>');
                }
                break;
                
            case 'start':
                if (args[0]) {
                    await system.startPlugin(args[0]);
                    console.log(`✅ Plugin ${args[0]} started`);
                } else {
                    console.log('Usage: node plugin-architecture-system.js start <plugin-id>');
                }
                break;
                
            case 'stop':
                if (args[0]) {
                    await system.stopPlugin(args[0]);
                    console.log(`✅ Plugin ${args[0]} stopped`);
                } else {
                    console.log('Usage: node plugin-architecture-system.js stop <plugin-id>');
                }
                break;
                
            case 'reload':
                if (args[0]) {
                    await system.reloadPlugin(args[0]);
                    console.log(`✅ Plugin ${args[0]} reloaded`);
                } else {
                    console.log('Usage: node plugin-architecture-system.js reload <plugin-id>');
                }
                break;
                
            case 'info':
                if (args[0]) {
                    await system.showPluginInfo(args[0]);
                } else {
                    console.log('Usage: node plugin-architecture-system.js info <plugin-id>');
                }
                break;
                
            default:
                console.log('Available commands:');
                console.log('  list              - List all plugins');
                console.log('  load <plugin>     - Load a plugin');
                console.log('  start <plugin>    - Start a plugin');
                console.log('  stop <plugin>     - Stop a plugin');
                console.log('  reload <plugin>   - Reload a plugin');
                console.log('  info <plugin>     - Show plugin information');
                console.log('\nHot reload is enabled - plugins will reload automatically on file changes');
        }
    }
    
    run().catch(console.error);
}
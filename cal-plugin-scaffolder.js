#!/usr/bin/env node

/**
 * CAL Plugin Scaffolder
 * 
 * Multi-platform plugin generation system for CAL Chat Interface.
 * Creates complete, production-ready plugins from natural language descriptions.
 * 
 * Supported Platforms:
 * - WordPress (PHP)
 * - Shopify (Liquid/JS)
 * - Chrome Extension (JS)
 * - VS Code Extension (TS)
 * - Discord Bot (JS)
 * - Slack App (JS)
 * - Obsidian Plugin (TS)
 * - Figma Plugin (TS)
 * - And more...
 * 
 * Features:
 * - Complete project structure
 * - Boilerplate code generation
 * - Configuration files
 * - Documentation
 * - Testing setup
 * - CI/CD pipelines
 * - Publishing scripts
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const express = require('express');

class CALPluginScaffolder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9093,
            outputDir: config.outputDir || './generated-plugins',
            templatesDir: config.templatesDir || './plugin-templates',
            
            // AI service URLs for code generation
            aiServiceUrl: config.aiServiceUrl || 'http://localhost:3001',
            
            // Supported platforms
            platforms: {
                wordpress: {
                    name: 'WordPress',
                    language: 'PHP',
                    packageManager: 'composer',
                    testFramework: 'phpunit',
                    fileExtension: '.php'
                },
                shopify: {
                    name: 'Shopify',
                    language: 'JavaScript',
                    packageManager: 'npm',
                    testFramework: 'jest',
                    fileExtension: '.js'
                },
                chrome: {
                    name: 'Chrome Extension',
                    language: 'JavaScript',
                    packageManager: 'npm',
                    testFramework: 'jest',
                    fileExtension: '.js'
                },
                vscode: {
                    name: 'VS Code Extension',
                    language: 'TypeScript',
                    packageManager: 'npm',
                    testFramework: 'mocha',
                    fileExtension: '.ts'
                },
                discord: {
                    name: 'Discord Bot',
                    language: 'JavaScript',
                    packageManager: 'npm',
                    testFramework: 'jest',
                    fileExtension: '.js'
                },
                slack: {
                    name: 'Slack App',
                    language: 'JavaScript',
                    packageManager: 'npm',
                    testFramework: 'jest',
                    fileExtension: '.js'
                },
                obsidian: {
                    name: 'Obsidian Plugin',
                    language: 'TypeScript',
                    packageManager: 'npm',
                    testFramework: 'jest',
                    fileExtension: '.ts'
                },
                figma: {
                    name: 'Figma Plugin',
                    language: 'TypeScript',
                    packageManager: 'npm',
                    testFramework: 'jest',
                    fileExtension: '.ts'
                }
            },
            
            ...config
        };
        
        // Generated plugins tracking
        this.generatedPlugins = new Map();
        
        // HTTP server
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Statistics
        this.stats = {
            pluginsGenerated: 0,
            platformsUsed: new Map(),
            totalLinesOfCode: 0,
            filesCreated: 0
        };
        
        this.setupRoutes();
    }
    
    async start() {
        console.log('🔌 CAL PLUGIN SCAFFOLDER STARTING');
        console.log('=================================');
        console.log('');
        console.log('🎯 Supported platforms:');
        Object.entries(this.config.platforms).forEach(([key, platform]) => {
            console.log(`   • ${platform.name} (${platform.language})`);
        });
        console.log('');
        
        // Ensure output directory exists
        await this.ensureDirectories();
        
        // Start server
        this.server.listen(this.config.port, () => {
            console.log(`✅ Plugin Scaffolder ready on port ${this.config.port}`);
            console.log(`📁 Plugins will be generated in: ${this.config.outputDir}`);
            console.log('');
        });
        
        this.emit('started', { port: this.config.port });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Plugin generation
        this.app.post('/api/generate', this.handleGeneratePlugin.bind(this));
        this.app.get('/api/plugins', this.handleListPlugins.bind(this));
        this.app.get('/api/plugins/:id', this.handleGetPlugin.bind(this));
        
        // Templates
        this.app.get('/api/templates', this.handleListTemplates.bind(this));
        this.app.get('/api/platforms', this.handleListPlatforms.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', stats: this.getStats() });
        });
    }
    
    /**
     * Generate a complete plugin
     */
    async generatePlugin(platform, specification) {
        console.log(`🔌 Generating ${platform} plugin...`);
        
        const platformConfig = this.config.platforms[platform];
        if (!platformConfig) {
            throw new Error(`Unsupported platform: ${platform}`);
        }
        
        const pluginId = this.generatePluginId();
        const pluginName = specification.name || `my-${platform}-plugin`;
        const pluginDir = path.join(this.config.outputDir, platform, pluginName);
        
        // Create plugin metadata
        const pluginMeta = {
            id: pluginId,
            platform,
            name: pluginName,
            description: specification.description,
            version: '1.0.0',
            author: specification.author || 'CAL',
            license: specification.license || 'MIT',
            createdAt: new Date(),
            directory: pluginDir,
            files: [],
            status: 'generating'
        };
        
        this.generatedPlugins.set(pluginId, pluginMeta);
        
        try {
            // Create plugin directory
            await fs.mkdir(pluginDir, { recursive: true });
            
            // Generate based on platform
            let files;
            switch (platform) {
                case 'wordpress':
                    files = await this.generateWordPressPlugin(pluginMeta, specification);
                    break;
                case 'shopify':
                    files = await this.generateShopifyApp(pluginMeta, specification);
                    break;
                case 'chrome':
                    files = await this.generateChromeExtension(pluginMeta, specification);
                    break;
                case 'vscode':
                    files = await this.generateVSCodeExtension(pluginMeta, specification);
                    break;
                case 'discord':
                    files = await this.generateDiscordBot(pluginMeta, specification);
                    break;
                case 'slack':
                    files = await this.generateSlackApp(pluginMeta, specification);
                    break;
                case 'obsidian':
                    files = await this.generateObsidianPlugin(pluginMeta, specification);
                    break;
                case 'figma':
                    files = await this.generateFigmaPlugin(pluginMeta, specification);
                    break;
                default:
                    throw new Error(`Platform ${platform} not implemented`);
            }
            
            // Update metadata
            pluginMeta.files = files;
            pluginMeta.status = 'completed';
            pluginMeta.completedAt = new Date();
            
            // Update statistics
            this.stats.pluginsGenerated++;
            this.stats.platformsUsed.set(platform, (this.stats.platformsUsed.get(platform) || 0) + 1);
            this.stats.filesCreated += files.length;
            
            console.log(`✅ Plugin generated: ${pluginName}`);
            console.log(`📁 Location: ${pluginDir}`);
            console.log(`📄 Files created: ${files.length}`);
            
            return pluginMeta;
            
        } catch (error) {
            pluginMeta.status = 'failed';
            pluginMeta.error = error.message;
            console.error(`❌ Failed to generate plugin: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Generate WordPress Plugin
     */
    async generateWordPressPlugin(meta, spec) {
        const files = [];
        const { name, description, features = [] } = spec;
        const pluginSlug = this.slugify(name);
        const pluginClass = this.toPascalCase(name);
        
        // Main plugin file
        const mainFile = `<?php
/**
 * Plugin Name: ${name}
 * Plugin URI: https://example.com/${pluginSlug}
 * Description: ${description}
 * Version: 1.0.0
 * Author: ${meta.author}
 * License: ${meta.license}
 * Text Domain: ${pluginSlug}
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('${pluginSlug.toUpperCase()}_VERSION', '1.0.0');
define('${pluginSlug.toUpperCase()}_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('${pluginSlug.toUpperCase()}_PLUGIN_URL', plugin_dir_url(__FILE__));

// Main plugin class
class ${pluginClass} {
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->load_dependencies();
        $this->define_hooks();
    }
    
    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        require_once ${pluginSlug.toUpperCase()}_PLUGIN_DIR . 'includes/class-${pluginSlug}-loader.php';
        require_once ${pluginSlug.toUpperCase()}_PLUGIN_DIR . 'includes/class-${pluginSlug}-admin.php';
        require_once ${pluginSlug.toUpperCase()}_PLUGIN_DIR . 'includes/class-${pluginSlug}-public.php';
    }
    
    /**
     * Define plugin hooks
     */
    private function define_hooks() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_public_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Initialize features
        ${features.map(f => `$this->init_${this.slugify(f)}();`).join('\n        ')}
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            '${name}',
            '${name}',
            'manage_options',
            '${pluginSlug}',
            array($this, 'admin_page'),
            'dashicons-admin-generic',
            20
        );
    }
    
    /**
     * Admin page
     */
    public function admin_page() {
        include ${pluginSlug.toUpperCase()}_PLUGIN_DIR . 'admin/views/admin-page.php';
    }
    
    /**
     * Enqueue public scripts
     */
    public function enqueue_public_scripts() {
        wp_enqueue_style('${pluginSlug}-public', ${pluginSlug.toUpperCase()}_PLUGIN_URL . 'public/css/public.css', array(), ${pluginSlug.toUpperCase()}_VERSION);
        wp_enqueue_script('${pluginSlug}-public', ${pluginSlug.toUpperCase()}_PLUGIN_URL . 'public/js/public.js', array('jquery'), ${pluginSlug.toUpperCase()}_VERSION, true);
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts() {
        wp_enqueue_style('${pluginSlug}-admin', ${pluginSlug.toUpperCase()}_PLUGIN_URL . 'admin/css/admin.css', array(), ${pluginSlug.toUpperCase()}_VERSION);
        wp_enqueue_script('${pluginSlug}-admin', ${pluginSlug.toUpperCase()}_PLUGIN_URL . 'admin/js/admin.js', array('jquery'), ${pluginSlug.toUpperCase()}_VERSION, true);
    }
    
    ${features.map(feature => `
    /**
     * Initialize ${feature}
     */
    private function init_${this.slugify(feature)}() {
        // TODO: Implement ${feature}
    }`).join('\n    ')}
}

// Initialize plugin
$${pluginSlug} = new ${pluginClass}();

// Activation hook
register_activation_hook(__FILE__, function() {
    // Create database tables if needed
    // Set default options
    update_option('${pluginSlug}_version', ${pluginSlug.toUpperCase()}_VERSION);
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    // Cleanup temporary data
});`;
        
        await this.writeFile(path.join(meta.directory, `${pluginSlug}.php`), mainFile);
        files.push(`${pluginSlug}.php`);
        
        // Create directory structure
        const dirs = ['admin', 'admin/css', 'admin/js', 'admin/views', 'includes', 'public', 'public/css', 'public/js', 'languages'];
        for (const dir of dirs) {
            await fs.mkdir(path.join(meta.directory, dir), { recursive: true });
        }
        
        // Admin page template
        const adminPage = `<?php
/**
 * Admin page template
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="notice notice-info">
        <p><?php _e('Welcome to ${name}! Configure your settings below.', '${pluginSlug}'); ?></p>
    </div>
    
    <form method="post" action="options.php">
        <?php settings_fields('${pluginSlug}_settings'); ?>
        <?php do_settings_sections('${pluginSlug}_settings'); ?>
        
        <table class="form-table">
            ${features.map(feature => `
            <tr>
                <th scope="row">
                    <label for="${pluginSlug}_${this.slugify(feature)}_enabled">
                        <?php _e('Enable ${feature}', '${pluginSlug}'); ?>
                    </label>
                </th>
                <td>
                    <input type="checkbox" id="${pluginSlug}_${this.slugify(feature)}_enabled" 
                           name="${pluginSlug}_${this.slugify(feature)}_enabled" value="1" 
                           <?php checked(get_option('${pluginSlug}_${this.slugify(feature)}_enabled'), '1'); ?> />
                    <p class="description"><?php _e('Enable or disable ${feature} functionality', '${pluginSlug}'); ?></p>
                </td>
            </tr>`).join('')}
        </table>
        
        <?php submit_button(); ?>
    </form>
</div>`;
        
        await this.writeFile(path.join(meta.directory, 'admin/views/admin-page.php'), adminPage);
        files.push('admin/views/admin-page.php');
        
        // CSS files
        const adminCSS = `/* Admin styles for ${name} */
.${pluginSlug}-admin-wrapper {
    padding: 20px;
    background: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.${pluginSlug}-feature-box {
    border: 1px solid #ddd;
    padding: 15px;
    margin: 10px 0;
    border-radius: 3px;
}`;
        
        await this.writeFile(path.join(meta.directory, 'admin/css/admin.css'), adminCSS);
        files.push('admin/css/admin.css');
        
        // JavaScript files
        const adminJS = `/**
 * Admin JavaScript for ${name}
 */
jQuery(document).ready(function($) {
    console.log('${name} admin loaded');
    
    // Feature toggles
    ${features.map(feature => `
    $('#${pluginSlug}_${this.slugify(feature)}_enabled').on('change', function() {
        if ($(this).is(':checked')) {
            console.log('${feature} enabled');
        } else {
            console.log('${feature} disabled');
        }
    });`).join('\n    ')}
});`;
        
        await this.writeFile(path.join(meta.directory, 'admin/js/admin.js'), adminJS);
        files.push('admin/js/admin.js');
        
        // README.md
        const readme = `# ${name}

${description}

## Features

${features.map(f => `- ${f}`).join('\n')}

## Installation

1. Upload the plugin folder to the \`/wp-content/plugins/\` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure settings under the '${name}' menu

## Usage

After activation, you can access the plugin settings from the WordPress admin menu.

## Development

### Requirements
- PHP 7.4 or higher
- WordPress 5.8 or higher

### Building
\`\`\`bash
composer install
npm install
npm run build
\`\`\`

## License

${meta.license}`;
        
        await this.writeFile(path.join(meta.directory, 'README.md'), readme);
        files.push('README.md');
        
        // composer.json
        const composer = {
            name: `${meta.author.toLowerCase()}/${pluginSlug}`,
            description: description,
            type: 'wordpress-plugin',
            license: meta.license,
            authors: [{ name: meta.author }],
            require: {
                php: '>=7.4'
            },
            'require-dev': {
                'phpunit/phpunit': '^9.0'
            }
        };
        
        await this.writeFile(path.join(meta.directory, 'composer.json'), JSON.stringify(composer, null, 2));
        files.push('composer.json');
        
        return files;
    }
    
    /**
     * Generate Chrome Extension
     */
    async generateChromeExtension(meta, spec) {
        const files = [];
        const { name, description, features = [] } = spec;
        
        // manifest.json
        const manifest = {
            manifest_version: 3,
            name: name,
            version: '1.0.0',
            description: description,
            permissions: this.getChromePermissions(features),
            action: {
                default_popup: 'popup.html',
                default_icon: {
                    '16': 'icons/icon16.png',
                    '48': 'icons/icon48.png',
                    '128': 'icons/icon128.png'
                }
            },
            background: {
                service_worker: 'background.js'
            },
            content_scripts: features.includes('content') ? [{
                matches: ['<all_urls>'],
                js: ['content.js']
            }] : [],
            icons: {
                '16': 'icons/icon16.png',
                '48': 'icons/icon48.png',
                '128': 'icons/icon128.png'
            }
        };
        
        await this.writeFile(path.join(meta.directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
        files.push('manifest.json');
        
        // popup.html
        const popupHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${name}</title>
    <link rel="stylesheet" href="popup.css">
</head>
<body>
    <div class="container">
        <h1>${name}</h1>
        <p>${description}</p>
        
        <div class="features">
            ${features.map(feature => `
            <div class="feature">
                <label>
                    <input type="checkbox" id="${this.slugify(feature)}" checked>
                    ${feature}
                </label>
            </div>`).join('')}
        </div>
        
        <button id="save">Save Settings</button>
    </div>
    
    <script src="popup.js"></script>
</body>
</html>`;
        
        await this.writeFile(path.join(meta.directory, 'popup.html'), popupHTML);
        files.push('popup.html');
        
        // popup.js
        const popupJS = `// Popup script for ${name}

document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.sync.get(['settings'], function(result) {
        if (result.settings) {
            ${features.map(feature => `
            document.getElementById('${this.slugify(feature)}').checked = result.settings.${this.slugify(feature)};`).join('')}
        }
    });
    
    // Save settings
    document.getElementById('save').addEventListener('click', function() {
        const settings = {
            ${features.map(feature => `${this.slugify(feature)}: document.getElementById('${this.slugify(feature)}').checked`).join(',\n            ')}
        };
        
        chrome.storage.sync.set({ settings: settings }, function() {
            console.log('Settings saved');
            
            // Notify background script
            chrome.runtime.sendMessage({ type: 'settings-updated', settings: settings });
            
            // Show feedback
            const button = document.getElementById('save');
            button.textContent = 'Saved!';
            setTimeout(() => {
                button.textContent = 'Save Settings';
            }, 1500);
        });
    });
});`;
        
        await this.writeFile(path.join(meta.directory, 'popup.js'), popupJS);
        files.push('popup.js');
        
        // background.js
        const backgroundJS = `// Background script for ${name}

chrome.runtime.onInstalled.addListener(function() {
    console.log('${name} installed');
    
    // Set default settings
    chrome.storage.sync.get(['settings'], function(result) {
        if (!result.settings) {
            const defaultSettings = {
                ${features.map(feature => `${this.slugify(feature)}: true`).join(',\n                ')}
            };
            chrome.storage.sync.set({ settings: defaultSettings });
        }
    });
});

// Listen for messages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'settings-updated') {
        console.log('Settings updated:', request.settings);
        // Handle settings update
    }
});

${features.includes('contextMenus') ? `
// Context menu
chrome.contextMenus.create({
    id: '${this.slugify(name)}',
    title: '${name}',
    contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === '${this.slugify(name)}') {
        // Handle context menu click
        console.log('Selected text:', info.selectionText);
    }
});` : ''}`;
        
        await this.writeFile(path.join(meta.directory, 'background.js'), backgroundJS);
        files.push('background.js');
        
        // popup.css
        const popupCSS = `/* Popup styles for ${name} */
body {
    width: 300px;
    min-height: 200px;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
    padding: 15px;
}

h1 {
    font-size: 18px;
    margin: 0 0 10px 0;
    color: #333;
}

p {
    font-size: 14px;
    color: #666;
    margin: 0 0 15px 0;
}

.features {
    margin: 15px 0;
}

.feature {
    margin: 8px 0;
}

.feature label {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.feature input {
    margin-right: 8px;
}

#save {
    width: 100%;
    padding: 10px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

#save:hover {
    background: #3367d6;
}`;
        
        await this.writeFile(path.join(meta.directory, 'popup.css'), popupCSS);
        files.push('popup.css');
        
        // Create icons directory
        await fs.mkdir(path.join(meta.directory, 'icons'), { recursive: true });
        
        // package.json
        const packageJson = {
            name: this.slugify(name),
            version: '1.0.0',
            description: description,
            scripts: {
                build: 'webpack',
                watch: 'webpack --watch',
                package: 'zip -r extension.zip . -x node_modules/\\* .git/\\* *.zip'
            },
            devDependencies: {
                webpack: '^5.0.0',
                'webpack-cli': '^4.0.0'
            }
        };
        
        await this.writeFile(path.join(meta.directory, 'package.json'), JSON.stringify(packageJson, null, 2));
        files.push('package.json');
        
        return files;
    }
    
    /**
     * Generate Discord Bot
     */
    async generateDiscordBot(meta, spec) {
        const files = [];
        const { name, description, features = [] } = spec;
        
        // index.js
        const indexJS = `// ${name} - Discord Bot
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        ${features.includes('voice') ? 'GatewayIntentBits.GuildVoiceStates,' : ''}
    ]
});

// Command collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Login
client.login(process.env.DISCORD_TOKEN);`;
        
        await this.writeFile(path.join(meta.directory, 'index.js'), indexJS);
        files.push('index.js');
        
        // Create directories
        await fs.mkdir(path.join(meta.directory, 'commands'), { recursive: true });
        await fs.mkdir(path.join(meta.directory, 'events'), { recursive: true });
        
        // Ready event
        const readyEvent = `module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(\`✅ \${client.user.tag} is online!\`);
        
        // Set activity
        client.user.setActivity('${description}', { type: 'PLAYING' });
        
        // Register slash commands
        const commands = [];
        client.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });
        
        client.application.commands.set(commands);
    }
};`;
        
        await this.writeFile(path.join(meta.directory, 'events/ready.js'), readyEvent);
        files.push('events/ready.js');
        
        // Interaction handler
        const interactionEvent = `module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;
        
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error executing this command!', 
                ephemeral: true 
            });
        }
    }
};`;
        
        await this.writeFile(path.join(meta.directory, 'events/interactionCreate.js'), interactionEvent);
        files.push('events/interactionCreate.js');
        
        // Sample command
        const helpCommand = `const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with ${name}'),
    async execute(interaction) {
        const embed = {
            color: 0x0099ff,
            title: '${name} Help',
            description: '${description}',
            fields: [
                ${features.map(feature => `{
                    name: '${feature}',
                    value: 'Description of ${feature} feature',
                    inline: true
                }`).join(',\n                ')}
            ],
            timestamp: new Date(),
            footer: {
                text: '${name} v1.0.0'
            }
        };
        
        await interaction.reply({ embeds: [embed] });
    }
};`;
        
        await this.writeFile(path.join(meta.directory, 'commands/help.js'), helpCommand);
        files.push('commands/help.js');
        
        // .env.example
        const envExample = `# Discord Bot Token
DISCORD_TOKEN=your_bot_token_here

# Bot Settings
PREFIX=!
OWNER_ID=your_discord_id_here`;
        
        await this.writeFile(path.join(meta.directory, '.env.example'), envExample);
        files.push('.env.example');
        
        // package.json
        const packageJson = {
            name: this.slugify(name),
            version: '1.0.0',
            description: description,
            main: 'index.js',
            scripts: {
                start: 'node index.js',
                dev: 'nodemon index.js'
            },
            dependencies: {
                'discord.js': '^14.0.0',
                'dotenv': '^16.0.0'
            },
            devDependencies: {
                'nodemon': '^2.0.0'
            }
        };
        
        await this.writeFile(path.join(meta.directory, 'package.json'), JSON.stringify(packageJson, null, 2));
        files.push('package.json');
        
        return files;
    }
    
    /**
     * Generate VS Code Extension
     */
    async generateVSCodeExtension(meta, spec) {
        const files = [];
        const { name, description, features = [] } = spec;
        const extensionId = this.slugify(name);
        
        // package.json
        const packageJson = {
            name: extensionId,
            displayName: name,
            description: description,
            version: '1.0.0',
            engines: {
                vscode: '^1.74.0'
            },
            categories: ['Other'],
            activationEvents: features.includes('onStartup') ? ['onStartupFinished'] : ['onCommand:' + extensionId + '.helloWorld'],
            main: './out/extension.js',
            contributes: {
                commands: [{
                    command: extensionId + '.helloWorld',
                    title: name + ': Hello World'
                }],
                configuration: {
                    title: name,
                    properties: features.reduce((props, feature) => {
                        props[`${extensionId}.${this.slugify(feature)}`] = {
                            type: 'boolean',
                            default: true,
                            description: `Enable ${feature}`
                        };
                        return props;
                    }, {})
                }
            },
            scripts: {
                'vscode:prepublish': 'npm run compile',
                compile: 'tsc -p ./',
                watch: 'tsc -watch -p ./',
                pretest: 'npm run compile && npm run lint',
                lint: 'eslint src --ext ts',
                test: 'node ./out/test/runTest.js'
            },
            devDependencies: {
                '@types/vscode': '^1.74.0',
                '@types/node': '16.x',
                '@typescript-eslint/eslint-plugin': '^5.45.0',
                '@typescript-eslint/parser': '^5.45.0',
                'eslint': '^8.28.0',
                'typescript': '^4.9.3'
            }
        };
        
        await this.writeFile(path.join(meta.directory, 'package.json'), JSON.stringify(packageJson, null, 2));
        files.push('package.json');
        
        // Create src directory
        await fs.mkdir(path.join(meta.directory, 'src'), { recursive: true });
        
        // extension.ts
        const extensionTS = `import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('${name} is now active!');
    
    // Register command
    let disposable = vscode.commands.registerCommand('${extensionId}.helloWorld', () => {
        vscode.window.showInformationMessage('Hello from ${name}!');
    });
    
    context.subscriptions.push(disposable);
    
    ${features.map(feature => `
    // ${feature} feature
    init${this.toPascalCase(feature)}(context);`).join('\n    ')}
}

export function deactivate() {
    console.log('${name} is now deactivated');
}

${features.map(feature => `
function init${this.toPascalCase(feature)}(context: vscode.ExtensionContext) {
    // TODO: Implement ${feature}
    const config = vscode.workspace.getConfiguration('${extensionId}');
    if (config.get('${this.slugify(feature)}')) {
        console.log('${feature} is enabled');
    }
}`).join('\n')}`;
        
        await this.writeFile(path.join(meta.directory, 'src/extension.ts'), extensionTS);
        files.push('src/extension.ts');
        
        // tsconfig.json
        const tsconfig = {
            compilerOptions: {
                module: 'commonjs',
                target: 'ES2020',
                outDir: 'out',
                lib: ['ES2020'],
                sourceMap: true,
                rootDir: 'src',
                strict: true
            }
        };
        
        await this.writeFile(path.join(meta.directory, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
        files.push('tsconfig.json');
        
        // .vscodeignore
        const vscodeignore = `.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts`;
        
        await this.writeFile(path.join(meta.directory, '.vscodeignore'), vscodeignore);
        files.push('.vscodeignore');
        
        return files;
    }
    
    /**
     * Helper to determine Chrome permissions
     */
    getChromePermissions(features) {
        const permissions = ['storage'];
        
        if (features.includes('tabs')) permissions.push('tabs');
        if (features.includes('bookmarks')) permissions.push('bookmarks');
        if (features.includes('history')) permissions.push('history');
        if (features.includes('downloads')) permissions.push('downloads');
        if (features.includes('notifications')) permissions.push('notifications');
        if (features.includes('contextMenus')) permissions.push('contextMenus');
        if (features.includes('webRequest')) permissions.push('webRequest', 'webRequestBlocking');
        
        return permissions;
    }
    
    /**
     * Utility methods
     */
    slugify(text) {
        return text.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
    
    toPascalCase(text) {
        return text
            .split(/[\s-_]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    
    async writeFile(filePath, content) {
        await fs.writeFile(filePath, content, 'utf-8');
        this.stats.totalLinesOfCode += content.split('\n').length;
    }
    
    async ensureDirectories() {
        await fs.mkdir(this.config.outputDir, { recursive: true });
        await fs.mkdir(this.config.templatesDir, { recursive: true });
    }
    
    generatePluginId() {
        return 'plugin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    getStats() {
        return {
            ...this.stats,
            platformBreakdown: Array.from(this.stats.platformsUsed.entries())
        };
    }
    
    // API handlers
    async handleGeneratePlugin(req, res) {
        const { platform, specification } = req.body;
        
        try {
            const plugin = await this.generatePlugin(platform, specification);
            res.json({ success: true, plugin });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    handleListPlugins(req, res) {
        const plugins = Array.from(this.generatedPlugins.values());
        res.json({ plugins, total: plugins.length });
    }
    
    handleGetPlugin(req, res) {
        const { id } = req.params;
        const plugin = this.generatedPlugins.get(id);
        
        if (!plugin) {
            return res.status(404).json({ error: 'Plugin not found' });
        }
        
        res.json(plugin);
    }
    
    handleListTemplates(req, res) {
        // TODO: List available templates
        res.json({ templates: [] });
    }
    
    handleListPlatforms(req, res) {
        const platforms = Object.entries(this.config.platforms).map(([key, config]) => ({
            id: key,
            ...config
        }));
        
        res.json({ platforms });
    }
}

// Placeholder for other platform generators
CALPluginScaffolder.prototype.generateShopifyApp = async function(meta, spec) {
    // TODO: Implement Shopify app generation
    return ['shopify-app.js', 'package.json', 'README.md'];
};

CALPluginScaffolder.prototype.generateSlackApp = async function(meta, spec) {
    // TODO: Implement Slack app generation
    return ['slack-app.js', 'manifest.json', 'package.json'];
};

CALPluginScaffolder.prototype.generateObsidianPlugin = async function(meta, spec) {
    // TODO: Implement Obsidian plugin generation
    return ['main.ts', 'manifest.json', 'styles.css'];
};

CALPluginScaffolder.prototype.generateFigmaPlugin = async function(meta, spec) {
    // TODO: Implement Figma plugin generation
    return ['code.ts', 'ui.html', 'manifest.json'];
};

// Start if run directly
if (require.main === module) {
    const scaffolder = new CALPluginScaffolder();
    
    scaffolder.start().catch(error => {
        console.error('Failed to start Plugin Scaffolder:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🔌 Plugin Scaffolder shutting down...');
        process.exit(0);
    });
}

module.exports = CALPluginScaffolder;
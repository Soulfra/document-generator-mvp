/**
 * Dynamic Skinning and Theme Engine
 * Supports multiple brand skins with hot-swapping capabilities
 * Includes theme marketplace and A/B testing features
 */

const express = require('express');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class SkinThemeEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Theme engine configuration
    this.config = {
      // Theme management
      themes: {
        defaultTheme: 'docgen-classic',
        allowCustomThemes: true,
        hotSwapping: true,
        cacheThemes: true,
        
        // Built-in themes
        builtIn: {
          'docgen-classic': {
            name: 'DocGen Classic',
            description: 'Clean and professional default theme',
            author: 'DocGen Team',
            version: '1.0.0'
          },
          'docgen-dark': {
            name: 'DocGen Dark',
            description: 'Modern dark theme for night owls',
            author: 'DocGen Team',
            version: '1.0.0'
          },
          'apple-inspired': {
            name: 'Apple Inspired',
            description: 'Minimalist design inspired by Apple',
            author: 'DocGen Team',
            version: '1.0.0'
          },
          'shopify-polaris': {
            name: 'Shopify Polaris Style',
            description: 'E-commerce focused design system',
            author: 'DocGen Team',
            version: '1.0.0'
          },
          'developer-focused': {
            name: 'Developer Focused',
            description: 'Code-first design with syntax highlighting',
            author: 'DocGen Team',
            version: '1.0.0'
          }
        }
      },
      
      // Skinning capabilities
      skinning: {
        elements: {
          colors: ['primary', 'secondary', 'background', 'text', 'borders'],
          typography: ['headings', 'body', 'code', 'captions'],
          spacing: ['compact', 'comfortable', 'spacious'],
          components: ['buttons', 'forms', 'cards', 'navigation'],
          animations: ['subtle', 'smooth', 'energetic', 'disabled']
        },
        
        // CSS injection points
        injectionPoints: {
          global: 'Global styles affecting entire application',
          header: 'Navigation and header customization',
          content: 'Main content area styling',
          sidebar: 'Sidebar and menu styling',
          footer: 'Footer customization',
          custom: 'Custom CSS injection'
        },
        
        // JavaScript capabilities
        jsCapabilities: {
          animations: true,
          interactions: true,
          customComponents: true,
          hooks: ['beforeThemeLoad', 'afterThemeLoad', 'onThemeChange']
        }
      },
      
      // Theme marketplace
      marketplace: {
        enabled: true,
        categories: ['Professional', 'Creative', 'Minimal', 'Bold', 'Industry-Specific'],
        monetization: {
          free: true,
          premium: true,
          subscriptions: true,
          revenueSplit: { creator: 70, platform: 30 }
        },
        
        submission: {
          review: true,
          guidelines: true,
          testing: true,
          certification: true
        }
      },
      
      // A/B testing
      abTesting: {
        enabled: true,
        maxVariants: 5,
        metrics: ['engagement', 'conversion', 'retention', 'satisfaction'],
        
        segmentation: {
          byUser: true,
          bySession: true,
          byGeography: true,
          byDevice: true
        }
      },
      
      // Performance
      performance: {
        lazyLoading: true,
        cssOptimization: true,
        caching: true,
        cdnIntegration: true
      }
    };
    
    // Theme storage
    this.themes = {
      installed: new Map(),      // Installed themes
      active: new Map(),         // Active themes per domain
      custom: new Map(),         // User customizations
      marketplace: new Map(),    // Available marketplace themes
      cache: new Map()          // Compiled theme cache
    };
    
    // A/B testing state
    this.abTests = {
      active: new Map(),        // Active A/B tests
      results: new Map(),       // Test results
      assignments: new Map()    // User/session assignments
    };
    
    // Express app for theme serving
    this.app = express();
    this.server = null;
    
    console.log('🎨 Skin Theme Engine initializing...');
  }
  
  /**
   * Initialize the theme engine
   */
  async initialize() {
    try {
      console.log('🚀 Starting Skin Theme Engine...');
      
      // Setup web interface
      await this.setupWebInterface();
      
      // Load built-in themes
      await this.loadBuiltInThemes();
      
      // Initialize marketplace
      await this.initializeMarketplace();
      
      // Setup A/B testing
      await this.setupABTesting();
      
      // Start server
      await this.startServer();
      
      console.log('✅ Skin Theme Engine ready');
      this.emit('theme_engine_ready');
      
      return true;
      
    } catch (error) {
      console.error('❌ Theme engine initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Setup web interface routes
   */
  async setupWebInterface() {
    // Middleware
    this.app.use(express.json());
    
    // Serve theme CSS
    this.app.get('/theme/:domain/:themeId/styles.css', async (req, res) => {
      const css = await this.getThemeCSS(req.params.domain, req.params.themeId);
      res.type('text/css');
      res.send(css);
    });
    
    // Serve theme JavaScript
    this.app.get('/theme/:domain/:themeId/script.js', async (req, res) => {
      const js = await this.getThemeJS(req.params.domain, req.params.themeId);
      res.type('application/javascript');
      res.send(js);
    });
    
    // Theme preview
    this.app.get('/preview/:themeId', (req, res) => {
      const preview = this.generateThemePreview(req.params.themeId);
      res.send(preview);
    });
    
    // Theme marketplace
    this.app.get('/marketplace', (req, res) => {
      res.send(this.generateMarketplacePage());
    });
    
    // Apply theme
    this.app.post('/apply/:domain/:themeId', async (req, res) => {
      const result = await this.applyTheme(req.params.domain, req.params.themeId, req.body);
      res.json(result);
    });
    
    // Create custom theme
    this.app.post('/create', async (req, res) => {
      const theme = await this.createCustomTheme(req.body);
      res.json(theme);
    });
    
    // A/B test endpoint
    this.app.get('/ab/:testId/:userId', (req, res) => {
      const variant = this.getABTestVariant(req.params.testId, req.params.userId);
      res.json(variant);
    });
    
    // Theme editor
    this.app.get('/editor', (req, res) => {
      res.send(this.generateThemeEditor());
    });
  }
  
  /**
   * Get theme CSS for a domain
   */
  async getThemeCSS(domain, themeId) {
    // Check cache first
    const cacheKey = `${domain}:${themeId}:css`;
    if (this.themes.cache.has(cacheKey)) {
      return this.themes.cache.get(cacheKey);
    }
    
    // Get theme configuration
    const theme = await this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }
    
    // Generate CSS
    const css = this.generateThemeCSS(theme, domain);
    
    // Cache if enabled
    if (this.config.performance.caching) {
      this.themes.cache.set(cacheKey, css);
    }
    
    return css;
  }
  
  /**
   * Generate theme CSS
   */
  generateThemeCSS(theme, domain) {
    const { colors, typography, spacing, components, custom } = theme;
    
    return `
/* Theme: ${theme.name} v${theme.version} */
/* Generated for: ${domain} */

:root {
  /* Color Palette */
  --theme-primary: ${colors.primary};
  --theme-primary-light: ${colors.primaryLight};
  --theme-primary-dark: ${colors.primaryDark};
  --theme-secondary: ${colors.secondary};
  --theme-secondary-light: ${colors.secondaryLight};
  --theme-secondary-dark: ${colors.secondaryDark};
  
  --theme-background: ${colors.background};
  --theme-surface: ${colors.surface};
  --theme-surface-variant: ${colors.surfaceVariant};
  
  --theme-text-primary: ${colors.textPrimary};
  --theme-text-secondary: ${colors.textSecondary};
  --theme-text-disabled: ${colors.textDisabled};
  
  --theme-border: ${colors.border};
  --theme-divider: ${colors.divider};
  
  --theme-success: ${colors.success};
  --theme-warning: ${colors.warning};
  --theme-error: ${colors.error};
  --theme-info: ${colors.info};
  
  /* Typography */
  --theme-font-primary: ${typography.fontPrimary};
  --theme-font-secondary: ${typography.fontSecondary};
  --theme-font-mono: ${typography.fontMono};
  
  --theme-font-size-xs: ${typography.sizes.xs};
  --theme-font-size-sm: ${typography.sizes.sm};
  --theme-font-size-md: ${typography.sizes.md};
  --theme-font-size-lg: ${typography.sizes.lg};
  --theme-font-size-xl: ${typography.sizes.xl};
  --theme-font-size-2xl: ${typography.sizes['2xl']};
  --theme-font-size-3xl: ${typography.sizes['3xl']};
  
  --theme-font-weight-light: ${typography.weights.light};
  --theme-font-weight-regular: ${typography.weights.regular};
  --theme-font-weight-medium: ${typography.weights.medium};
  --theme-font-weight-bold: ${typography.weights.bold};
  
  --theme-line-height-tight: ${typography.lineHeights.tight};
  --theme-line-height-normal: ${typography.lineHeights.normal};
  --theme-line-height-relaxed: ${typography.lineHeights.relaxed};
  
  /* Spacing */
  --theme-spacing-unit: ${spacing.unit}px;
  --theme-spacing-xs: calc(var(--theme-spacing-unit) * 0.5);
  --theme-spacing-sm: var(--theme-spacing-unit);
  --theme-spacing-md: calc(var(--theme-spacing-unit) * 2);
  --theme-spacing-lg: calc(var(--theme-spacing-unit) * 3);
  --theme-spacing-xl: calc(var(--theme-spacing-unit) * 4);
  --theme-spacing-2xl: calc(var(--theme-spacing-unit) * 6);
  --theme-spacing-3xl: calc(var(--theme-spacing-unit) * 8);
  
  /* Border Radius */
  --theme-radius-sm: ${spacing.radius.sm};
  --theme-radius-md: ${spacing.radius.md};
  --theme-radius-lg: ${spacing.radius.lg};
  --theme-radius-full: ${spacing.radius.full};
  
  /* Shadows */
  --theme-shadow-sm: ${components.shadows.sm};
  --theme-shadow-md: ${components.shadows.md};
  --theme-shadow-lg: ${components.shadows.lg};
  --theme-shadow-xl: ${components.shadows.xl};
  
  /* Transitions */
  --theme-transition-fast: 150ms ease-in-out;
  --theme-transition-normal: 250ms ease-in-out;
  --theme-transition-slow: 350ms ease-in-out;
}

/* Global Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--theme-font-primary);
  font-size: var(--theme-font-size-md);
  line-height: var(--theme-line-height-normal);
  color: var(--theme-text-primary);
  background-color: var(--theme-background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  margin-top: 0;
  margin-bottom: var(--theme-spacing-md);
  font-weight: var(--theme-font-weight-bold);
  line-height: var(--theme-line-height-tight);
}

h1 { font-size: var(--theme-font-size-3xl); }
h2 { font-size: var(--theme-font-size-2xl); }
h3 { font-size: var(--theme-font-size-xl); }
h4 { font-size: var(--theme-font-size-lg); }
h5 { font-size: var(--theme-font-size-md); }
h6 { font-size: var(--theme-font-size-sm); }

p {
  margin-top: 0;
  margin-bottom: var(--theme-spacing-md);
}

a {
  color: var(--theme-primary);
  text-decoration: none;
  transition: color var(--theme-transition-fast);
}

a:hover {
  color: var(--theme-primary-dark);
  text-decoration: underline;
}

code {
  font-family: var(--theme-font-mono);
  font-size: 0.875em;
  padding: 0.125em 0.25em;
  background-color: var(--theme-surface-variant);
  border-radius: var(--theme-radius-sm);
}

pre {
  margin: 0 0 var(--theme-spacing-md);
  padding: var(--theme-spacing-md);
  background-color: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-md);
  overflow-x: auto;
}

pre code {
  padding: 0;
  background-color: transparent;
}

/* Components */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--theme-spacing-sm) var(--theme-spacing-lg);
  font-family: inherit;
  font-size: var(--theme-font-size-md);
  font-weight: var(--theme-font-weight-medium);
  line-height: 1;
  color: white;
  background-color: var(--theme-primary);
  border: none;
  border-radius: var(--theme-radius-md);
  cursor: pointer;
  transition: all var(--theme-transition-fast);
}

.button:hover {
  background-color: var(--theme-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--theme-shadow-md);
}

.button:active {
  transform: translateY(0);
  box-shadow: var(--theme-shadow-sm);
}

.button--secondary {
  color: var(--theme-primary);
  background-color: transparent;
  border: 1px solid var(--theme-primary);
}

.button--secondary:hover {
  color: white;
  background-color: var(--theme-primary);
}

.card {
  padding: var(--theme-spacing-lg);
  background-color: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-lg);
  box-shadow: var(--theme-shadow-sm);
  transition: box-shadow var(--theme-transition-fast);
}

.card:hover {
  box-shadow: var(--theme-shadow-md);
}

.input {
  width: 100%;
  padding: var(--theme-spacing-sm) var(--theme-spacing-md);
  font-family: inherit;
  font-size: var(--theme-font-size-md);
  color: var(--theme-text-primary);
  background-color: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-radius-md);
  transition: border-color var(--theme-transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--theme-primary);
}

/* Custom CSS */
${custom?.css || ''}

/* Responsive */
@media (max-width: 768px) {
  :root {
    --theme-font-size-3xl: 2rem;
    --theme-font-size-2xl: 1.5rem;
    --theme-font-size-xl: 1.25rem;
  }
}

@media (prefers-color-scheme: dark) {
  ${theme.darkModeOverrides ? this.generateDarkModeCSS(theme) : ''}
}

/* Animations */
${components.animations?.enabled ? this.generateAnimationCSS(theme) : ''}
    `.trim();
  }
  
  /**
   * Get theme JavaScript
   */
  async getThemeJS(domain, themeId) {
    const theme = await this.getTheme(themeId);
    if (!theme || !theme.javascript) {
      return '// No custom JavaScript for this theme';
    }
    
    return `
// Theme JavaScript: ${theme.name}
(function() {
  'use strict';
  
  // Theme configuration
  const theme = ${JSON.stringify({
    id: theme.id,
    name: theme.name,
    version: theme.version,
    domain: domain
  })};
  
  // Theme API
  window.DocGenTheme = {
    // Get theme variable
    getVar: function(name) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-' + name).trim();
    },
    
    // Set theme variable
    setVar: function(name, value) {
      document.documentElement.style.setProperty('--theme-' + name, value);
    },
    
    // Switch theme
    switch: async function(newThemeId) {
      const response = await fetch('/apply/' + theme.domain + '/' + newThemeId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        window.location.reload();
      }
    },
    
    // Get current theme
    current: function() {
      return theme;
    }
  };
  
  // Custom theme JavaScript
  ${theme.javascript || ''}
  
  // Fire theme loaded event
  window.dispatchEvent(new CustomEvent('themeLoaded', { detail: theme }));
})();
    `.trim();
  }
  
  /**
   * Generate theme preview
   */
  generateThemePreview(themeId) {
    const theme = this.themes.installed.get(themeId) || 
                  this.config.themes.builtIn[themeId];
    
    if (!theme) {
      return '<h1>Theme not found</h1>';
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${theme.name} - Theme Preview</title>
    <link rel="stylesheet" href="/theme/preview/${themeId}/styles.css">
    <style>
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .preview-section {
            margin-bottom: 60px;
        }
        
        .color-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .color-swatch {
            height: 100px;
            border-radius: 8px;
            display: flex;
            align-items: flex-end;
            padding: 10px;
            color: white;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .component-grid {
            display: grid;
            gap: 20px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <h1>${theme.name}</h1>
        <p>${theme.description}</p>
        <p><small>Version ${theme.version} by ${theme.author}</small></p>
        
        <div class="preview-section">
            <h2>Colors</h2>
            <div class="color-grid">
                <div class="color-swatch" style="background: var(--theme-primary)">Primary</div>
                <div class="color-swatch" style="background: var(--theme-secondary)">Secondary</div>
                <div class="color-swatch" style="background: var(--theme-success)">Success</div>
                <div class="color-swatch" style="background: var(--theme-warning)">Warning</div>
                <div class="color-swatch" style="background: var(--theme-error)">Error</div>
                <div class="color-swatch" style="background: var(--theme-info)">Info</div>
            </div>
        </div>
        
        <div class="preview-section">
            <h2>Typography</h2>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
            <p>This is a paragraph with <a href="#">a link</a> and some <code>inline code</code>.</p>
            <pre><code>// Code block
function example() {
  return "Hello, World!";
}</code></pre>
        </div>
        
        <div class="preview-section">
            <h2>Components</h2>
            <div class="component-grid">
                <div>
                    <h3>Buttons</h3>
                    <button class="button">Primary Button</button>
                    <button class="button button--secondary">Secondary Button</button>
                </div>
                
                <div>
                    <h3>Cards</h3>
                    <div class="card">
                        <h4>Card Title</h4>
                        <p>This is a card component with some content inside.</p>
                    </div>
                </div>
                
                <div>
                    <h3>Forms</h3>
                    <input type="text" class="input" placeholder="Text input">
                    <br><br>
                    <select class="input">
                        <option>Select option</option>
                        <option>Option 1</option>
                        <option>Option 2</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
    
    <script src="/theme/preview/${themeId}/script.js"></script>
</body>
</html>
    `;
  }
  
  /**
   * Generate marketplace page
   */
  generateMarketplacePage() {
    const themes = Array.from(this.themes.marketplace.values());
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Theme Marketplace</title>
    <style>
        /* Marketplace styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f7;
        }
        
        .marketplace-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .theme-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .theme-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .theme-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .theme-preview {
            height: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .theme-info {
            padding: 20px;
        }
        
        .theme-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .theme-author {
            color: #666;
            font-size: 14px;
            margin-bottom: 12px;
        }
        
        .theme-price {
            font-size: 20px;
            font-weight: 600;
            color: #0066CC;
        }
        
        .install-button {
            display: block;
            width: 100%;
            padding: 10px;
            margin-top: 15px;
            background: #0066CC;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
        }
        
        .install-button:hover {
            background: #0051A3;
        }
        
        .filters {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 40px;
        }
        
        .filter-button {
            padding: 8px 16px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .filter-button.active {
            background: #0066CC;
            color: white;
            border-color: #0066CC;
        }
    </style>
</head>
<body>
    <div class="marketplace-header">
        <h1>Theme Marketplace</h1>
        <p>Discover and install beautiful themes for your DocGen platform</p>
    </div>
    
    <div class="filters">
        <button class="filter-button active">All</button>
        ${this.config.marketplace.categories.map(cat => 
          `<button class="filter-button">${cat}</button>`
        ).join('')}
    </div>
    
    <div class="theme-grid">
        ${themes.map(theme => `
            <div class="theme-card">
                <div class="theme-preview" style="background: ${theme.previewColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}"></div>
                <div class="theme-info">
                    <div class="theme-name">${theme.name}</div>
                    <div class="theme-author">by ${theme.author}</div>
                    <div class="theme-description">${theme.description}</div>
                    <div class="theme-price">${theme.price === 0 ? 'Free' : '$' + theme.price}</div>
                    <button class="install-button" onclick="installTheme('${theme.id}')">
                        ${theme.price === 0 ? 'Install' : 'Purchase & Install'}
                    </button>
                </div>
            </div>
        `).join('')}
    </div>
    
    <script>
        function installTheme(themeId) {
            console.log('Installing theme:', themeId);
            // Implementation for theme installation
        }
        
        // Filter functionality
        document.querySelectorAll('.filter-button').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                // Filter themes based on category
            });
        });
    </script>
</body>
</html>
    `;
  }
  
  /**
   * Generate theme editor
   */
  generateThemeEditor() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Theme Editor</title>
    <style>
        /* Theme editor styles */
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: grid;
            grid-template-columns: 300px 1fr 400px;
            height: 100vh;
        }
        
        .sidebar {
            background: #f5f5f7;
            padding: 20px;
            overflow-y: auto;
        }
        
        .preview {
            padding: 40px;
            overflow-y: auto;
        }
        
        .controls {
            background: white;
            border-left: 1px solid #ddd;
            padding: 20px;
            overflow-y: auto;
        }
        
        .control-group {
            margin-bottom: 30px;
        }
        
        .control-label {
            font-weight: 600;
            margin-bottom: 10px;
            display: block;
        }
        
        .color-input {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .color-input input[type="color"] {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        
        .color-input input[type="text"] {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .export-button {
            width: 100%;
            padding: 12px;
            background: #0066CC;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .export-button:hover {
            background: #0051A3;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>Theme Editor</h2>
        <p>Create your custom theme</p>
        
        <div class="control-group">
            <label class="control-label">Theme Name</label>
            <input type="text" placeholder="My Custom Theme" style="width: 100%; padding: 8px;">
        </div>
        
        <div class="control-group">
            <label class="control-label">Description</label>
            <textarea placeholder="Theme description..." style="width: 100%; padding: 8px; height: 80px;"></textarea>
        </div>
    </div>
    
    <div class="preview">
        <iframe src="/preview/docgen-classic" style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
    
    <div class="controls">
        <h3>Customize Theme</h3>
        
        <div class="control-group">
            <label class="control-label">Primary Colors</label>
            <div class="color-input">
                <input type="color" value="#0066CC" id="primary-color">
                <input type="text" value="#0066CC" placeholder="Primary Color">
            </div>
            <div class="color-input">
                <input type="color" value="#5856D6" id="secondary-color">
                <input type="text" value="#5856D6" placeholder="Secondary Color">
            </div>
        </div>
        
        <div class="control-group">
            <label class="control-label">Typography</label>
            <select style="width: 100%; padding: 8px; margin-bottom: 10px;">
                <option>System Font Stack</option>
                <option>Inter</option>
                <option>Roboto</option>
                <option>Open Sans</option>
                <option>Montserrat</option>
            </select>
            
            <label style="display: block; margin-top: 10px;">Base Font Size</label>
            <input type="range" min="14" max="18" value="16" style="width: 100%;">
        </div>
        
        <div class="control-group">
            <label class="control-label">Spacing</label>
            <select style="width: 100%; padding: 8px;">
                <option>Compact</option>
                <option selected>Comfortable</option>
                <option>Spacious</option>
            </select>
        </div>
        
        <button class="export-button">Export Theme</button>
    </div>
    
    <script>
        // Live preview updates
        document.getElementById('primary-color').addEventListener('change', function(e) {
            const iframe = document.querySelector('iframe');
            iframe.contentWindow.DocGenTheme.setVar('primary', e.target.value);
        });
        
        document.getElementById('secondary-color').addEventListener('change', function(e) {
            const iframe = document.querySelector('iframe');
            iframe.contentWindow.DocGenTheme.setVar('secondary', e.target.value);
        });
    </script>
</body>
</html>
    `;
  }
  
  /**
   * Apply theme to domain
   */
  async applyTheme(domain, themeId, options = {}) {
    try {
      // Validate theme exists
      const theme = await this.getTheme(themeId);
      if (!theme) {
        throw new Error(`Theme ${themeId} not found`);
      }
      
      // Store active theme for domain
      this.themes.active.set(domain, {
        themeId,
        appliedAt: Date.now(),
        options
      });
      
      // Clear cache for domain
      this.clearDomainCache(domain);
      
      // Emit theme change event
      this.emit('theme_applied', {
        domain,
        themeId,
        theme
      });
      
      console.log(`✅ Applied theme ${themeId} to ${domain}`);
      
      return {
        success: true,
        theme,
        domain
      };
      
    } catch (error) {
      console.error('❌ Failed to apply theme:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create custom theme
   */
  async createCustomTheme(themeData) {
    try {
      const theme = {
        id: crypto.randomUUID(),
        ...themeData,
        createdAt: Date.now(),
        type: 'custom'
      };
      
      // Validate theme structure
      this.validateThemeStructure(theme);
      
      // Store custom theme
      this.themes.custom.set(theme.id, theme);
      this.themes.installed.set(theme.id, theme);
      
      console.log(`✅ Created custom theme: ${theme.name}`);
      
      return theme;
      
    } catch (error) {
      console.error('❌ Failed to create theme:', error.message);
      throw error;
    }
  }
  
  /**
   * Get A/B test variant
   */
  getABTestVariant(testId, userId) {
    // Check if user already has assignment
    const assignmentKey = `${testId}:${userId}`;
    if (this.abTests.assignments.has(assignmentKey)) {
      return this.abTests.assignments.get(assignmentKey);
    }
    
    // Get test configuration
    const test = this.abTests.active.get(testId);
    if (!test) {
      return null;
    }
    
    // Assign variant based on distribution
    const variant = this.assignVariant(test, userId);
    this.abTests.assignments.set(assignmentKey, variant);
    
    // Track assignment
    this.trackABTestEvent(testId, userId, 'assigned', variant);
    
    return variant;
  }
  
  /**
   * Load built-in themes
   */
  async loadBuiltInThemes() {
    console.log('🎨 Loading built-in themes...');
    
    // Generate theme data for each built-in theme
    for (const [id, meta] of Object.entries(this.config.themes.builtIn)) {
      const theme = this.generateBuiltInTheme(id, meta);
      this.themes.installed.set(id, theme);
    }
  }
  
  /**
   * Generate built-in theme data
   */
  generateBuiltInTheme(id, meta) {
    const themes = {
      'docgen-classic': {
        ...meta,
        id,
        colors: {
          primary: '#0066CC',
          primaryLight: '#3385FF',
          primaryDark: '#0051A3',
          secondary: '#5856D6',
          secondaryLight: '#7B79FF',
          secondaryDark: '#3E3CAD',
          background: '#FFFFFF',
          surface: '#F8F8FB',
          surfaceVariant: '#F2F2F7',
          textPrimary: '#000000',
          textSecondary: '#666666',
          textDisabled: '#999999',
          border: '#E5E5EA',
          divider: '#D1D1D6',
          success: '#34C759',
          warning: '#FF9500',
          error: '#FF3B30',
          info: '#5AC8FA'
        },
        typography: {
          fontPrimary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSecondary: 'Georgia, serif',
          fontMono: '"SF Mono", Monaco, Consolas, monospace',
          sizes: {
            xs: '0.75rem',
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '2rem'
          },
          weights: {
            light: 300,
            regular: 400,
            medium: 500,
            bold: 700
          },
          lineHeights: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.75
          }
        },
        spacing: {
          unit: 8,
          radius: {
            sm: '4px',
            md: '8px',
            lg: '12px',
            full: '9999px'
          }
        },
        components: {
          shadows: {
            sm: '0 1px 3px rgba(0,0,0,0.12)',
            md: '0 4px 6px rgba(0,0,0,0.1)',
            lg: '0 10px 15px rgba(0,0,0,0.1)',
            xl: '0 20px 25px rgba(0,0,0,0.15)'
          },
          animations: {
            enabled: true
          }
        }
      },
      'docgen-dark': {
        ...meta,
        id,
        colors: {
          primary: '#3385FF',
          primaryLight: '#5A9FFF',
          primaryDark: '#0066CC',
          secondary: '#7B79FF',
          secondaryLight: '#9B99FF',
          secondaryDark: '#5856D6',
          background: '#000000',
          surface: '#1C1C1E',
          surfaceVariant: '#2C2C2E',
          textPrimary: '#FFFFFF',
          textSecondary: '#AAAAAA',
          textDisabled: '#666666',
          border: '#3A3A3C',
          divider: '#48484A',
          success: '#30D158',
          warning: '#FFD60A',
          error: '#FF453A',
          info: '#64D2FF'
        },
        // ... rest of dark theme configuration
      }
      // ... other built-in themes
    };
    
    return themes[id] || this.generateDefaultTheme(id, meta);
  }
  
  /**
   * Generate default theme structure
   */
  generateDefaultTheme(id, meta) {
    return {
      ...meta,
      id,
      colors: {
        primary: '#0066CC',
        secondary: '#5856D6',
        background: '#FFFFFF',
        textPrimary: '#000000',
        // ... other required colors
      },
      typography: {
        fontPrimary: 'system-ui, sans-serif',
        // ... other typography settings
      },
      spacing: {
        unit: 8,
        // ... other spacing settings
      },
      components: {
        // ... component styles
      }
    };
  }
  
  // Helper methods
  
  async getTheme(themeId) {
    return this.themes.installed.get(themeId) || 
           this.themes.custom.get(themeId) ||
           this.themes.marketplace.get(themeId);
  }
  
  clearDomainCache(domain) {
    for (const key of this.themes.cache.keys()) {
      if (key.startsWith(domain + ':')) {
        this.themes.cache.delete(key);
      }
    }
  }
  
  validateThemeStructure(theme) {
    const required = ['name', 'colors', 'typography'];
    for (const field of required) {
      if (!theme[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }
  
  generateDarkModeCSS(theme) {
    // Generate dark mode overrides
    return '/* Dark mode overrides */';
  }
  
  generateAnimationCSS(theme) {
    // Generate animation CSS
    return '/* Theme animations */';
  }
  
  assignVariant(test, userId) {
    // Simple variant assignment based on user ID hash
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const bucket = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    
    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant.id;
      }
    }
    
    return test.variants[0].id; // Fallback
  }
  
  trackABTestEvent(testId, userId, event, data) {
    // Track A/B test events
    console.log(`📊 A/B Test Event: ${testId} - ${event}`, data);
  }
  
  async initializeMarketplace() {
    console.log('🛍️ Initializing theme marketplace...');
  }
  
  async setupABTesting() {
    console.log('📊 Setting up A/B testing...');
  }
  
  async startServer() {
    const PORT = process.env.THEME_ENGINE_PORT || 4500;
    
    this.server = this.app.listen(PORT, () => {
      console.log(`✅ Skin Theme Engine running on http://localhost:${PORT}`);
      console.log(`🎨 Preview themes at http://localhost:${PORT}/preview/:themeId`);
      console.log(`🛍️ Browse marketplace at http://localhost:${PORT}/marketplace`);
      console.log(`✏️ Theme editor at http://localhost:${PORT}/editor`);
    });
  }
}

module.exports = SkinThemeEngine;

// Example usage
if (require.main === module) {
  async function launchThemeEngine() {
    console.log('🎨 Launching Skin Theme Engine');
    console.log('=' .repeat(50));
    
    const engine = new SkinThemeEngine();
    
    try {
      await engine.initialize();
      
      console.log('\n✅ Theme engine is running!');
      console.log('🌐 Visit http://localhost:4500/marketplace to browse themes');
      console.log('✏️ Create custom themes at http://localhost:4500/editor');
      
    } catch (error) {
      console.error('❌ Failed to launch theme engine:', error.message);
    }
  }
  
  launchThemeEngine().catch(console.error);
}
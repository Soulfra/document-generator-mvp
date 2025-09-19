/**
 * ANHK - Advanced Native Hypertext Kompiler
 * A unified scripting language that eliminates dependencies and deploys anywhere
 * Inspired by AutoHotkey but designed for web/document generation
 */

class ANHKLanguage {
    constructor() {
        this.variables = new Map();
        this.functions = new Map();
        this.sprites = new Map();
        this.svgAnimations = new Map();
        this.deploymentTargets = ['html', 'electron', 'tauri', 'cordova', 'native'];
        this.shamans = new Map(); // Event handlers/watchers
        this.scrolls = new Map(); // Saved scripts/macros
        this.dragons = new Map(); // Complex multi-step processes
        
        this.initBuiltins();
    }

    initBuiltins() {
        // Built-in sprite creation functions
        this.functions.set('CreateSprite', (width, height) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            return { canvas, ctx, id: this.generateId() };
        });

        // Built-in SVG animation
        this.functions.set('AnimateSVG', (element, property, from, to, duration) => {
            const animation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animation.setAttribute('attributeName', property);
            animation.setAttribute('from', from);
            animation.setAttribute('to', to);
            animation.setAttribute('dur', duration);
            animation.setAttribute('repeatCount', 'indefinite');
            element.appendChild(animation);
            return animation;
        });

        // AI-Powered Image Generation
        this.functions.set('GenerateSprite', async (prompt, style = 'pixel art', size = '512x512') => {
            return await this.generateAIImage(prompt, style, size);
        });

        this.functions.set('GenerateGrimReaper', async (style = 'menacing pixel art grim reaper with glowing scythe, dark fantasy') => {
            return await this.generateAIImage(style, 'pixel art', '512x512');
        });

        this.functions.set('GenerateBoss', async (bossName, phase = 1) => {
            const prompt = `${bossName} boss phase ${phase}, game sprite, detailed pixel art, fantasy RPG style`;
            return await this.generateAIImage(prompt, 'pixel art', '512x512');
        });

        // Self-contained deployment
        this.functions.set('Deploy', (target = 'html') => {
            switch(target) {
                case 'html':
                    return this.generateStandaloneHTML();
                case 'electron':
                    return this.generateElectronApp();
                case 'github':
                    return this.generateGitHubPages();
                default:
                    return this.generateStandaloneHTML();
            }
        });

        // No-dependency sprite editor
        this.functions.set('CreateSpriteEditor', () => {
            return this.generateUnifiedSpriteEditor();
        });
    }

    // ANHK Script Parser
    parse(script) {
        const lines = script.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
        const ast = [];

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Variable assignment: myVar := "value"
            if (trimmed.includes(':=')) {
                const [name, value] = trimmed.split(':=').map(s => s.trim());
                ast.push({ type: 'assignment', name, value: this.parseValue(value) });
            }
            // Function call: FunctionName(args)
            else if (trimmed.includes('(') && trimmed.includes(')')) {
                const match = trimmed.match(/(\w+)\((.*)\)/);
                if (match) {
                    const [, name, argsStr] = match;
                    const args = argsStr ? argsStr.split(',').map(s => this.parseValue(s.trim())) : [];
                    ast.push({ type: 'function_call', name, args });
                }
            }
            // Shaman (event handler): OnClick:: { code }
            else if (trimmed.includes('::')) {
                const [event, code] = trimmed.split('::').map(s => s.trim());
                ast.push({ type: 'shaman', event, code });
            }
            // Dragon (complex process): DragonName => { steps }
            else if (trimmed.includes('=>')) {
                const [name, steps] = trimmed.split('=>').map(s => s.trim());
                ast.push({ type: 'dragon', name, steps });
            }
        }

        return ast;
    }

    parseValue(str) {
        str = str.trim();
        if (str.startsWith('"') && str.endsWith('"')) {
            return str.slice(1, -1); // String literal
        }
        if (!isNaN(str)) {
            return parseFloat(str); // Number
        }
        return str; // Variable reference or identifier
    }

    // Execute ANHK script
    execute(script) {
        const ast = this.parse(script);
        const results = [];

        for (const node of ast) {
            switch (node.type) {
                case 'assignment':
                    this.variables.set(node.name, node.value);
                    break;
                
                case 'function_call':
                    const func = this.functions.get(node.name);
                    if (func) {
                        const result = func(...node.args);
                        results.push(result);
                    }
                    break;
                
                case 'shaman':
                    this.shamans.set(node.event, node.code);
                    break;
                
                case 'dragon':
                    this.dragons.set(node.name, node.steps);
                    break;
            }
        }

        return results;
    }

    // Generate standalone HTML with everything embedded
    generateStandaloneHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANHK Generated Application</title>
    <style>
        /* Embedded CSS - no external dependencies */
        ${this.getEmbeddedCSS()}
    </style>
</head>
<body>
    <div id="app">
        <h1>🔮 ANHK Generated App</h1>
        <div id="content"></div>
    </div>
    
    <script>
        /* Embedded JavaScript - no external dependencies */
        ${this.getEmbeddedJS()}
    </script>
</body>
</html>`;
    }

    generateElectronApp() {
        return {
            'package.json': JSON.stringify({
                name: 'anhk-app',
                version: '1.0.0',
                main: 'main.js',
                scripts: {
                    start: 'electron .'
                },
                devDependencies: {
                    electron: '^latest'
                }
            }, null, 2),
            
            'main.js': `
const { app, BrowserWindow } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    });
    
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);
            `,
            
            'index.html': this.generateStandaloneHTML()
        };
    }

    generateGitHubPages() {
        return {
            'index.html': this.generateStandaloneHTML(),
            '.github/workflows/deploy.yml': `
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
            `
        };
    }

    getEmbeddedCSS() {
        return `
        :root {
            --bg-dark: #1a1a1a;
            --bg-medium: #2a2a2a;
            --bg-light: #3a3a3a;
            --text-primary: #ffffff;
            --accent: #00ff41;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
        }
        
        #app {
            padding: 20px;
            text-align: center;
        }
        
        h1 {
            color: var(--accent);
            margin-bottom: 20px;
        }
        
        .sprite-canvas {
            border: 2px solid var(--accent);
            image-rendering: pixelated;
        }
        `;
    }

    getEmbeddedJS() {
        return `
        // ANHK Runtime - Self-contained
        const ANHK = {
            sprites: new Map(),
            
            createSprite: function(width, height) {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.className = 'sprite-canvas';
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                return { canvas, ctx };
            },
            
            drawPixel: function(ctx, x, y, color) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            },
            
            exportPNG: function(canvas) {
                const link = document.createElement('a');
                link.download = 'sprite.png';
                link.href = canvas.toDataURL();
                link.click();
            }
        };
        
        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔮 ANHK Application Ready');
            
            // Example: Create a simple sprite
            const sprite = ANHK.createSprite(64, 64);
            sprite.ctx.fillStyle = '#00ff41';
            sprite.ctx.fillRect(0, 0, 64, 64);
            
            document.getElementById('content').appendChild(sprite.canvas);
        });
        `;
    }

    generateUnifiedSpriteEditor() {
        // Return the enhanced sprite editor but with ANHK integration
        return `
        // ANHK Sprite Editor Integration
        class ANHKSpriteEditor {
            constructor() {
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.tools = ['brush', 'eraser', 'fill', 'eyedropper'];
                this.currentTool = 'brush';
                this.color = '#000000';
                this.init();
            }
            
            init() {
                this.canvas.width = 512;
                this.canvas.height = 512;
                this.canvas.style.imageRendering = 'pixelated';
                this.ctx.imageSmoothingEnabled = false;
                
                // White background
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.setupEvents();
                this.createUI();
            }
            
            setupEvents() {
                let isDrawing = false;
                
                this.canvas.addEventListener('mousedown', (e) => {
                    isDrawing = true;
                    this.draw(e);
                });
                
                this.canvas.addEventListener('mousemove', (e) => {
                    if (isDrawing) this.draw(e);
                });
                
                this.canvas.addEventListener('mouseup', () => {
                    isDrawing = false;
                });
            }
            
            draw(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
                
                if (this.currentTool === 'brush') {
                    this.ctx.fillStyle = this.color;
                    this.ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
                }
            }
            
            createUI() {
                const container = document.createElement('div');
                container.style.cssText = 'display: flex; gap: 20px; align-items: flex-start;';
                
                const toolPanel = document.createElement('div');
                toolPanel.innerHTML = \`
                    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #00ff41; margin-bottom: 15px;">🎨 ANHK Sprite Editor</h3>
                        <input type="color" value="#000000" onchange="editor.color = this.value">
                        <br><br>
                        <button onclick="editor.export()">Export PNG</button>
                        <br><br>
                        <button onclick="editor.createGrimReaper()">Add Grim Reaper</button>
                    </div>
                \`;
                
                container.appendChild(toolPanel);
                container.appendChild(this.canvas);
                
                return container;
            }
            
            export() {
                const link = document.createElement('a');
                link.download = 'anhk-sprite.png';
                link.href = this.canvas.toDataURL();
                link.click();
            }
            
            createGrimReaper() {
                // Draw a simple grim reaper on the canvas
                this.ctx.fillStyle = '#000000';
                // Hood
                this.ctx.fillRect(100, 50, 60, 80);
                // Face area
                this.ctx.fillStyle = '#F5F5DC';
                this.ctx.fillRect(110, 70, 40, 40);
                // Eyes
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(120, 80, 5, 5);
                this.ctx.fillRect(135, 80, 5, 5);
                // Scythe handle
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(50, 120, 5, 100);
                // Scythe blade
                this.ctx.fillStyle = '#C0C0C0';
                this.ctx.fillRect(30, 120, 25, 15);
            }
        }
        
        // Global editor instance
        let editor;
        `;
    }

    // Compile ANHK to target platform
    compile(script, target = 'html') {
        const ast = this.parse(script);
        
        switch (target) {
            case 'html':
                return this.compileToHTML(ast);
            case 'electron':
                return this.compileToElectron(ast);
            case 'mobile':
                return this.compileToMobile(ast);
            default:
                return this.compileToHTML(ast);
        }
    }

    compileToHTML(ast) {
        // Generate a complete HTML application from AST
        let html = this.generateStandaloneHTML();
        
        // Add custom code based on AST
        for (const node of ast) {
            if (node.type === 'function_call' && node.name === 'CreateSprite') {
                html = html.replace('<!-- SPRITE_PLACEHOLDER -->', 
                    `<canvas id="sprite-${Date.now()}" width="${node.args[0]}" height="${node.args[1]}"></canvas>`);
            }
        }
        
        return html;
    }

    generateId() {
        return 'anhk_' + Math.random().toString(36).substr(2, 9);
    }

    // AI Image Generation Core System
    async generateAIImage(prompt, style = 'pixel art', size = '512x512') {
        const enhancedPrompt = this.enhancePrompt(prompt, style);
        
        // Try multiple AI services in order of preference
        const services = [
            { name: 'flux', cost: 0.001 },
            { name: 'imagen', cost: 0.02 },
            { name: 'dalle', cost: 0.04 }
        ];

        for (const service of services) {
            try {
                console.log(`🎨 Trying ${service.name} for: ${enhancedPrompt}`);
                const result = await this.callAIService(service.name, enhancedPrompt, size);
                
                if (result) {
                    console.log(`✅ Generated with ${service.name} ($${service.cost})`);
                    return {
                        imageUrl: result.imageUrl,
                        service: service.name,
                        cost: service.cost,
                        prompt: enhancedPrompt,
                        canvas: await this.imageToCanvas(result.imageUrl)
                    };
                }
            } catch (error) {
                console.warn(`❌ ${service.name} failed:`, error.message);
                continue;
            }
        }

        // Fallback to placeholder if all services fail
        return this.createPlaceholderSprite(prompt, size);
    }

    enhancePrompt(prompt, style) {
        const styleEnhancements = {
            'pixel art': 'highly detailed pixel art, 16-bit style, crisp pixels, retro gaming aesthetic',
            'realistic': 'photorealistic, high detail, professional quality',
            '3d model': '3D rendered model, game asset, clean topology, textured',
            'cartoon': 'cartoon style, vibrant colors, stylized, animated series quality'
        };

        const baseEnhancement = styleEnhancements[style] || styleEnhancements['pixel art'];
        
        return `${prompt}, ${baseEnhancement}, transparent background, centered composition, high quality, masterpiece`;
    }

    async callAIService(service, prompt, size) {
        switch (service) {
            case 'flux':
                return await this.callReplicate(prompt, size);
            case 'imagen':
                return await this.callImagen(prompt, size);
            case 'dalle':
                return await this.callDALLE(prompt, size);
            default:
                throw new Error(`Unknown service: ${service}`);
        }
    }

    async callReplicate(prompt, size) {
        // Replicate FLUX API call
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${this.getAPIKey('replicate')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: "dev", // FLUX.1-dev model
                input: {
                    prompt: prompt,
                    width: parseInt(size.split('x')[0]),
                    height: parseInt(size.split('x')[1]),
                    num_outputs: 1,
                    guidance_scale: 3.5,
                    num_inference_steps: 28
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Replicate API error: ${response.status}`);
        }

        const prediction = await response.json();
        
        // Poll for completion
        return await this.pollReplicateResult(prediction.id);
    }

    async callImagen(prompt, size) {
        // Google Imagen via Gemini API
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getAPIKey('google')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                sampleCount: 1,
                aspectRatio: this.sizeToAspectRatio(size),
                safetyFilterLevel: "block_only_high",
                personGeneration: "allow_adult"
            })
        });

        if (!response.ok) {
            throw new Error(`Imagen API error: ${response.status}`);
        }

        const result = await response.json();
        return {
            imageUrl: result.generatedImages[0].imageUri
        };
    }

    async callDALLE(prompt, size) {
        // OpenAI DALL-E 3 API
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getAPIKey('openai')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                size: size,
                quality: "standard",
                n: 1
            })
        });

        if (!response.ok) {
            throw new Error(`DALL-E API error: ${response.status}`);
        }

        const result = await response.json();
        return {
            imageUrl: result.data[0].url
        };
    }

    async pollReplicateResult(predictionId) {
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (attempts < maxAttempts) {
            const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: {
                    'Authorization': `Token ${this.getAPIKey('replicate')}`
                }
            });

            const prediction = await response.json();

            if (prediction.status === 'succeeded') {
                return {
                    imageUrl: prediction.output[0]
                };
            } else if (prediction.status === 'failed') {
                throw new Error('Replicate generation failed');
            }

            // Wait 5 seconds before polling again
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }

        throw new Error('Replicate generation timeout');
    }

    getAPIKey(service) {
        // Check for API keys in various places
        const keys = {
            replicate: localStorage.getItem('replicate_api_key') || 
                      process?.env?.REPLICATE_API_TOKEN || 
                      'demo_key_replace_me',
            google: localStorage.getItem('google_api_key') || 
                   process?.env?.GOOGLE_API_KEY || 
                   'demo_key_replace_me',
            openai: localStorage.getItem('openai_api_key') || 
                   process?.env?.OPENAI_API_KEY || 
                   'demo_key_replace_me'
        };

        return keys[service];
    }

    sizeToAspectRatio(size) {
        const [width, height] = size.split('x').map(Number);
        if (width === height) return 'SQUARE';
        if (width > height) return 'LANDSCAPE';
        return 'PORTRAIT';
    }

    async imageToCanvas(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };
            img.src = imageUrl;
        });
    }

    createPlaceholderSprite(prompt, size) {
        // Create a placeholder when AI generation fails
        const [width, height] = size.split('x').map(Number);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw placeholder
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#00ff41';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AI Generation', width/2, height/2 - 20);
        ctx.fillText('Failed', width/2, height/2);
        ctx.fillText(prompt.substring(0, 20) + '...', width/2, height/2 + 20);
        
        return {
            imageUrl: canvas.toDataURL(),
            service: 'placeholder',
            cost: 0,
            prompt: prompt,
            canvas: canvas
        };
    }
}

// Example ANHK Script
const exampleScript = \`
// ANHK - Advanced Native Hypertext Kompiler Example
// No dependencies, self-contained, deploys anywhere

// Variables
spriteWidth := 64
spriteHeight := 64
currentColor := "#00ff41"

// Create a sprite
mySprite := CreateSprite(spriteWidth, spriteHeight)

// Create animated grim reaper SVG
grimReaper := CreateGrimReaper()

// Event handlers (Shamans)
OnClick:: {
    DrawPixel(mouseX, mouseY, currentColor)
}

OnKeyPress:: {
    if (key === "s") {
        Export("png")
    }
}

// Complex process (Dragon)
CreateFullGame => {
    LoadSprites()
    SetupCanvas()
    StartGameLoop()
    HandleInput()
}

// Deploy to multiple targets
Deploy("html")
Deploy("electron")
Deploy("github")
\`;

// Initialize ANHK
const anhk = new ANHKLanguage();

// Make it globally available
window.ANHK = anhk;
window.ANHKScript = exampleScript;

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ANHKLanguage, exampleScript };
}
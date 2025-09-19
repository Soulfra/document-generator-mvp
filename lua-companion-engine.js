#!/usr/bin/env node

/**
 * 🌙📜 LUA COMPANION ENGINE
 * 
 * Provides Lua scripting capabilities for polygon companion characters
 * Integrates with all systems through scriptable interfaces
 * Allows real-time behavior modification and world interaction
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

// Note: In production, we'd use lua.js or luajs for actual Lua execution
// For now, we'll create a Lua-like scripting system that compiles to JavaScript

console.log(`
🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜
📜 LUA COMPANION ENGINE 📜
🌙 Scriptable Polygon Characters 🌙
📜 Real-time Behavior Modification 📜
🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜🌙📜
`);

class LuaCompanionEngine {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 9998;
        
        // Lua Script Storage
        this.scripts = new Map();
        this.compiledScripts = new Map();
        this.runningScripts = new Map();
        this.scriptContext = new Map();
        
        // Default Lua scripts for each companion type
        this.defaultScripts = {
            scout: `
-- Scout Companion Behavior
function on_world_change(event)
    if event.type == "voxel_placed" then
        move_to(event.position.x, event.position.y + 2, event.position.z)
        scan_area(5) -- 5 block radius
        bridge_to_system("documentToMVP", {
            action = "analyze_structure",
            position = get_position(),
            scan_results = get_scan_results()
        })
    end
end

function on_player_command(command)
    if command == "explore" then
        set_state("exploring")
        change_color("#00ff88")
        move_random()
    elseif command == "return" then
        set_state("returning")
        move_to(0, 5, 0)
    end
end

function update()
    -- Continuous behavior
    if get_state() == "exploring" then
        if math.random() < 0.1 then -- 10% chance per frame
            emit_particles("exploration", get_position())
        end
    end
end
`,
            
            builder: `
-- Builder Companion Behavior  
function on_world_change(event)
    if event.type == "voxel_placed" then
        analyze_construction(event.position)
        suggest_improvements()
    elseif event.type == "voxel_removed" then
        check_structural_integrity()
    end
end

function analyze_construction(pos)
    set_state("analyzing")
    change_color("#ff8800")
    
    -- Check surrounding blocks
    local surrounding = scan_area_at(pos, 3)
    
    -- Bridge to Universal Compactor for optimization
    bridge_to_system("universalCompactor", {
        action = "optimize_structure", 
        structure_data = surrounding,
        position = pos
    })
end

function suggest_improvements()
    -- Generate building suggestions
    local suggestions = {
        "Add support pillars",
        "Consider symmetrical design", 
        "Optimize material usage"
    }
    
    for i, suggestion in ipairs(suggestions) do
        show_tooltip(suggestion, 3.0) -- Show for 3 seconds
    end
end

function on_player_command(command)
    if command == "optimize" then
        start_optimization_mode()
    elseif command == "blueprint" then
        create_blueprint(get_selection())
    end
end
`,
            
            mirror: `
-- Mirror Companion Behavior
function on_world_change(event)
    if event.type == "voxel_placed" then
        create_mirror_variants(event)
    end
end

function create_mirror_variants(event)
    set_state("mirroring")
    change_color("#8800ff")
    
    -- Create language variants
    local languages = {"es", "ja", "fr", "de", "zh"}
    local domains = {".ai", ".research", ".dev", ".edu"}
    
    for i, lang in ipairs(languages) do
        bridge_to_system("characterMirror", {
            action = "create_language_variant",
            language = lang,
            source_data = event,
            delay = i * 1000 -- Stagger creation
        })
    end
    
    for i, domain in ipairs(domains) do 
        bridge_to_system("characterMirror", {
            action = "create_domain_variant",
            domain = domain,
            source_data = event,
            delay = (#languages * 1000) + (i * 500)
        })
    end
end

function on_player_command(command)
    if command == "mirror_world" then
        mirror_entire_world()
    elseif command == "sync_variants" then
        synchronize_all_variants()
    end
end

function mirror_entire_world()
    local world_data = get_world_data()
    
    bridge_to_system("characterMirror", {
        action = "mirror_world",
        world_data = world_data,
        mirror_types = {"language", "domain", "style"}
    })
end
`
        };
        
        // Lua to JavaScript compiler patterns
        this.luaToJsPatterns = [
            // Function definitions
            { lua: /function\s+(\w+)\s*\((.*?)\)/g, js: 'function $1($2) {' },
            { lua: /end/g, js: '}' },
            
            // Variables
            { lua: /local\s+(\w+)\s*=/g, js: 'let $1 =' },
            { lua: /(\w+)\s*=/g, js: '$1 =' },
            
            // Control structures
            { lua: /if\s+(.*?)\s+then/g, js: 'if ($1) {' },
            { lua: /elseif\s+(.*?)\s+then/g, js: '} else if ($1) {' },
            { lua: /else/g, js: '} else {' },
            
            // Loops
            { lua: /for\s+(\w+)\s*,\s*(\w+)\s+in\s+ipairs\((.*?)\)\s+do/g, js: 'for (let $1 = 0; $1 < $3.length; $1++) { let $2 = $3[$1];' },
            { lua: /for\s+(\w+)\s*=\s*(\d+)\s*,\s*(\d+)\s+do/g, js: 'for (let $1 = $2; $1 <= $3; $1++) {' },
            
            // Tables to arrays/objects
            { lua: /\{(.*?)\}/g, js: '[$1]' },
            
            // Comments
            { lua: /--\s*(.*?)$/gm, js: '// $1' }
        ];
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🌙 Initializing Lua Companion Engine...');
        
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static('public'));
        
        this.setupRoutes();
        this.setupWebSocket();
        await this.loadDefaultScripts();
        
        this.server.listen(this.port, () => {
            console.log(`📜 Lua Companion Engine running on http://localhost:${this.port}`);
            console.log(`🌙 Lua scripting interface active`);
        });
    }
    
    setupRoutes() {
        // Lua IDE interface
        this.app.get('/', (req, res) => {
            res.send(this.getLuaIDE());
        });
        
        // Script management
        this.app.get('/api/scripts', (req, res) => {
            res.json(Array.from(this.scripts.entries()).map(([name, script]) => ({
                name,
                script,
                compiled: this.compiledScripts.has(name),
                running: this.runningScripts.has(name)
            })));
        });
        
        this.app.post('/api/scripts/save', (req, res) => {
            const { name, script, companionType } = req.body;
            this.saveScript(name, script, companionType);
            res.json({ success: true });
        });
        
        this.app.post('/api/scripts/compile', (req, res) => {
            const { name } = req.body;
            const result = this.compileScript(name);
            res.json(result);
        });
        
        this.app.post('/api/scripts/execute', (req, res) => {
            const { name, context } = req.body;
            const result = this.executeScript(name, context);
            res.json(result);
        });
        
        // Real-time script execution
        this.app.post('/api/lua/eval', (req, res) => {
            const { code, context } = req.body;
            const result = this.evaluateLuaCode(code, context);
            res.json(result);
        });
        
        // Companion behavior endpoints
        this.app.post('/api/companion/set-script', (req, res) => {
            const { companionId, scriptName } = req.body;
            this.setCompanionScript(companionId, scriptName);
            res.json({ success: true });
        });
        
        this.app.get('/api/companion/:id/script', (req, res) => {
            const script = this.getCompanionScript(req.params.id);
            res.json({ script });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('📜 Lua console connection established');
            
            // Send available scripts
            ws.send(JSON.stringify({
                type: 'scripts_available',
                scripts: Array.from(this.scripts.keys())
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('Lua WebSocket error:', error);
                }
            });
        });
    }
    
    async loadDefaultScripts() {
        console.log('📜 Loading default Lua scripts...');
        
        for (const [type, script] of Object.entries(this.defaultScripts)) {
            this.saveScript(`${type}_default`, script, type);
            this.compileScript(`${type}_default`);
            console.log(`  ✅ Loaded ${type} default script`);
        }
    }
    
    saveScript(name, script, companionType = 'general') {
        this.scripts.set(name, {
            name,
            code: script,
            companionType,
            createdAt: Date.now(),
            lastModified: Date.now()
        });
        
        console.log(`💾 Saved Lua script: ${name} (${companionType})`);
    }
    
    compileScript(name) {
        const script = this.scripts.get(name);
        if (!script) {
            return { success: false, error: 'Script not found' };
        }
        
        try {
            const jsCode = this.compileLuaToJS(script.code);
            
            this.compiledScripts.set(name, {
                originalLua: script.code,
                compiledJS: jsCode,
                compiledAt: Date.now()
            });
            
            console.log(`🔧 Compiled Lua script: ${name}`);
            return { success: true, compiledJS: jsCode };
            
        } catch (error) {
            console.error(`❌ Compilation failed for ${name}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    compileLuaToJS(luaCode) {
        let jsCode = luaCode;
        
        // Apply Lua to JavaScript conversion patterns
        this.luaToJsPatterns.forEach(pattern => {
            jsCode = jsCode.replace(pattern.lua, pattern.js);
        });
        
        // Add JavaScript runtime helpers
        const helpers = `
// Lua runtime helpers
function move_to(x, y, z) {
    if (typeof contextAPI !== 'undefined') {
        contextAPI.moveCompanion(x, y, z);
    }
}

function change_color(color) {
    if (typeof contextAPI !== 'undefined') {
        contextAPI.changeCompanionColor(color);
    }
}

function set_state(state) {
    if (typeof contextAPI !== 'undefined') {
        contextAPI.setCompanionState(state);
    }
}

function get_position() {
    if (typeof contextAPI !== 'undefined') {
        return contextAPI.getCompanionPosition();
    }
    return {x: 0, y: 0, z: 0};
}

function get_state() {
    if (typeof contextAPI !== 'undefined') {
        return contextAPI.getCompanionState();
    }
    return 'idle';
}

function scan_area(radius) {
    if (typeof contextAPI !== 'undefined') {
        return contextAPI.scanArea(radius);
    }
    return [];
}

function bridge_to_system(systemName, data) {
    if (typeof contextAPI !== 'undefined') {
        return contextAPI.bridgeToSystem(systemName, data);
    }
}

function emit_particles(type, position) {
    if (typeof contextAPI !== 'undefined') {
        contextAPI.emitParticles(type, position);
    }
}

function show_tooltip(text, duration) {
    if (typeof contextAPI !== 'undefined') {
        contextAPI.showTooltip(text, duration);
    }
}

function move_random() {
    const x = (Math.random() - 0.5) * 20;
    const y = Math.random() * 10 + 5;
    const z = (Math.random() - 0.5) * 20;
    move_to(x, y, z);
}

// Mathematical helpers
const math = {
    random: Math.random,
    floor: Math.floor,
    ceil: Math.ceil,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    pi: Math.PI
};

        `;
        
        return helpers + jsCode;
    }
    
    executeScript(name, context = {}) {
        const compiled = this.compiledScripts.get(name);
        if (!compiled) {
            return { success: false, error: 'Script not compiled' };
        }
        
        try {
            // Create execution context
            const contextAPI = this.createContextAPI(context);
            
            // Create sandboxed execution environment
            const sandbox = {
                console: { log: console.log, error: console.error },
                Math,
                Date,
                contextAPI,
                // Add any other safe globals
            };
            
            // Execute compiled JavaScript
            const func = new Function(...Object.keys(sandbox), compiled.compiledJS);
            const result = func(...Object.values(sandbox));
            
            console.log(`⚡ Executed Lua script: ${name}`);
            return { success: true, result };
            
        } catch (error) {
            console.error(`❌ Execution failed for ${name}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    createContextAPI(context) {
        return {
            // Companion control
            moveCompanion: (x, y, z) => {
                this.broadcast({
                    type: 'lua_command',
                    command: 'move_companion',
                    data: { x, y, z, companionId: context.companionId }
                });
            },
            
            changeCompanionColor: (color) => {
                this.broadcast({
                    type: 'lua_command',
                    command: 'change_color',
                    data: { color, companionId: context.companionId }
                });
            },
            
            setCompanionState: (state) => {
                this.broadcast({
                    type: 'lua_command',
                    command: 'set_state',
                    data: { state, companionId: context.companionId }
                });
            },
            
            getCompanionPosition: () => {
                return context.position || { x: 0, y: 0, z: 0 };
            },
            
            getCompanionState: () => {
                return context.state || 'idle';
            },
            
            // World interaction
            scanArea: (radius) => {
                // Return nearby voxels/objects
                return context.nearbyObjects || [];
            },
            
            // System bridges
            bridgeToSystem: async (systemName, data) => {
                const bridges = {
                    'documentToMVP': 'http://localhost:3001',
                    'characterMirror': 'http://localhost:7777', 
                    'universalCompactor': 'http://localhost:8080'
                };
                
                const url = bridges[systemName];
                if (!url) return { error: 'Unknown system' };
                
                try {
                    const response = await fetch(`${url}/api/lua-bridge`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    return await response.json();
                } catch (error) {
                    return { error: error.message };
                }
            },
            
            // Visual effects
            emitParticles: (type, position) => {
                this.broadcast({
                    type: 'lua_command',
                    command: 'emit_particles',
                    data: { type, position }
                });
            },
            
            showTooltip: (text, duration) => {
                this.broadcast({
                    type: 'lua_command',
                    command: 'show_tooltip',
                    data: { text, duration }
                });
            }
        };
    }
    
    evaluateLuaCode(luaCode, context = {}) {
        try {
            // Compile and execute immediately
            const jsCode = this.compileLuaToJS(luaCode);
            const contextAPI = this.createContextAPI(context);
            
            const sandbox = {
                console: { log: console.log },
                Math,
                contextAPI
            };
            
            const func = new Function(...Object.keys(sandbox), jsCode);
            const result = func(...Object.values(sandbox));
            
            return { success: true, result };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    setCompanionScript(companionId, scriptName) {
        this.scriptContext.set(companionId, scriptName);
        console.log(`🤖 Set script '${scriptName}' for companion ${companionId}`);
    }
    
    getCompanionScript(companionId) {
        const scriptName = this.scriptContext.get(companionId);
        if (scriptName) {
            return this.scripts.get(scriptName);
        }
        return null;
    }
    
    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'lua_eval':
                const result = this.evaluateLuaCode(message.code, message.context);
                ws.send(JSON.stringify({
                    type: 'lua_result',
                    result
                }));
                break;
                
            case 'compile_script':
                const compileResult = this.compileScript(message.scriptName);
                ws.send(JSON.stringify({
                    type: 'compile_result',
                    result: compileResult
                }));
                break;
        }
    }
    
    broadcast(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    // Trigger script events from external systems
    triggerScriptEvent(eventType, eventData) {
        this.scriptContext.forEach((scriptName, companionId) => {
            const script = this.scripts.get(scriptName);
            if (script) {
                // Execute event handler if it exists
                const context = {
                    companionId,
                    event: eventType,
                    data: eventData,
                    ...eventData
                };
                
                // Look for event handlers in the script
                if (script.code.includes(`on_${eventType}`)) {
                    this.executeScript(scriptName, context);
                }
            }
        });
    }
    
    getLuaIDE() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌙📜 Lua Companion Engine</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #2d1b69, #11998e);
            font-family: 'Courier New', monospace;
            color: #fff;
            height: 100vh;
            overflow: hidden;
        }
        
        .ide-container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: rgba(0, 0, 0, 0.7);
            padding: 20px;
            overflow-y: auto;
        }
        
        .main-editor {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .toolbar {
            height: 50px;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 10px;
        }
        
        .editor-area {
            flex: 1;
            display: flex;
        }
        
        .code-editor {
            flex: 1;
            background: #1e1e1e;
            border: none;
            color: #d4d4d4;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            padding: 20px;
            resize: none;
            outline: none;
        }
        
        .output-panel {
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            overflow-y: auto;
        }
        
        .script-item {
            margin: 10px 0;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            cursor: pointer;
        }
        
        .script-item:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .script-item.active {
            background: rgba(0, 255, 136, 0.3);
        }
        
        button {
            padding: 8px 15px;
            background: #00ff88;
            color: #000;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        button:hover {
            background: #00cc66;
        }
        
        button.secondary {
            background: #888;
            color: #fff;
        }
        
        button.secondary:hover {
            background: #aaa;
        }
        
        .output-line {
            margin: 5px 0;
            padding: 5px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
        }
        
        .output-line.error {
            background: rgba(255, 0, 0, 0.3);
        }
        
        .output-line.success {
            background: rgba(0, 255, 0, 0.3);
        }
        
        h3 {
            color: #00ff88;
            margin-top: 20px;
        }
        
        .companion-type {
            font-size: 12px;
            color: #ffaa00;
        }
        
        .quick-examples {
            margin-top: 20px;
        }
        
        .example-btn {
            display: block;
            width: 100%;
            margin: 5px 0;
            padding: 5px;
            background: rgba(255, 170, 0, 0.2);
            color: #ffaa00;
            border: 1px solid #ffaa00;
            text-align: left;
            cursor: pointer;
        }
        
        .example-btn:hover {
            background: rgba(255, 170, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="ide-container">
        <div class="sidebar">
            <h3>📜 Lua Scripts</h3>
            <div id="scriptList"></div>
            
            <div class="quick-examples">
                <h3>⚡ Quick Examples</h3>
                <button class="example-btn" onclick="loadExample('move')">Move Companion</button>
                <button class="example-btn" onclick="loadExample('color')">Change Color</button>
                <button class="example-btn" onclick="loadExample('scan')">Scan Area</button>
                <button class="example-btn" onclick="loadExample('bridge')">Bridge to System</button>
            </div>
            
            <h3>🤖 Active Companions</h3>
            <div id="companionList"></div>
        </div>
        
        <div class="main-editor">
            <div class="toolbar">
                <button onclick="saveScript()">💾 Save</button>
                <button onclick="compileScript()" class="secondary">🔧 Compile</button>
                <button onclick="executeScript()">▶️ Execute</button>
                <button onclick="newScript()" class="secondary">📄 New</button>
                <span style="margin-left: 20px; color: #ccc;">Script: <span id="currentScript">Untitled</span></span>
            </div>
            
            <div class="editor-area">
                <textarea id="codeEditor" class="code-editor" placeholder="-- Write your Lua code here
-- Available functions:
-- move_to(x, y, z)
-- change_color(color)
-- set_state(state)
-- scan_area(radius)
-- bridge_to_system(system, data)

function on_world_change(event)
    move_to(0, 10, 0)
    change_color('#00ff88')
end"></textarea>
                
                <div class="output-panel">
                    <h3>📟 Output</h3>
                    <div id="output"></div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:9998');
        let currentScriptName = null;
        let scripts = {};
        
        ws.onopen = () => {
            console.log('📜 Connected to Lua Engine');
            addOutput('Connected to Lua Engine', 'success');
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };
        
        function handleServerMessage(message) {
            switch (message.type) {
                case 'scripts_available':
                    loadScriptsList(message.scripts);
                    break;
                    
                case 'lua_result':
                    addOutput('Result: ' + JSON.stringify(message.result), 
                        message.result.success ? 'success' : 'error');
                    break;
                    
                case 'compile_result':
                    addOutput('Compile: ' + (message.result.success ? 'Success' : message.result.error),
                        message.result.success ? 'success' : 'error');
                    break;
            }
        }
        
        async function loadScriptsList(scriptNames) {
            const response = await fetch('/api/scripts');
            const scriptsData = await response.json();
            
            const list = document.getElementById('scriptList');
            list.innerHTML = '';
            
            scriptsData.forEach(script => {
                const div = document.createElement('div');
                div.className = 'script-item';
                div.innerHTML = \`
                    <strong>\${script.name}</strong><br>
                    <span class="companion-type">\${script.script.companionType || 'general'}</span><br>
                    <small>Compiled: \${script.compiled ? '✅' : '❌'}</small>
                \`;
                
                div.onclick = () => loadScript(script.name);
                list.appendChild(div);
                
                scripts[script.name] = script;
            });
        }
        
        async function loadScript(name) {
            currentScriptName = name;
            document.getElementById('currentScript').textContent = name;
            
            const script = scripts[name];
            if (script) {
                document.getElementById('codeEditor').value = script.script.code;
            }
            
            // Update active script indicator
            document.querySelectorAll('.script-item').forEach(item => {
                item.classList.remove('active');
                if (item.innerHTML.includes(name)) {
                    item.classList.add('active');
                }
            });
        }
        
        async function saveScript() {
            const code = document.getElementById('codeEditor').value;
            const name = currentScriptName || 'untitled_' + Date.now();
            
            const response = await fetch('/api/scripts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    script: code,
                    companionType: 'general'
                })
            });
            
            const result = await response.json();
            addOutput('Saved: ' + name, result.success ? 'success' : 'error');
            
            if (result.success) {
                currentScriptName = name;
                document.getElementById('currentScript').textContent = name;
                // Reload scripts list
                ws.send(JSON.stringify({ type: 'reload_scripts' }));
            }
        }
        
        async function compileScript() {
            if (!currentScriptName) {
                addOutput('No script selected', 'error');
                return;
            }
            
            ws.send(JSON.stringify({
                type: 'compile_script',
                scriptName: currentScriptName
            }));
        }
        
        async function executeScript() {
            const code = document.getElementById('codeEditor').value;
            
            const response = await fetch('/api/lua/eval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    context: {
                        companionId: 'lua_console_companion',
                        position: { x: 0, y: 5, z: 0 },
                        state: 'idle'
                    }
                })
            });
            
            const result = await response.json();
            addOutput('Execute: ' + JSON.stringify(result), 
                result.success ? 'success' : 'error');
        }
        
        function newScript() {
            currentScriptName = null;
            document.getElementById('currentScript').textContent = 'Untitled';
            document.getElementById('codeEditor').value = \`-- New Lua Script
function on_world_change(event)
    -- Your code here
end\`;
        }
        
        function loadExample(type) {
            const examples = {
                move: \`-- Move companion to random position
move_to(math.random() * 20 - 10, 5, math.random() * 20 - 10)
change_color('#00ff88')\`,
                
                color: \`-- Cycle through colors
local colors = {'#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'}
local colorIndex = math.floor(math.random() * 5) + 1
change_color(colors[colorIndex])\`,
                
                scan: \`-- Scan area and report
local results = scan_area(5)
for i, result in ipairs(results) do
    show_tooltip('Found: ' .. result.type, 2.0)
end\`,
                
                bridge: \`-- Bridge to Document-to-MVP system
bridge_to_system('documentToMVP', {
    action = 'analyze_content',
    position = get_position()
})\`
            };
            
            document.getElementById('codeEditor').value = examples[type] || '';
        }
        
        function addOutput(message, type = 'info') {
            const output = document.getElementById('output');
            const div = document.createElement('div');
            div.className = 'output-line ' + type;
            div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
            output.appendChild(div);
            output.scrollTop = output.scrollHeight;
        }
        
        // Load initial scripts
        setTimeout(() => {
            ws.send(JSON.stringify({ type: 'get_scripts' }));
        }, 1000);
    </script>
</body>
</html>`;
    }
}

// Start the Lua engine
if (require.main === module) {
    new LuaCompanionEngine();
}

module.exports = LuaCompanionEngine;
#!/usr/bin/env node

/**
 * LadderSlasher XML Extractor - Deep D2JSP Game Mechanics Parser
 * Extracts game XML mappings and converts to JSONL schema for agentic OS
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const WebSocket = require('ws');

class LadderSlasherExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.wsPort = 48001;
        this.outputDir = './ladderslasher-data';
        
        this.gameSchema = {
            version: "1.0.0",
            extracted: new Date().toISOString(),
            game_mechanics: {},
            xml_mappings: {},
            agent_patterns: {},
            os_components: {}
        };
        
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            textNodeName: "#text",
            parseAttributeValue: true,
            trimValues: true
        });
        
        console.log('🎮 LADDERSLASHER XML EXTRACTOR');
        console.log('==============================');
        console.log('🔍 Deep D2JSP game mechanics extraction');
        console.log('🗺️  XML mapping to JSONL schema');
        console.log('🤖 Agentic OS pattern discovery');
        console.log('');
        
        this.ensureOutputDir();
        this.startWebSocketServer();
    }
    
    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    
    startWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🔌 Client connected to LadderSlasher extractor');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleWebSocketMessage(ws, data);
            });
        });
        
        console.log(`🔌 LadderSlasher extractor WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'start_extraction':
                this.startExtraction(ws);
                break;
            case 'get_schema':
                ws.send(JSON.stringify({
                    type: 'schema_update',
                    schema: this.gameSchema
                }));
                break;
        }
    }
    
    async startExtraction(ws = null) {
        try {
            console.log('🚀 Starting LadderSlasher extraction...');
            this.broadcastUpdate(ws, 'Starting browser automation...');
            
            this.browser = await puppeteer.launch({
                headless: false, // Show browser for debugging
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1280, height: 720 });
            
            // Extract game mechanics step by step
            await this.extractGameInterface(ws);
            await this.extractXMLMappings(ws);
            await this.extractGameLogic(ws);
            await this.buildAgenticPatterns(ws);
            await this.generateJSONLSchema(ws);
            
            console.log('✅ LadderSlasher extraction complete!');
            this.broadcastUpdate(ws, 'Extraction complete - agentic OS schema ready');
            
        } catch (error) {
            console.error('❌ Extraction error:', error);
            this.broadcastUpdate(ws, `Error: ${error.message}`);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
    
    async extractGameInterface(ws) {
        console.log('🎮 Extracting LadderSlasher game interface...');
        this.broadcastUpdate(ws, 'Navigating to D2JSP LadderSlasher...');
        
        try {
            await this.page.goto('https://d2jsp.org/game.php?g=ladderslasher', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for game to load
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.log('⚠️ Could not access D2JSP directly, using simulation mode...');
            this.broadcastUpdate(ws, 'Using simulation mode for game mechanics...');
            return this.simulateGameInterface(ws);
        }
        
        // Extract game HTML structure
        const gameHTML = await this.page.evaluate(() => {
            const gameContainer = document.querySelector('#game_container') || 
                                document.querySelector('.game') ||
                                document.querySelector('[id*="game"]') ||
                                document.body;
            return gameContainer ? gameContainer.outerHTML : document.body.innerHTML;
        });
        
        // Save raw HTML
        fs.writeFileSync(path.join(this.outputDir, 'game_interface.html'), gameHTML);
        
        // Extract game state data
        const gameState = await this.page.evaluate(() => {
            const scripts = Array.from(document.scripts);
            const gameData = {};
            
            scripts.forEach(script => {
                if (script.textContent.includes('game') || script.textContent.includes('player')) {
                    const text = script.textContent;
                    
                    // Look for JavaScript objects/variables
                    const matches = text.match(/(?:var|let|const)\s+(\w*(?:game|player|stats|inventory|skills)\w*)\s*=\s*({[^}]+}|\[[^\]]+\]|[^;]+);/gi);
                    if (matches) {
                        matches.forEach(match => {
                            try {
                                const [, varName, value] = match.match(/(?:var|let|const)\s+(\w+)\s*=\s*([^;]+);/);
                                gameData[varName] = value;
                            } catch (e) {
                                // Skip invalid matches
                            }
                        });
                    }
                }
            });
            
            return gameData;
        });
        
        this.gameSchema.game_mechanics.interface = {
            html_structure: 'saved to game_interface.html',
            javascript_state: gameState,
            extracted_at: new Date().toISOString()
        };
        
        console.log('✅ Game interface extracted');
        this.broadcastUpdate(ws, 'Game interface structure captured');
    }
    
    async simulateGameInterface(ws) {
        console.log('🎮 Simulating LadderSlasher game interface...');
        this.broadcastUpdate(ws, 'Generating simulated game mechanics...');
        
        // Simulate typical LadderSlasher game mechanics based on known patterns
        const simulatedGameState = {
            player: {
                level: 1,
                experience: 0,
                stats: { strength: 10, dexterity: 10, vitality: 10, energy: 10 },
                inventory: [],
                skills: {},
                location: "town"
            },
            game: {
                mode: "ladderslasher",
                session_id: "sim_" + Date.now(),
                actions_available: ["attack", "defend", "cast_spell", "use_item", "move"],
                state: "active"
            },
            ui: {
                buttons: [
                    { id: "attack_btn", text: "Attack", action: "combat_action", type: "action" },
                    { id: "defend_btn", text: "Defend", action: "defensive_action", type: "action" },
                    { id: "inventory_btn", text: "Inventory", action: "open_inventory", type: "menu" },
                    { id: "stats_btn", text: "Stats", action: "show_stats", type: "menu" },
                    { id: "skills_btn", text: "Skills", action: "skill_tree", type: "menu" },
                    { id: "save_btn", text: "Save Game", action: "save_progress", type: "system" }
                ],
                forms: [
                    {
                        id: "combat_form",
                        action: "/game/combat",
                        method: "POST",
                        fields: [
                            { name: "action_type", type: "hidden", value: "attack" },
                            { name: "target_id", type: "hidden", value: "" },
                            { name: "skill_id", type: "select", options: ["basic_attack", "power_strike", "magic_missile"] }
                        ]
                    }
                ]
            }
        };
        
        this.gameSchema.game_mechanics.interface = {
            html_structure: 'simulated',
            javascript_state: simulatedGameState,
            extracted_at: new Date().toISOString(),
            simulation_mode: true
        };
        
        // Simulate XML structures
        const simulatedXML = `<?xml version="1.0" encoding="UTF-8"?>
<game_state>
    <player id="1" level="1">
        <stats strength="10" dexterity="10" vitality="10" energy="10" />
        <inventory slots="20" />
        <location zone="town" x="100" y="100" />
    </player>
    <game_config>
        <combat auto_battle="false" real_time="true" />
        <progression experience_curve="exponential" max_level="99" />
        <economy currency="gold" trading="enabled" />
    </game_config>
    <ui_elements>
        <button id="attack" action="combat" hotkey="1" />
        <button id="defend" action="defensive" hotkey="2" />
        <button id="inventory" action="menu" hotkey="i" />
    </ui_elements>
</game_state>`;
        
        // Parse simulated XML
        const parsedSimulatedXML = this.xmlParser.parse(simulatedXML);
        
        this.gameSchema.xml_mappings = {
            sources: {
                ajax_xml: [],
                embedded_xml: [{ type: 'simulated', content: simulatedXML }]
            },
            parsed_structures: {
                simulated_game_state: {
                    raw: simulatedXML,
                    parsed: parsedSimulatedXML,
                    source_type: 'simulation',
                    url: 'simulated'
                }
            },
            extraction_stats: {
                ajax_sources: 0,
                embedded_sources: 1,
                successfully_parsed: 1
            }
        };
        
        console.log('✅ Simulated game interface created');
        this.broadcastUpdate(ws, 'Simulation complete - proceeding with pattern extraction');
    }
    
    async extractXMLMappings(ws) {
        console.log('🗺️ Extracting XML mappings...');
        this.broadcastUpdate(ws, 'Analyzing XML data structures...');
        
        // Look for AJAX requests and XML responses
        const xmlData = await this.page.evaluate(() => {
            return new Promise((resolve) => {
                const xmlSources = [];
                
                // Override XMLHttpRequest to capture XML responses
                const originalOpen = XMLHttpRequest.prototype.open;
                const originalSend = XMLHttpRequest.prototype.send;
                
                XMLHttpRequest.prototype.open = function(method, url, async) {
                    this._url = url;
                    return originalOpen.apply(this, arguments);
                };
                
                XMLHttpRequest.prototype.send = function(data) {
                    const xhr = this;
                    
                    xhr.addEventListener('load', function() {
                        if (xhr.responseXML || xhr.responseText.includes('<?xml') || 
                            xhr.responseText.includes('<root') || xhr.responseText.includes('<game')) {
                            xmlSources.push({
                                url: xhr._url,
                                method: xhr._method || 'GET',
                                response: xhr.responseText,
                                status: xhr.status,
                                timestamp: new Date().toISOString()
                            });
                        }
                    });
                    
                    return originalSend.apply(this, arguments);
                };
                
                // Also check for existing XML in page source
                const existingXML = [];
                const scripts = Array.from(document.scripts);
                
                scripts.forEach(script => {
                    const content = script.textContent;
                    if (content.includes('<?xml') || content.includes('<root') || 
                        content.includes('<game') || content.includes('<player')) {
                        existingXML.push({
                            type: 'embedded_xml',
                            content: content,
                            source: 'script_tag'
                        });
                    }
                });
                
                // Look for data attributes with XML-like content
                const elements = Array.from(document.querySelectorAll('[data-game], [data-xml], [data-config]'));
                elements.forEach(el => {
                    Array.from(el.attributes).forEach(attr => {
                        if (attr.value.includes('<') || attr.value.includes('{')) {
                            existingXML.push({
                                type: 'data_attribute',
                                attribute: attr.name,
                                content: attr.value,
                                element: el.tagName
                            });
                        }
                    });
                });
                
                setTimeout(() => {
                    resolve({
                        ajax_xml: xmlSources,
                        embedded_xml: existingXML
                    });
                }, 3000);
            });
        });
        
        // Parse any found XML
        const parsedXML = {};
        
        [...xmlData.ajax_xml, ...xmlData.embedded_xml].forEach((source, index) => {
            try {
                const content = source.content || source.response;
                if (content && (content.includes('<?xml') || content.includes('<'))) {
                    const parsed = this.xmlParser.parse(content);
                    parsedXML[`source_${index}`] = {
                        raw: content,
                        parsed: parsed,
                        source_type: source.type || 'ajax',
                        url: source.url || 'embedded'
                    };
                }
            } catch (error) {
                console.log(`⚠️ Could not parse XML source ${index}:`, error.message);
            }
        });
        
        this.gameSchema.xml_mappings = {
            sources: xmlData,
            parsed_structures: parsedXML,
            extraction_stats: {
                ajax_sources: xmlData.ajax_xml.length,
                embedded_sources: xmlData.embedded_xml.length,
                successfully_parsed: Object.keys(parsedXML).length
            }
        };
        
        // Save raw XML data
        fs.writeFileSync(
            path.join(this.outputDir, 'xml_mappings.json'), 
            JSON.stringify(this.gameSchema.xml_mappings, null, 2)
        );
        
        console.log('✅ XML mappings extracted');
        this.broadcastUpdate(ws, `Found ${Object.keys(parsedXML).length} XML structures`);
    }
    
    async extractGameLogic(ws) {
        console.log('🧠 Extracting game logic patterns...');
        this.broadcastUpdate(ws, 'Analyzing game mechanics and logic...');
        
        // Try to interact with the game to discover mechanics
        const gameLogic = await this.page.evaluate(() => {
            const logic = {
                buttons: [],
                forms: [],
                interactive_elements: [],
                state_changes: [],
                event_handlers: []
            };
            
            // Find all interactive elements
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], .button, [onclick]'));
            buttons.forEach(btn => {
                logic.buttons.push({
                    text: btn.textContent?.trim() || btn.value || 'no text',
                    id: btn.id,
                    class: btn.className,
                    onclick: btn.onclick?.toString() || btn.getAttribute('onclick'),
                    type: btn.type || btn.tagName.toLowerCase()
                });
            });
            
            // Find forms
            const forms = Array.from(document.forms);
            forms.forEach(form => {
                const formData = {
                    action: form.action,
                    method: form.method,
                    fields: []
                };
                
                Array.from(form.elements).forEach(field => {
                    formData.fields.push({
                        name: field.name,
                        type: field.type,
                        value: field.value,
                        id: field.id
                    });
                });
                
                logic.forms.push(formData);
            });
            
            // Look for game-specific patterns
            const gameElements = Array.from(document.querySelectorAll('[id*="game"], [class*="game"], [id*="player"], [class*="player"], [id*="stats"], [class*="stats"]'));
            gameElements.forEach(el => {
                logic.interactive_elements.push({
                    id: el.id,
                    class: el.className,
                    tag: el.tagName,
                    content: el.textContent?.trim().substring(0, 100),
                    has_events: !!(el.onclick || el.onchange || el.onmousedown)
                });
            });
            
            return logic;
        });
        
        this.gameSchema.game_mechanics.logic = gameLogic;
        
        console.log('✅ Game logic patterns extracted');
        this.broadcastUpdate(ws, `Found ${gameLogic.buttons.length} interactive elements`);
    }
    
    async buildAgenticPatterns(ws) {
        console.log('🤖 Building agentic patterns...');
        this.broadcastUpdate(ws, 'Converting game mechanics to agent patterns...');
        
        const agenticPatterns = {
            decision_trees: [],
            state_machines: [],
            action_patterns: [],
            learning_opportunities: [],
            os_components: []
        };
        
        // Convert buttons to decision trees
        if (this.gameSchema.game_mechanics.logic?.buttons) {
            this.gameSchema.game_mechanics.logic.buttons.forEach(button => {
                agenticPatterns.decision_trees.push({
                    trigger: button.text,
                    condition: `user_wants_to_${button.text.toLowerCase().replace(/\s+/g, '_')}`,
                    action: button.onclick || `click_element("${button.id || button.class}")`,
                    expected_outcome: `game_state_change_after_${button.text.toLowerCase().replace(/\s+/g, '_')}`
                });
            });
        }
        
        // Convert forms to state machines
        if (this.gameSchema.game_mechanics.logic?.forms) {
            this.gameSchema.game_mechanics.logic.forms.forEach(form => {
                const stateMachine = {
                    name: `form_${form.action?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}`,
                    states: ['idle', 'filling', 'validating', 'submitting', 'completed'],
                    transitions: []
                };
                
                form.fields.forEach(field => {
                    stateMachine.transitions.push({
                        from: 'idle',
                        to: 'filling',
                        trigger: `focus_${field.name}`,
                        action: `populate_field("${field.name}", value)`
                    });
                });
                
                stateMachine.transitions.push({
                    from: 'filling',
                    to: 'submitting',
                    trigger: 'form_submit',
                    action: `submit_form("${form.action}")`
                });
                
                agenticPatterns.state_machines.push(stateMachine);
            });
        }
        
        // Extract action patterns
        agenticPatterns.action_patterns = [
            {
                pattern: 'click_and_wait',
                description: 'Click element and wait for response',
                implementation: 'async (selector) => { await click(selector); await waitForResponse(); }'
            },
            {
                pattern: 'fill_form_sequential',
                description: 'Fill form fields in sequence',
                implementation: 'async (formData) => { for (const field of formData) { await fillField(field); } }'
            },
            {
                pattern: 'monitor_state_changes',
                description: 'Monitor page for state changes',
                implementation: 'async () => { return await page.evaluate(() => checkGameState()); }'
            }
        ];
        
        // Identify learning opportunities
        agenticPatterns.learning_opportunities = [
            {
                type: 'reinforcement_learning',
                target: 'optimize_game_actions',
                reward_signal: 'score_increase || level_up || achievement_unlock'
            },
            {
                type: 'pattern_recognition',
                target: 'identify_optimal_strategies',
                data_source: 'game_state_sequences'
            },
            {
                type: 'predictive_modeling',
                target: 'predict_game_outcomes',
                features: 'current_stats + action_history + game_context'
            }
        ];
        
        // Design OS components based on game mechanics
        agenticPatterns.os_components = [
            {
                name: 'GameStateManager',
                purpose: 'Track and manage game state',
                methods: ['getCurrentState', 'updateState', 'rollbackState', 'predictNextState']
            },
            {
                name: 'ActionScheduler', 
                purpose: 'Schedule and execute game actions',
                methods: ['scheduleAction', 'executeAction', 'prioritizeActions', 'rollbackAction']
            },
            {
                name: 'DecisionEngine',
                purpose: 'Make strategic decisions',
                methods: ['evaluateOptions', 'makeDecision', 'learnFromOutcome', 'adaptStrategy']
            },
            {
                name: 'PatternRecognizer',
                purpose: 'Identify patterns in game data',
                methods: ['analyzePatterns', 'predictOutcomes', 'optimizeStrategies', 'discoverRules']
            }
        ];
        
        this.gameSchema.agent_patterns = agenticPatterns;
        
        console.log('✅ Agentic patterns built');
        this.broadcastUpdate(ws, 'Agent patterns ready for OS implementation');
    }
    
    async generateJSONLSchema(ws) {
        console.log('📋 Generating JSONL schema...');
        this.broadcastUpdate(ws, 'Converting to JSONL schema format...');
        
        const jsonlEntries = [];
        
        // Convert each component to JSONL format
        
        // Game mechanics entries
        if (this.gameSchema.game_mechanics.logic?.buttons) {
            this.gameSchema.game_mechanics.logic.buttons.forEach((button, index) => {
                jsonlEntries.push({
                    id: `button_${index}`,
                    type: 'ui_element',
                    category: 'interactive_button',
                    data: button,
                    agent_mapping: {
                        action: 'click',
                        trigger: button.text,
                        expected_result: 'state_change'
                    },
                    os_integration: {
                        component: 'ActionScheduler',
                        method: 'executeAction',
                        parameters: { element_id: button.id, action_type: 'click' }
                    }
                });
            });
        }
        
        // XML mapping entries
        Object.entries(this.gameSchema.xml_mappings.parsed_structures || {}).forEach(([key, xmlData]) => {
            jsonlEntries.push({
                id: `xml_${key}`,
                type: 'data_structure',
                category: 'xml_mapping',
                data: xmlData.parsed,
                agent_mapping: {
                    parser: 'xml_to_object',
                    schema: this.extractXMLSchema(xmlData.parsed),
                    update_frequency: 'on_change'
                },
                os_integration: {
                    component: 'GameStateManager',
                    method: 'updateState',
                    parameters: { source: 'xml_data', data: xmlData.parsed }
                }
            });
        });
        
        // Agent pattern entries
        this.gameSchema.agent_patterns.decision_trees.forEach((tree, index) => {
            jsonlEntries.push({
                id: `decision_tree_${index}`,
                type: 'decision_logic',
                category: 'agent_pattern',
                data: tree,
                agent_mapping: {
                    type: 'decision_tree',
                    condition: tree.condition,
                    action: tree.action
                },
                os_integration: {
                    component: 'DecisionEngine',
                    method: 'evaluateOptions',
                    parameters: { decision_tree: tree }
                }
            });
        });
        
        // OS component entries
        this.gameSchema.agent_patterns.os_components.forEach(component => {
            jsonlEntries.push({
                id: `os_component_${component.name.toLowerCase()}`,
                type: 'os_component',
                category: 'agentic_os',
                data: component,
                agent_mapping: {
                    class_name: component.name,
                    methods: component.methods,
                    purpose: component.purpose
                },
                os_integration: {
                    component: component.name,
                    instantiation: 'singleton',
                    dependencies: this.inferDependencies(component)
                }
            });
        });
        
        // Save JSONL file
        const jsonlContent = jsonlEntries.map(entry => JSON.stringify(entry)).join('\n');
        fs.writeFileSync(path.join(this.outputDir, 'agentic_os_schema.jsonl'), jsonlContent);
        
        // Save complete schema
        fs.writeFileSync(
            path.join(this.outputDir, 'complete_schema.json'), 
            JSON.stringify(this.gameSchema, null, 2)
        );
        
        // Generate summary stats
        const stats = {
            total_entries: jsonlEntries.length,
            categories: {
                ui_elements: jsonlEntries.filter(e => e.category === 'interactive_button').length,
                xml_mappings: jsonlEntries.filter(e => e.category === 'xml_mapping').length,
                agent_patterns: jsonlEntries.filter(e => e.category === 'agent_pattern').length,
                os_components: jsonlEntries.filter(e => e.category === 'agentic_os').length
            },
            extraction_complete: true,
            schema_version: this.gameSchema.version
        };
        
        fs.writeFileSync(
            path.join(this.outputDir, 'extraction_stats.json'), 
            JSON.stringify(stats, null, 2)
        );
        
        console.log('✅ JSONL schema generated');
        console.log(`📊 Stats: ${stats.total_entries} entries across ${Object.keys(stats.categories).length} categories`);
        
        this.broadcastUpdate(ws, `JSONL schema complete: ${stats.total_entries} entries`);
        
        return { jsonlEntries, stats };
    }
    
    extractXMLSchema(xmlObject) {
        const schema = {};
        
        function analyzeObject(obj, path = '') {
            if (typeof obj === 'object' && obj !== null) {
                Object.keys(obj).forEach(key => {
                    const fullPath = path ? `${path}.${key}` : key;
                    const value = obj[key];
                    
                    if (typeof value === 'object' && value !== null) {
                        schema[fullPath] = {
                            type: 'object',
                            structure: analyzeObject(value, fullPath)
                        };
                    } else {
                        schema[fullPath] = {
                            type: typeof value,
                            sample_value: value
                        };
                    }
                });
            }
        }
        
        analyzeObject(xmlObject);
        return schema;
    }
    
    inferDependencies(component) {
        const dependencies = [];
        
        // Basic dependency inference based on component purpose
        if (component.purpose.includes('state')) {
            dependencies.push('StateManager', 'DataStore');
        }
        if (component.purpose.includes('action')) {
            dependencies.push('EventEmitter', 'Logger');
        }
        if (component.purpose.includes('decision')) {
            dependencies.push('StateManager', 'PatternRecognizer');
        }
        if (component.purpose.includes('pattern')) {
            dependencies.push('DataAnalyzer', 'MLEngine');
        }
        
        return dependencies;
    }
    
    broadcastUpdate(ws, message) {
        const update = {
            type: 'extraction_update',
            message: message,
            timestamp: new Date().toISOString()
        };
        
        if (ws) {
            ws.send(JSON.stringify(update));
        }
        
        // Broadcast to all connected clients
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(update));
            }
        });
    }
    
    async generateAgenticOS() {
        console.log('🚀 Generating Agentic OS implementation...');
        
        // Ensure we have default OS components if extraction failed
        if (!this.gameSchema.agent_patterns || !this.gameSchema.agent_patterns.os_components) {
            this.gameSchema.agent_patterns = {
                os_components: [
                    { name: 'GameStateManager', purpose: 'Track and manage game state', methods: ['getCurrentState', 'updateState'] },
                    { name: 'ActionScheduler', purpose: 'Schedule and execute actions', methods: ['scheduleAction', 'executeAction'] },
                    { name: 'DecisionEngine', purpose: 'Make strategic decisions', methods: ['evaluateOptions', 'makeDecision'] },
                    { name: 'PatternRecognizer', purpose: 'Identify patterns', methods: ['analyzePatterns', 'predictOutcomes'] }
                ]
            };
        }
        
        const osImplementation = `
#!/usr/bin/env node

/**
 * LadderSlasher Agentic OS
 * Generated from D2JSP game mechanics extraction
 */

class LadderSlasherAgenticOS {
    constructor() {
        this.components = new Map();
        this.state = new Map();
        this.eventBus = new EventBus();
        
        this.initializeComponents();
    }
    
    initializeComponents() {
        // Initialize core OS components based on extracted patterns
        ${this.gameSchema.agent_patterns.os_components.map(comp => `
        this.components.set('${comp.name}', new ${comp.name}(this));`).join('')}
    }
    
    async processDecision(context) {
        const decisionEngine = this.components.get('DecisionEngine');
        return await decisionEngine.evaluateOptions(context);
    }
    
    async executeAction(action) {
        const actionScheduler = this.components.get('ActionScheduler');
        return await actionScheduler.executeAction(action);
    }
    
    async updateState(newState) {
        const stateManager = this.components.get('GameStateManager');
        return await stateManager.updateState(newState);
    }
}

// Component implementations
${this.gameSchema.agent_patterns.os_components.map(comp => `
class ${comp.name} {
    constructor(os) {
        this.os = os;
        this.purpose = "${comp.purpose}";
    }
    
    ${comp.methods.map(method => `
    async ${method}(params) {
        // Implementation for ${method}
        console.log('Executing ${method} in ${comp.name}');
        return { success: true, method: '${method}', params };
    }`).join('')}
}`).join('')}

class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

module.exports = LadderSlasherAgenticOS;
`;
        
        fs.writeFileSync(path.join(this.outputDir, 'ladderslasher_agentic_os.js'), osImplementation);
        
        console.log('✅ Agentic OS implementation generated');
        return osImplementation;
    }
}

// Auto-start if run directly
if (require.main === module) {
    const extractor = new LadderSlasherExtractor();
    
    // Auto-start extraction after 3 seconds
    setTimeout(async () => {
        await extractor.startExtraction();
        await extractor.generateAgenticOS();
        
        console.log('');
        console.log('🎯 EXTRACTION COMPLETE!');
        console.log('========================');
        console.log(`📁 Output directory: ${extractor.outputDir}`);
        console.log('📋 Files generated:');
        console.log('   - agentic_os_schema.jsonl (JSONL schema)');
        console.log('   - complete_schema.json (Full extraction)');
        console.log('   - ladderslasher_agentic_os.js (OS implementation)');
        console.log('   - xml_mappings.json (XML structures)');
        console.log('   - game_interface.html (Game UI)');
        console.log('   - extraction_stats.json (Summary stats)');
        console.log('');
        console.log('🔌 WebSocket server running for real-time updates');
        console.log(`   ws://localhost:${extractor.wsPort}`);
    }, 3000);
}

module.exports = LadderSlasherExtractor;
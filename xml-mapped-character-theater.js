#!/usr/bin/env node

/**
 * XML-MAPPED CHARACTER WORLD THEATER
 * Character theater with full XML integration and drone mapping
 * Ensures compatibility with all existing layers
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;

class XMLMappedCharacterTheater {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 9960;
        
        this.state = {
            mascots: new Map(),
            rooms: new Map(),
            activities: [],
            nextId: 1,
            xmlMappings: new Map(),
            droneConnections: new Map()
        };

        this.xmlState = {
            theater_metadata: {
                system_id: 'xml_mapped_character_theater',
                version: '1.0.0',
                integration_layer: 'character_world_building',
                drone_compatibility: true,
                xml_schema_version: '2.1.0'
            },
            active_mappings: new Map(),
            drone_registry: new Map(),
            xml_output_buffer: [],
            mapping_protocols: {
                inside_out: 'character_to_world_mapping',
                outside_in: 'world_to_character_mapping', 
                middle_out: 'theater_core_mapping',
                hierarchical: 'mascot_hierarchy_mapping',
                bidirectional: 'real_time_sync_mapping'
            }
        };

        this.personalities = [
            { name: "Builder Betty", style: "architect", colors: ["blue", "gray"], phrase: "Every pixel has its place!", xmlId: "mascot_architect_001" },
            { name: "Style Stella", style: "fashionista", colors: ["pink", "gold"], phrase: "Darling, we need MORE sparkles!", xmlId: "mascot_fashionista_001" },
            { name: "Code Casey", style: "techie", colors: ["green", "black"], phrase: "Have you tried turning it off and on again?", xmlId: "mascot_techie_001" },
            { name: "Paint Pablo", style: "artist", colors: ["rainbow", "purple"], phrase: "Art is controlled chaos, baby!", xmlId: "mascot_artist_001" },
            { name: "Quest Quinn", style: "gamer", colors: ["yellow", "blue"], phrase: "This needs more achievements!", xmlId: "mascot_gamer_001" }
        ];

        this.setupXMLDroneIntegration();
        this.setupRoutes();
        this.setupWebSocket();
        this.startXMLMappingLoop();
    }

    async setupXMLDroneIntegration() {
        // Connect to existing XML drone mapper
        try {
            this.droneConnection = new WebSocket('ws://localhost:9850');
            
            this.droneConnection.on('open', () => {
                console.log('🤖 Connected to XML Drone Mapper');
                this.registerWithDroneSystem();
            });

            this.droneConnection.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleDroneMessage(message);
                } catch (e) {
                    console.log('Drone message parse error:', e);
                }
            });

        } catch (error) {
            console.log('XML Drone connection failed, running standalone');
        }

        // Initialize XML mapping directories
        await this.initializeXMLDirectories();
    }

    async initializeXMLDirectories() {
        const xmlDirs = [
            'xml_mappings/characters',
            'xml_mappings/worlds', 
            'xml_mappings/activities',
            'xml_mappings/drone_integration'
        ];

        for (const dir of xmlDirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (e) {
                // Directory exists or creation failed, continue
            }
        }
    }

    registerWithDroneSystem() {
        const registrationData = {
            type: 'system_registration',
            system_id: this.xmlState.theater_metadata.system_id,
            capabilities: [
                'character_world_mapping',
                'real_time_xml_generation', 
                'mascot_behavior_tracking',
                'world_building_documentation',
                'activity_stream_mapping'
            ],
            endpoints: {
                xml_output: `http://localhost:${this.port}/api/xml/mappings`,
                live_feed: `ws://localhost:${this.port}`,
                character_data: `http://localhost:${this.port}/api/characters/xml`
            },
            integration_priority: 'high',
            auto_sync: true
        };

        if (this.droneConnection && this.droneConnection.readyState === WebSocket.OPEN) {
            this.droneConnection.send(JSON.stringify(registrationData));
        }
    }

    handleDroneMessage(message) {
        switch (message.type) {
            case 'mapping_request':
                this.executeXMLMapping(message.parameters);
                break;
            case 'sync_request':
                this.syncWithDroneSystem(message.data);
                break;
            case 'validation_check':
                this.validateXMLIntegrity(message.validation_id);
                break;
        }
    }

    async executeXMLMapping(parameters) {
        const mappingType = parameters.strategy || 'bidirectional';
        const target = parameters.target || 'all_characters';
        
        console.log(`🗺️ Executing ${mappingType} XML mapping for ${target}`);
        
        const xmlData = await this.generateXMLMapping(mappingType, target);
        
        // Save to file
        const filename = `xml_mappings/${mappingType}_${target}_${Date.now()}.xml`;
        await fs.writeFile(filename, xmlData);
        
        // Send to drone system
        if (this.droneConnection && this.droneConnection.readyState === WebSocket.OPEN) {
            this.droneConnection.send(JSON.stringify({
                type: 'mapping_complete',
                strategy: mappingType,
                target: target,
                xml_file: filename,
                xml_data: xmlData,
                timestamp: new Date().toISOString()
            }));
        }

        this.addActivity(`🗺️ XML mapping completed: ${mappingType} → ${target}`);
        this.broadcast({ type: 'xml_mapping_complete', strategy: mappingType, target });
    }

    async generateXMLMapping(strategy, target) {
        const timestamp = new Date().toISOString();
        let xmlContent = '';

        switch (strategy) {
            case 'inside_out':
                xmlContent = this.generateInsideOutXML();
                break;
            case 'outside_in':
                xmlContent = this.generateOutsideInXML();
                break;
            case 'middle_out':
                xmlContent = this.generateMiddleOutXML();
                break;
            case 'hierarchical':
                xmlContent = this.generateHierarchicalXML();
                break;
            case 'bidirectional':
                xmlContent = this.generateBidirectionalXML();
                break;
            default:
                xmlContent = this.generateDefaultXML();
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<character_theater_mapping>
    <metadata>
        <system_id>${this.xmlState.theater_metadata.system_id}</system_id>
        <mapping_strategy>${strategy}</mapping_strategy>
        <target>${target}</target>
        <timestamp>${timestamp}</timestamp>
        <drone_compatible>true</drone_compatible>
    </metadata>
    ${xmlContent}
</character_theater_mapping>`;
    }

    generateInsideOutXML() {
        let xml = '<inside_out_mapping>\n';
        
        for (const [id, mascot] of this.state.mascots) {
            xml += `    <mascot id="${id}" xml_id="${mascot.xmlId}">
        <core_personality>
            <name>${this.escapeXML(mascot.name)}</name>
            <style>${mascot.personality}</style>
            <energy_level>${mascot.energy}</energy_level>
            <mood_state>${mascot.mood}</mood_state>
        </core_personality>
        <internal_state>
            <current_activity>${mascot.activity}</current_activity>
            <build_progress>${mascot.buildProgress || 0}</build_progress>
            <phrase>${this.escapeXML(mascot.phrase)}</phrase>
        </internal_state>
        <world_connections>
            ${mascot.currentRoom ? `<owns_room>${mascot.currentRoom}</owns_room>` : ''}
            <color_preferences>${mascot.colors.join(',')}</color_preferences>
        </world_connections>
    </mascot>\n`;
        }
        
        xml += '</inside_out_mapping>\n';
        return xml;
    }

    generateOutsideInXML() {
        let xml = '<outside_in_mapping>\n';
        
        xml += '    <world_structure>\n';
        for (const [id, room] of this.state.rooms) {
            xml += `        <room id="${id}">
            <name>${this.escapeXML(room.name)}</name>
            <type>${room.type}</type>
            <owner_reference>${room.owner}</owner_reference>
            <style>${room.style}</style>
            <completion_date>${room.completed}</completion_date>
            <rating>${room.rating}</rating>
        </room>\n`;
        }
        xml += '    </world_structure>\n';
        
        xml += '    <external_interfaces>\n';
        xml += `        <theater_endpoint>http://localhost:${this.port}</theater_endpoint>\n`;
        xml += `        <websocket_feed>ws://localhost:${this.port}</websocket_feed>\n`;
        xml += '        <drone_integration>active</drone_integration>\n';
        xml += '    </external_interfaces>\n';
        
        xml += '</outside_in_mapping>\n';
        return xml;
    }

    generateMiddleOutXML() {
        let xml = '<middle_out_mapping>\n';
        
        xml += '    <theater_core>\n';
        xml += `        <active_mascots>${this.state.mascots.size}</active_mascots>\n`;
        xml += `        <completed_rooms>${this.state.rooms.size}</completed_rooms>\n`;
        xml += `        <total_activities>${this.state.activities.length}</total_activities>\n`;
        xml += `        <system_uptime>${Date.now()}</system_uptime>\n`;
        xml += '    </theater_core>\n';
        
        xml += '    <activity_streams>\n';
        for (const activity of this.state.activities.slice(-10)) {
            xml += `        <activity id="${activity.id}">
            <message>${this.escapeXML(activity.message)}</message>
            <timestamp>${activity.timestamp}</timestamp>
        </activity>\n`;
        }
        xml += '    </activity_streams>\n';
        
        xml += '</middle_out_mapping>\n';
        return xml;
    }

    generateHierarchicalXML() {
        let xml = '<hierarchical_mapping>\n';
        
        xml += '    <system_hierarchy>\n';
        xml += '        <level_1_theater_controller>\n';
        xml += `            <system_id>${this.xmlState.theater_metadata.system_id}</system_id>\n`;
        xml += '            <level_2_mascot_managers>\n';
        
        for (const [id, mascot] of this.state.mascots) {
            xml += `                <mascot_manager id="${id}">
                    <personality_type>${mascot.personality}</personality_type>
                    <level_3_behavior_controllers>
                        <building_controller active="${mascot.activity.includes('building')}"/>
                        <fashion_controller active="${mascot.activity.includes('fashion')}"/>
                        <social_controller active="${mascot.activity.includes('social')}"/>
                    </level_3_behavior_controllers>
                </mascot_manager>\n`;
        }
        
        xml += '            </level_2_mascot_managers>\n';
        xml += '        </level_1_theater_controller>\n';
        xml += '    </system_hierarchy>\n';
        
        xml += '</hierarchical_mapping>\n';
        return xml;
    }

    generateBidirectionalXML() {
        let xml = '<bidirectional_mapping>\n';
        
        xml += '    <real_time_sync>\n';
        xml += `        <last_sync>${new Date().toISOString()}</last_sync>\n`;
        xml += `        <sync_interval>1000</sync_interval>\n`;
        xml += '        <bidirectional_channels>\n';
        xml += '            <mascot_to_world>active</mascot_to_world>\n';
        xml += '            <world_to_mascot>active</world_to_mascot>\n';
        xml += '            <theater_to_drone>active</theater_to_drone>\n';
        xml += '            <drone_to_theater>active</drone_to_theater>\n';
        xml += '        </bidirectional_channels>\n';
        xml += '    </real_time_sync>\n';
        
        xml += '    <live_data_streams>\n';
        for (const [id, mascot] of this.state.mascots) {
            xml += `        <mascot_stream id="${id}">
            <live_activity>${mascot.activity}</live_activity>
            <energy_stream>${mascot.energy}</energy_stream>
            <mood_stream>${mascot.mood}</mood_stream>
        </mascot_stream>\n`;
        }
        xml += '    </live_data_streams>\n';
        
        xml += '</bidirectional_mapping>\n';
        return xml;
    }

    generateDefaultXML() {
        return `<default_mapping>
    <theater_snapshot>
        <mascots>${this.state.mascots.size}</mascots>
        <rooms>${this.state.rooms.size}</rooms>
        <activities>${this.state.activities.length}</activities>
    </theater_snapshot>
</default_mapping>`;
    }

    escapeXML(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    startXMLMappingLoop() {
        // Automatically generate XML mappings every 30 seconds
        setInterval(async () => {
            if (this.state.mascots.size > 0) {
                await this.executeXMLMapping({
                    strategy: 'bidirectional',
                    target: 'all_active_systems'
                });
            }
        }, 30000);

        console.log('🗺️ XML mapping loop started - auto-mapping every 30s');
    }

    setupRoutes() {
        this.app.use(express.json());

        this.app.get('/', (req, res) => {
            res.send(this.getEnhancedTheaterHTML());
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                mascots: Array.from(this.state.mascots.values()),
                rooms: Array.from(this.state.rooms.values()),
                activities: this.state.activities.slice(-10),
                xml_mappings: this.xmlState.active_mappings.size,
                drone_connected: this.droneConnection && this.droneConnection.readyState === WebSocket.OPEN
            });
        });

        this.app.get('/api/xml/mappings', async (req, res) => {
            const strategy = req.query.strategy || 'bidirectional';
            const target = req.query.target || 'all_characters';
            
            const xmlData = await this.generateXMLMapping(strategy, target);
            res.set('Content-Type', 'application/xml');
            res.send(xmlData);
        });

        this.app.get('/api/characters/xml', (req, res) => {
            const charactersXML = this.generateCharactersOnlyXML();
            res.set('Content-Type', 'application/xml');
            res.send(charactersXML);
        });

        this.app.post('/api/spawn', (req, res) => {
            const mascot = this.spawnMascot();
            res.json(mascot);
        });

        this.app.post('/api/xml/manual-mapping', async (req, res) => {
            const { strategy, target } = req.body;
            await this.executeXMLMapping({ strategy, target });
            res.json({ status: 'mapping_initiated', strategy, target });
        });
    }

    generateCharactersOnlyXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<characters>\n';
        
        for (const [id, mascot] of this.state.mascots) {
            xml += `    <character id="${id}" xml_id="${mascot.xmlId}">
        <name>${this.escapeXML(mascot.name)}</name>
        <personality>${mascot.personality}</personality>
        <energy>${mascot.energy}</energy>
        <mood>${mascot.mood}</mood>
        <activity>${mascot.activity}</activity>
        <phrase>${this.escapeXML(mascot.phrase)}</phrase>
        <colors>${mascot.colors.join(',')}</colors>
        ${mascot.currentRoom ? `<current_room>${mascot.currentRoom}</current_room>` : ''}
    </character>\n`;
        }
        
        xml += '</characters>';
        return xml;
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('👀 New spectator joined XML Theater!');
            
            ws.send(JSON.stringify({
                type: 'welcome',
                mascots: Array.from(this.state.mascots.values()),
                rooms: Array.from(this.state.rooms.values()),
                xml_integration: true,
                drone_connected: this.droneConnection && this.droneConnection.readyState === WebSocket.OPEN
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(data);
                } catch (e) {
                    console.log('Invalid message:', e);
                }
            });
        });
    }

    handleMessage(data) {
        switch (data.type) {
            case 'spawn_mascot':
                this.spawnMascot();
                break;
            case 'cheer':
                this.cheerMascot(data.mascotId);
                break;
            case 'xml_mapping_request':
                this.executeXMLMapping(data.parameters || {});
                break;
        }
    }

    spawnMascot() {
        const personality = this.personalities[Math.floor(Math.random() * this.personalities.length)];
        const mascot = {
            id: `mascot_${this.state.nextId++}`,
            xmlId: `${personality.xmlId}_${Date.now()}`,
            name: `${personality.name} #${Math.floor(Math.random() * 999)}`,
            personality: personality.style,
            colors: personality.colors,
            phrase: personality.phrase,
            energy: 100,
            mood: 'excited',
            activity: 'spawning',
            spawnTime: new Date().toISOString()
        };

        this.state.mascots.set(mascot.id, mascot);
        this.addActivity(`🎨 ${mascot.name} has appeared! (XML ID: ${mascot.xmlId})`);
        this.broadcast({ type: 'mascot_spawned', mascot });

        // Trigger XML mapping for new mascot
        setTimeout(() => {
            this.executeXMLMapping({
                strategy: 'inside_out',
                target: `mascot_${mascot.id}`
            });
        }, 1000);

        // Start building after 2 seconds
        setTimeout(() => this.startBuilding(mascot.id), 2000);
        
        return mascot;
    }

    startBuilding(mascotId) {
        const mascot = this.state.mascots.get(mascotId);
        if (!mascot) return;

        const roomTypes = ["Studio", "Workshop", "Lounge", "Gallery", "Hideout"];
        const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        
        mascot.activity = `building_${roomType.toLowerCase()}`;
        mascot.buildProgress = 0;
        mascot.buildTarget = roomType;

        this.addActivity(`🏗️ ${mascot.name} started building a ${roomType}! (XML tracking active)`);
        this.broadcast({ 
            type: 'building_started', 
            mascot,
            announcement: `${mascot.phrase} Time to build a ${roomType}!`,
            xml_tracked: true
        });

        this.simulateBuilding(mascotId);
    }

    async simulateBuilding(mascotId) {
        const mascot = this.state.mascots.get(mascotId);
        if (!mascot) return;

        const phases = [
            { name: 'foundation', progress: 0.2, message: 'Laying the foundation...', duration: 3000 },
            { name: 'walls', progress: 0.4, message: 'Building walls...', duration: 2500 },
            { name: 'interior', progress: 0.7, message: 'Designing interior...', duration: 3500 },
            { name: 'decorating', progress: 0.9, message: 'Adding decorations...', duration: 2000 },
            { name: 'finishing', progress: 1.0, message: 'Final touches...', duration: 1500 }
        ];

        for (const phase of phases) {
            mascot.buildProgress = phase.progress;
            mascot.buildPhase = phase.name;
            
            const commentary = this.getBuildingCommentary(mascot, phase);
            
            this.addActivity(`⚡ ${mascot.name}: ${commentary} [XML: Phase ${phase.name}]`);
            this.broadcast({ 
                type: 'building_progress', 
                mascotId,
                phase: phase.name,
                progress: phase.progress,
                commentary,
                visual: this.getVisualEffect(phase.name),
                xml_phase_data: {
                    phase_id: `${mascotId}_${phase.name}`,
                    progress_percentage: phase.progress * 100,
                    xml_timestamp: new Date().toISOString()
                }
            });

            // Update XML mapping during build
            if (phase.progress === 0.5) {
                await this.executeXMLMapping({
                    strategy: 'middle_out',
                    target: `building_progress_${mascotId}`
                });
            }

            await this.sleep(phase.duration);
        }

        this.completeBuilding(mascotId);
    }

    completeBuilding(mascotId) {
        const mascot = this.state.mascots.get(mascotId);
        if (!mascot) return;

        const room = {
            id: `room_${this.state.nextId++}`,
            xmlId: `xml_room_${mascotId}_${Date.now()}`,
            name: `${mascot.name}'s ${mascot.buildTarget}`,
            owner: mascot.name,
            type: mascot.buildTarget,
            style: mascot.personality,
            colors: mascot.colors,
            completed: new Date().toISOString(),
            rating: Math.floor(Math.random() * 5) + 1
        };

        this.state.rooms.set(room.id, room);
        mascot.activity = 'celebrating';
        mascot.currentRoom = room.id;

        this.addActivity(`🎉 ${mascot.name} completed their ${mascot.buildTarget}! (XML Room ID: ${room.xmlId})`);
        this.broadcast({ 
            type: 'building_completed', 
            mascot,
            room,
            celebration: true,
            message: `${mascot.phrase} BUILDING COMPLETE!`,
            xml_completion_data: {
                room_xml_id: room.xmlId,
                completion_timestamp: room.completed,
                mapping_triggered: true
            }
        });

        // Trigger comprehensive XML mapping for completed build
        setTimeout(async () => {
            await this.executeXMLMapping({
                strategy: 'hierarchical',
                target: `completed_build_${room.id}`
            });
        }, 1000);

        // Start outfit customization after 3 seconds
        setTimeout(() => this.startOutfitCustomization(mascotId), 3000);
    }

    startOutfitCustomization(mascotId) {
        const mascot = this.state.mascots.get(mascotId);
        if (!mascot) return;

        mascot.activity = 'fashion_show';
        this.addActivity(`👗 ${mascot.name} is trying on outfits! (XML fashion tracking)`);
        this.broadcast({ 
            type: 'outfit_session', 
            mascot,
            message: `Fashion show time! ${mascot.phrase}`,
            xml_fashion_session: true
        });

        this.simulateOutfitTrying(mascotId);
    }

    async simulateOutfitTrying(mascotId) {
        const mascot = this.state.mascots.get(mascotId);
        if (!mascot) return;

        const outfits = ['Casual', 'Formal', 'Funky', 'Elegant', 'Sporty'];
        
        for (let i = 0; i < 3; i++) {
            const outfit = outfits[Math.floor(Math.random() * outfits.length)];
            const reaction = this.getOutfitReaction(mascot, outfit);
            
            this.addActivity(`👔 ${mascot.name} tries ${outfit}: "${reaction}" [XML tracked]`);
            this.broadcast({ 
                type: 'outfit_change', 
                mascotId,
                outfit,
                reaction,
                rating: Math.floor(Math.random() * 5) + 1,
                xml_outfit_data: {
                    outfit_id: `${mascotId}_outfit_${i}`,
                    outfit_type: outfit,
                    xml_timestamp: new Date().toISOString()
                }
            });

            await this.sleep(2000);
        }

        const finalOutfit = outfits[Math.floor(Math.random() * outfits.length)];
        mascot.outfit = finalOutfit;
        mascot.activity = 'relaxing';

        this.addActivity(`✨ ${mascot.name} chose their ${finalOutfit} look! (XML finalized)`);
        this.broadcast({ 
            type: 'outfit_finalized', 
            mascot,
            outfit: finalOutfit,
            message: "This is THE look! I feel fabulous!",
            xml_final_outfit: {
                final_outfit_id: `${mascotId}_final_${finalOutfit}`,
                selection_timestamp: new Date().toISOString()
            }
        });

        // Trigger fashion XML mapping
        setTimeout(async () => {
            await this.executeXMLMapping({
                strategy: 'outside_in',
                target: `fashion_complete_${mascotId}`
            });
        }, 1000);

        setTimeout(() => this.randomActivity(mascotId), 10000);
    }

    randomActivity(mascotId) {
        const mascot = this.state.mascots.get(mascotId);
        if (!mascot) return;

        const activities = [
            { name: 'exploring', message: 'exploring other rooms' },
            { name: 'decorating', message: 'redecorating their space' },
            { name: 'socializing', message: 'chatting with other mascots' },
            { name: 'planning', message: 'planning their next project' }
        ];

        const activity = activities[Math.floor(Math.random() * activities.length)];
        mascot.activity = activity.name;

        this.addActivity(`🎭 ${mascot.name} is ${activity.message} [XML activity tracking]`);
        this.broadcast({ 
            type: 'activity_update', 
            mascot, 
            activity: activity.name,
            xml_activity_logged: true
        });

        setTimeout(() => this.randomActivity(mascotId), Math.random() * 20000 + 10000);
    }

    getBuildingCommentary(mascot, phase) {
        const comments = {
            foundation: [
                `${mascot.phrase} Foundation is everything!`,
                "Making sure this is rock solid!",
                "Perfect foundation for my masterpiece!",
                "This needs to be STABLE!"
            ],
            walls: [
                "These walls are going to be amazing!",
                `I'm thinking ${mascot.colors[0]} would look perfect...`,
                "Walls up! Now we're getting somewhere!",
                "Each wall tells a story!"
            ],
            interior: [
                "Interior design time! This is where I shine!",
                "Every room needs personality!",
                "The layout is coming together beautifully!",
                "This space is going to be so functional!"
            ],
            decorating: [
                "Decoration mode: ACTIVATED!",
                "More color! More style!",
                "This needs something special... AHA!",
                "Every detail matters!"
            ],
            finishing: [
                "Final touches... perfect!",
                "Almost done... just one more thing!",
                "This is definitely portfolio material!",
                "Ready for the grand reveal!"
            ]
        };

        const phaseComments = comments[phase.name] || ["Working hard!"];
        return phaseComments[Math.floor(Math.random() * phaseComments.length)];
    }

    getOutfitReaction(mascot, outfit) {
        const reactions = [
            `This ${outfit} look is... interesting!`,
            `OMG this ${outfit} style is PERFECT!`,
            `Not sure about this... needs more ${mascot.colors[0]}!`,
            `This gives me +100 confidence!`,
            `Fashion level: MAXIMUM!`,
            `Hmm, this is nice but I can do better...`,
            `Do these colors work together?`
        ];
        return reactions[Math.floor(Math.random() * reactions.length)];
    }

    getVisualEffect(phase) {
        const effects = {
            foundation: 'ground_sparkles',
            walls: 'construction_dust',
            interior: 'paint_splashes',
            decorating: 'glitter_rain',
            finishing: 'celebration_fireworks'
        };
        return effects[phase] || 'generic_sparkles';
    }

    cheerMascot(mascotId) {
        const mascot = this.state.mascots.get(mascotId);
        if (!mascot) return;

        mascot.energy = Math.min(100, mascot.energy + 25);
        mascot.mood = 'euphoric';

        this.addActivity(`📣 ${mascot.name} feels the love! Energy: ${mascot.energy}% [XML mood tracked]`);
        this.broadcast({ 
            type: 'mascot_cheered', 
            mascot,
            message: "Thank you! That really motivates me!",
            xml_mood_update: {
                energy_boost: 25,
                new_mood: 'euphoric',
                xml_timestamp: new Date().toISOString()
            }
        });
    }

    addActivity(message) {
        this.state.activities.push({
            id: this.state.nextId++,
            message,
            timestamp: new Date().toISOString(),
            xmlLogged: true
        });

        if (this.state.activities.length > 50) {
            this.state.activities = this.state.activities.slice(-50);
        }
    }

    broadcast(data) {
        const message = JSON.stringify({
            ...data,
            xml_integration_active: true,
            drone_synced: this.droneConnection && this.droneConnection.readyState === WebSocket.OPEN
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getEnhancedTheaterHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎭 XML-Mapped Character World Theater</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Comic Sans MS', cursive;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            color: white;
            min-height: 100vh;
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .header {
            text-align: center;
            padding: 20px;
            background: rgba(0,0,0,0.8);
            margin-bottom: 20px;
        }

        .title {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        }

        .xml-status {
            background: rgba(0,255,0,0.2);
            padding: 5px 15px;
            border-radius: 15px;
            display: inline-block;
            margin: 5px;
            font-size: 0.9em;
        }

        .controls {
            text-align: center;
            margin: 20px;
        }

        .btn {
            background: linear-gradient(45deg, #ff6b6b, #ff8a80);
            border: none;
            color: white;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 25px;
            margin: 0 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            font-weight: bold;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .btn.cheer {
            background: linear-gradient(45deg, #ffd93d, #ff6b6b);
        }

        .btn.xml {
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
        }

        .theater {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px;
            max-width: 1200px;
            margin: 20px auto;
        }

        .panel {
            background: rgba(0,0,0,0.8);
            border-radius: 15px;
            padding: 20px;
            min-height: 300px;
        }

        .panel h2 {
            color: #4ecdc4;
            margin-bottom: 15px;
            text-align: center;
        }

        .mascot-card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #4ecdc4;
        }

        .mascot-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #ffd93d;
        }

        .mascot-status {
            font-size: 0.9em;
            margin: 5px 0;
            opacity: 0.8;
        }

        .xml-id {
            font-size: 0.8em;
            color: #4ecdc4;
            font-family: monospace;
        }

        .progress-bar {
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            height: 20px;
            margin: 10px 0;
            overflow: hidden;
        }

        .progress-fill {
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
            height: 100%;
            border-radius: 10px;
            transition: width 0.5s ease;
        }

        .activity-feed {
            grid-column: 1 / -1;
            max-height: 300px;
            overflow-y: auto;
        }

        .activity-item {
            background: rgba(255,255,255,0.1);
            margin: 5px 0;
            padding: 10px;
            border-radius: 8px;
            border-left: 3px solid #ffd93d;
            animation: slideIn 0.5s ease;
        }

        .activity-item.xml-tracked {
            border-left-color: #4ecdc4;
            background: rgba(78,205,196,0.1);
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .timestamp {
            font-size: 0.8em;
            opacity: 0.6;
            margin-right: 10px;
        }

        .celebration {
            animation: celebrate 2s ease-in-out;
        }

        @keyframes celebrate {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .xml-panel {
            grid-column: 1 / -1;
            background: rgba(0,0,0,0.9);
            border: 2px solid #4ecdc4;
        }

        .xml-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .xml-metric {
            background: rgba(78,205,196,0.1);
            padding: 10px;
            border-radius: 8px;
            text-align: center;
        }

        @media (max-width: 768px) {
            .theater {
                grid-template-columns: 1fr;
            }
            .title {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">🎭 XML-Mapped Character World Theater</h1>
        <p>Watch your mascots build amazing worlds with full XML integration!</p>
        <div class="xml-status">🗺️ XML Drone Integration Active</div>
        <div class="xml-status" id="drone-status">🤖 Drone Status: Connecting...</div>
    </div>

    <div class="controls">
        <button class="btn" onclick="spawnMascot()">🎨 Spawn Mascot</button>
        <button class="btn cheer" onclick="cheerAll()">📣 Cheer Everyone</button>
        <button class="btn xml" onclick="triggerXMLMapping()">🗺️ Manual XML Mapping</button>
    </div>

    <div class="theater">
        <div class="panel">
            <h2>🎭 Active Mascots</h2>
            <div id="mascot-list">
                <p style="text-align: center; opacity: 0.7;">Click "Spawn Mascot" to begin!</p>
            </div>
        </div>

        <div class="panel">
            <h2>🏗️ Building View</h2>
            <div id="building-view">
                <p style="text-align: center; opacity: 0.7;">Building activities will appear here...</p>
            </div>
        </div>

        <div class="panel xml-panel">
            <h2>🗺️ XML Integration Status</h2>
            <div class="xml-info">
                <div class="xml-metric">
                    <div style="font-size: 1.5em; color: #4ecdc4;">0</div>
                    <div>XML Mappings</div>
                </div>
                <div class="xml-metric">
                    <div style="font-size: 1.5em; color: #ffd93d;" id="mascot-count">0</div>
                    <div>Active Mascots</div>
                </div>
                <div class="xml-metric">
                    <div style="font-size: 1.5em; color: #ff6b6b;" id="room-count">0</div>
                    <div>Built Rooms</div>
                </div>
                <div class="xml-metric">
                    <div style="font-size: 1.5em; color: #96ceb4;">Auto</div>
                    <div>Mapping Mode</div>
                </div>
            </div>
        </div>

        <div class="panel activity-feed">
            <h2>📺 Live Activity Feed (XML Tracked)</h2>
            <div id="activity-list">
                <div class="activity-item xml-tracked">
                    <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                    🎬 XML Theater is open! Auto-mapping every 30s, drone integration active!
                </div>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:9960');
        let xmlMappingCount = 0;
        
        ws.onopen = () => {
            console.log('🎭 Connected to XML Theater!');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleUpdate(data);
        };

        function handleUpdate(data) {
            // Update drone status
            const droneStatus = document.getElementById('drone-status');
            if (data.drone_synced) {
                droneStatus.textContent = '🤖 Drone Status: Connected';
                droneStatus.style.background = 'rgba(0,255,0,0.2)';
            }

            switch (data.type) {
                case 'welcome':
                    updateMascots(data.mascots);
                    updateCounts(data.mascots?.length || 0, data.rooms?.length || 0);
                    break;
                case 'mascot_spawned':
                    addMascot(data.mascot);
                    addActivity(\`🎨 \${data.mascot.name} has appeared! XML ID: \${data.mascot.xmlId}\`, true);
                    updateCounts();
                    break;
                case 'building_started':
                    updateBuildingView(data);
                    addActivity(\`🏗️ \${data.mascot.name} started building! (XML tracked)\`, true);
                    break;
                case 'building_progress':
                    updateProgress(data);
                    addActivity(\`⚡ \${data.commentary} [Phase: \${data.phase}]\`, true);
                    break;
                case 'building_completed':
                    completeBuild(data);
                    addActivity(\`🎉 \${data.room.name} completed! XML Room ID: \${data.room.xmlId}\`, true);
                    updateCounts();
                    break;
                case 'outfit_session':
                    updateBuildingView({ type: 'fashion', mascot: data.mascot });
                    addActivity(\`👗 \${data.mascot.name} fashion show! (XML fashion tracking)\`, true);
                    break;
                case 'outfit_change':
                    addActivity(\`👔 \${data.reaction} [XML outfit tracked]\`, true);
                    break;
                case 'mascot_cheered':
                    addActivity(\`📣 \${data.message} [XML mood update]\`, true);
                    break;
                case 'xml_mapping_complete':
                    xmlMappingCount++;
                    document.querySelector('.xml-metric div').textContent = xmlMappingCount;
                    addActivity(\`🗺️ XML mapping completed: \${data.strategy} → \${data.target}\`, true);
                    break;
            }
        }

        function updateMascots(mascots) {
            const list = document.getElementById('mascot-list');
            if (mascots.length === 0) return;
            
            list.innerHTML = '';
            mascots.forEach(addMascot);
        }

        function addMascot(mascot) {
            const list = document.getElementById('mascot-list');
            if (list.querySelector('p')) {
                list.innerHTML = '';
            }

            const card = document.createElement('div');
            card.className = 'mascot-card';
            card.id = \`mascot-\${mascot.id}\`;
            card.innerHTML = \`
                <div class="mascot-name">\${mascot.name}</div>
                <div class="xml-id">XML ID: \${mascot.xmlId}</div>
                <div class="mascot-status">Style: \${mascot.personality}</div>
                <div class="mascot-status">Energy: \${mascot.energy}%</div>
                <div class="mascot-status">Activity: \${mascot.activity}</div>
                <div style="font-style: italic; margin-top: 8px; color: #ffd93d;">
                    "\${mascot.phrase}"
                </div>
            \`;
            list.appendChild(card);
        }

        function updateBuildingView(data) {
            const view = document.getElementById('building-view');
            
            if (data.type === 'fashion') {
                view.innerHTML = \`
                    <div style="text-align: center;">
                        <h3>👗 Fashion Show!</h3>
                        <p>\${data.mascot.name} is trying on outfits</p>
                        <div class="xml-id">XML Fashion Session: Active</div>
                        <div style="font-size: 2em; margin: 20px;">👔✨</div>
                    </div>
                \`;
                return;
            }

            view.innerHTML = \`
                <div style="text-align: center;">
                    <h3>🏗️ \${data.mascot.name} Building</h3>
                    <p>Project: \${data.mascot.buildTarget || 'New Room'}</p>
                    <div class="xml-id">XML Build Tracking: Active</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="build-progress" style="width: 0%"></div>
                    </div>
                    <p id="build-status">Getting started...</p>
                </div>
            \`;
        }

        function updateProgress(data) {
            const progress = document.getElementById('build-progress');
            const status = document.getElementById('build-status');
            
            if (progress) {
                progress.style.width = \`\${data.progress * 100}%\`;
            }
            
            if (status) {
                status.textContent = \`Phase: \${data.phase} - \${data.commentary}\`;
            }
        }

        function completeBuild(data) {
            const view = document.getElementById('building-view');
            view.innerHTML = \`
                <div style="text-align: center;" class="celebration">
                    <h2>🎉 COMPLETED! 🎉</h2>
                    <h3>\${data.room.name}</h3>
                    <div class="xml-id">XML Room ID: \${data.room.xmlId}</div>
                    <p>Type: \${data.room.type}</p>
                    <p>Style: \${data.room.style}</p>
                    <p>Rating: \${data.room.rating}/5 ⭐</p>
                    <div style="margin: 15px; padding: 15px; background: rgba(255,215,0,0.2); border-radius: 10px;">
                        <em>"\${data.message}"</em>
                    </div>
                </div>
            \`;
        }

        function addActivity(message, isXmlTracked = false) {
            const list = document.getElementById('activity-list');
            const item = document.createElement('div');
            item.className = \`activity-item \${isXmlTracked ? 'xml-tracked' : ''}\`;
            item.innerHTML = \`
                <span class="timestamp">\${new Date().toLocaleTimeString()}</span>
                \${message}
            \`;
            list.insertBefore(item, list.firstChild);
            
            while (list.children.length > 20) {
                list.removeChild(list.lastChild);
            }
        }

        function updateCounts(mascots, rooms) {
            if (mascots !== undefined) {
                document.getElementById('mascot-count').textContent = mascots;
            }
            if (rooms !== undefined) {
                document.getElementById('room-count').textContent = rooms;
            }
        }

        function spawnMascot() {
            ws.send(JSON.stringify({ type: 'spawn_mascot' }));
        }

        function cheerAll() {
            const mascots = document.querySelectorAll('.mascot-card');
            mascots.forEach(card => {
                const id = card.id.replace('mascot-', '');
                ws.send(JSON.stringify({ type: 'cheer', mascotId: id }));
            });
        }

        function triggerXMLMapping() {
            ws.send(JSON.stringify({ 
                type: 'xml_mapping_request',
                parameters: {
                    strategy: 'bidirectional',
                    target: 'manual_trigger_all'
                }
            }));
        }

        // Auto-spawn first mascot after 2 seconds
        setTimeout(spawnMascot, 2000);
    </script>
</body>
</html>
        `;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🎭 XML-Mapped Character World Theater: http://localhost:${this.port}`);
            console.log('🗺️ XML integration: ACTIVE');
            console.log('🤖 Drone compatibility: ENABLED');
            console.log('🎪 WebSocket + XML streaming ready');
        });
    }
}

// Start the XML-mapped theater
const xmlTheater = new XMLMappedCharacterTheater();
xmlTheater.start();

module.exports = XMLMappedCharacterTheater;
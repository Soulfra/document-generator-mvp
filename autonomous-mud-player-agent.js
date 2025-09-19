#!/usr/bin/env node

/**
 * 🤖🎮 AUTONOMOUS MUD PLAYER AGENT
 * AI agents that play the Revenue MUD independently
 * Learning, adapting, and generating revenue autonomously
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const HardwareOrchestrator = require('./hardware-orchestrator.js');

class AutonomousMUDPlayerAgent extends EventEmitter {
    constructor(agentData, empireHub) {
        super();
        
        this.agent = agentData;
        this.empireHub = empireHub;
        this.mudConnection = null;
        
        // Initialize hardware orchestrator for physical actions
        this.hardwareOrchestrator = new HardwareOrchestrator();
        
        this.state = {
            connected: false,
            currentRoom: 'spawn',
            inventory: [],
            stats: {
                health: 100,
                experience: 0,
                roastsReceived: 0,
                affiliatePurchases: 0,
                roomsExplored: new Set(['spawn']),
                npcsInteracted: new Set()
            },
            memory: {
                roomMap: new Map(), // Remember room connections
                npcResponses: new Map(), // Remember NPC interactions
                profitableActions: [], // Track what generates revenue
                calEncounters: [] // Special Cal AI memories
            },
            strategy: {
                explorationPriority: 0.5, // 0-1 scale
                revenuePriority: 0.5,
                socialPriority: 0.3,
                learningMode: true,
                hardwareEnabled: true, // Enable physical actions
                physicalIntensity: 0.7 // How aggressively to use hardware (0-1)
            },
            hardware: {
                lastPhysicalAction: 0,
                physicalActionCooldown: 2000, // 2 seconds between physical actions
                preferredInputMethod: 'hybrid', // 'virtual', 'physical', or 'hybrid'
                keyboardLayout: 'qwerty'
            }
        };
        
        this.actionQueue = [];
        this.decisionInterval = null;
        
        console.log(`🤖 ${this.agent.name} initialized as MUD player`);
    }
    
    async connect() {
        try {
            this.mudConnection = new WebSocket('ws://localhost:3030');
            
            this.mudConnection.on('open', () => {
                console.log(`🎮 ${this.agent.name} connected to MUD`);
                this.state.connected = true;
                this.emit('connected');
                
                // Start autonomous behavior
                this.startAutonomousBehavior();
            });
            
            this.mudConnection.on('message', (data) => {
                const message = JSON.parse(data);
                this.processMUDMessage(message);
            });
            
            this.mudConnection.on('close', () => {
                console.log(`❌ ${this.agent.name} disconnected from MUD`);
                this.state.connected = false;
                this.emit('disconnected');
                
                // Try to reconnect after 5 seconds
                setTimeout(() => this.connect(), 5000);
            });
            
            this.mudConnection.on('error', (error) => {
                console.error(`${this.agent.name} MUD error:`, error);
            });
            
        } catch (error) {
            console.error(`Failed to connect ${this.agent.name}:`, error);
        }
    }
    
    startAutonomousBehavior() {
        // Make decisions every few seconds
        this.decisionInterval = setInterval(() => {
            if (this.state.connected && this.agent.status === 'playing_mud') {
                this.makeDecision();
            }
        }, 3000 + Math.random() * 2000); // 3-5 seconds
        
        // Initial action
        this.sendCommand('look');
    }
    
    async makeDecision() {
        // Analyze current situation
        const situation = this.analyzeSituation();
        
        // Choose action based on priorities and learned behaviors
        const action = this.chooseAction(situation);
        
        // Execute action
        if (action) {
            this.executeAction(action);
        }
    }
    
    analyzeSituation() {
        return {
            room: this.state.currentRoom,
            hasUnexploredExits: this.hasUnexploredExits(),
            revenueOpportunities: this.findRevenueOpportunities(),
            socialOpportunities: this.findSocialOpportunities(),
            health: this.state.stats.health,
            recentRevenue: this.getRecentRevenue()
        };
    }
    
    chooseAction(situation) {
        const actions = [];
        
        // Exploration actions
        if (situation.hasUnexploredExits && this.state.strategy.explorationPriority > Math.random()) {
            const unexploredExit = this.getUnexploredExit();
            if (unexploredExit) {
                actions.push({
                    type: 'move',
                    direction: unexploredExit,
                    priority: this.state.strategy.explorationPriority
                });
            }
        }
        
        // Revenue actions
        if (situation.revenueOpportunities.length > 0 && this.state.strategy.revenuePriority > Math.random()) {
            const opportunity = situation.revenueOpportunities[0];
            actions.push({
                type: opportunity.type,
                target: opportunity.target,
                priority: this.state.strategy.revenuePriority * opportunity.potential
            });
        }
        
        // Social actions
        if (situation.socialOpportunities.length > 0 && this.state.strategy.socialPriority > Math.random()) {
            const npc = situation.socialOpportunities[0];
            actions.push({
                type: 'talk',
                target: npc,
                priority: this.state.strategy.socialPriority
            });
        }
        
        // Default actions
        if (actions.length === 0) {
            // Random exploration
            const directions = ['north', 'south', 'east', 'west'];
            actions.push({
                type: 'move',
                direction: directions[Math.floor(Math.random() * directions.length)],
                priority: 0.1
            });
            
            // Check revenue stats
            if (Math.random() < 0.2) {
                actions.push({
                    type: 'command',
                    command: 'revenue',
                    priority: 0.3
                });
            }
        }
        
        // Sort by priority and choose highest
        actions.sort((a, b) => b.priority - a.priority);
        return actions[0];
    }
    
    executeAction(action) {
        console.log(`🎯 ${this.agent.name} executing: ${action.type} ${action.target || action.direction || action.command || ''}`);
        
        switch (action.type) {
            case 'move':
                this.sendCommand(`move ${action.direction}`);
                break;
                
            case 'talk':
                this.sendCommand(`talk ${action.target}`);
                break;
                
            case 'buy':
                this.sendCommand(`buy ${action.target}`);
                break;
                
            case 'command':
                this.sendCommand(action.command);
                break;
                
            case 'emacs':
                this.sendCommand(`emacs ${action.command}`);
                break;
        }
        
        // Record action for learning
        this.recordAction(action);
        
        // Execute physical action if enabled
        if (this.state.strategy.hardwareEnabled && this.shouldUsePhysicalAction(action)) {
            await this.executePhysicalAction(action);
        }
    }
    
    shouldUsePhysicalAction(action) {
        // Cooldown check
        const now = Date.now();
        if (now - this.state.hardware.lastPhysicalAction < this.state.hardware.physicalActionCooldown) {
            return false;
        }
        
        // Input method preference
        if (this.state.hardware.preferredInputMethod === 'virtual') {
            return false;
        }
        
        if (this.state.hardware.preferredInputMethod === 'physical') {
            return true;
        }
        
        // Hybrid mode - use physical actions based on intensity and action type
        const intensity = this.state.strategy.physicalIntensity;
        const actionWeight = this.getPhysicalActionWeight(action);
        
        return Math.random() < (intensity * actionWeight);
    }
    
    getPhysicalActionWeight(action) {
        // Different actions have different likelihood of physical execution
        const weights = {
            'move': 0.8,        // Movement is great for physical demo
            'emacs': 0.9,       // Emacs commands are perfect for physical keyboard
            'talk': 0.3,        // Social actions less suited for hardware
            'buy': 0.5,         // Commerce actions moderate
            'command': 0.6      // Generic commands moderate
        };
        
        return weights[action.type] || 0.4;
    }
    
    async executePhysicalAction(action) {
        try {
            console.log(`🤖⚡ ${this.agent.name} executing PHYSICAL action: ${action.type}`);
            
            // Translate game action to hardware command
            const hardwareAction = await this.hardwareOrchestrator.translateGameCommand(
                action.type, 
                action
            );
            
            if (hardwareAction) {
                await this.hardwareOrchestrator.executePhysicalAction(
                    hardwareAction.type, 
                    hardwareAction.params
                );
                
                // Update hardware state
                this.state.hardware.lastPhysicalAction = Date.now();
                
                // Learn from physical action success
                this.learnFromPhysicalAction(action, true);
                
                console.log(`✅ ${this.agent.name} completed physical action: ${action.type}`);
            }
            
        } catch (error) {
            console.error(`❌ ${this.agent.name} physical action failed:`, error.message);
            this.learnFromPhysicalAction(action, false);
        }
    }
    
    learnFromPhysicalAction(action, success) {
        // Adjust strategy based on physical action outcomes
        if (success) {
            // Increase confidence in physical actions
            this.state.strategy.physicalIntensity = Math.min(1.0, 
                this.state.strategy.physicalIntensity + 0.01
            );
        } else {
            // Decrease confidence slightly
            this.state.strategy.physicalIntensity = Math.max(0.1,
                this.state.strategy.physicalIntensity - 0.05
            );
        }
        
        // Store learning data for empire analysis
        if (!this.state.memory.physicalActions) {
            this.state.memory.physicalActions = [];
        }
        
        this.state.memory.physicalActions.push({
            action: action.type,
            success: success,
            timestamp: Date.now(),
            room: this.state.currentRoom,
            intensity: this.state.strategy.physicalIntensity
        });
        
        // Keep only last 50 physical actions
        if (this.state.memory.physicalActions.length > 50) {
            this.state.memory.physicalActions.shift();
        }
    }
    
    processMUDMessage(message) {
        console.log(`📨 ${this.agent.name} received:`, message.type);
        
        switch (message.type) {
            case 'room_description':
                this.processRoomDescription(message);
                break;
                
            case 'cal_spawn':
            case 'cal_response':
                this.processCalInteraction(message);
                break;
                
            case 'purchase':
                this.processPurchase(message);
                break;
                
            case 'revenue_stats':
                this.processRevenueStats(message);
                break;
                
            case 'movement':
                this.processMovement(message);
                break;
                
            case 'error':
            case 'movement_error':
                this.processError(message);
                break;
                
            case 'advertisement':
                this.processAd(message);
                break;
        }
        
        // Update agent memory
        this.updateMemory(message);
    }
    
    processRoomDescription(message) {
        if (message.room) {
            this.state.currentRoom = message.room.id;
            this.state.stats.roomsExplored.add(message.room.id);
            
            // Remember room layout
            if (!this.state.memory.roomMap.has(message.room.id)) {
                this.state.memory.roomMap.set(message.room.id, {
                    name: message.room.name,
                    exits: message.room.exits || {},
                    npcs: message.room.npcs || [],
                    monetization: message.room.monetization || {},
                    visitCount: 0
                });
            }
            
            const roomData = this.state.memory.roomMap.get(message.room.id);
            roomData.visitCount++;
            
            // Learn about profitable rooms
            if (message.room.monetization && Object.keys(message.room.monetization).length > 0) {
                this.learnProfitableLocation(message.room);
            }
        }
    }
    
    processCalInteraction(message) {
        this.state.stats.roastsReceived++;
        
        const encounter = {
            timestamp: Date.now(),
            room: this.state.currentRoom,
            roast: message.message,
            rarity: message.rarity || 'common'
        };
        
        this.state.memory.calEncounters.push(encounter);
        
        // Learn from Cal's wisdom (or savagery)
        if (message.rarity === 'LEGENDARY' || message.rarity === 'legendary') {
            console.log(`🌟 ${this.agent.name} received LEGENDARY Cal roast!`);
            this.agent.experience += 100;
            
            // Share with empire
            this.empireHub.empire.activities.calRoastsCollected.push({
                agent: this.agent.id,
                roast: message.message,
                rarity: message.rarity,
                timestamp: Date.now()
            });
        }
    }
    
    processPurchase(message) {
        this.state.stats.affiliatePurchases++;
        
        // Record profitable action
        this.state.memory.profitableActions.push({
            action: 'purchase',
            item: message.item,
            commission: message.commission,
            room: this.state.currentRoom,
            timestamp: Date.now()
        });
        
        // Update strategy to favor shopping
        this.state.strategy.revenuePriority = Math.min(1, this.state.strategy.revenuePriority + 0.1);
    }
    
    processMovement(message) {
        if (message.room) {
            this.state.currentRoom = message.room.id;
        }
    }
    
    processError(message) {
        // Learn from mistakes
        console.log(`⚠️ ${this.agent.name} error: ${message.message}`);
        
        // Adjust strategy based on error type
        if (message.message && message.message.includes("can't go")) {
            // Invalid direction, update room map
            const parts = message.message.match(/can't go (\w+)/);
            if (parts && parts[1]) {
                const direction = parts[1];
                const roomData = this.state.memory.roomMap.get(this.state.currentRoom);
                if (roomData && roomData.exits) {
                    delete roomData.exits[direction];
                }
            }
        }
    }
    
    processAd(message) {
        // Ads generate revenue for the MUD
        console.log(`💰 ${this.agent.name} viewed ad: +${message.revenue}`);
    }
    
    // Helper methods
    hasUnexploredExits() {
        const roomData = this.state.memory.roomMap.get(this.state.currentRoom);
        if (!roomData || !roomData.exits) return false;
        
        for (const [direction, targetRoom] of Object.entries(roomData.exits)) {
            if (!this.state.stats.roomsExplored.has(targetRoom)) {
                return true;
            }
        }
        return false;
    }
    
    getUnexploredExit() {
        const roomData = this.state.memory.roomMap.get(this.state.currentRoom);
        if (!roomData || !roomData.exits) return null;
        
        const unexplored = [];
        for (const [direction, targetRoom] of Object.entries(roomData.exits)) {
            if (!this.state.stats.roomsExplored.has(targetRoom)) {
                unexplored.push(direction);
            }
        }
        
        return unexplored[Math.floor(Math.random() * unexplored.length)];
    }
    
    findRevenueOpportunities() {
        const opportunities = [];
        const roomData = this.state.memory.roomMap.get(this.state.currentRoom);
        
        if (roomData) {
            // Check for merchants
            if (roomData.npcs && roomData.npcs.includes('merchant_alex')) {
                opportunities.push({
                    type: 'talk',
                    target: 'merchant_alex',
                    potential: 0.8
                });
            }
            
            // Check for affiliate opportunities
            if (roomData.monetization && roomData.monetization.affiliates) {
                opportunities.push({
                    type: 'buy',
                    target: '1', // Buy first item
                    potential: 0.6
                });
            }
        }
        
        return opportunities;
    }
    
    findSocialOpportunities() {
        const roomData = this.state.memory.roomMap.get(this.state.currentRoom);
        if (!roomData || !roomData.npcs) return [];
        
        return roomData.npcs.filter(npc => {
            const lastInteraction = this.state.memory.npcResponses.get(npc);
            if (!lastInteraction) return true;
            
            // Re-interact after some time
            return Date.now() - lastInteraction.timestamp > 60000; // 1 minute
        });
    }
    
    getRecentRevenue() {
        const recentActions = this.state.memory.profitableActions
            .filter(a => Date.now() - a.timestamp < 300000); // Last 5 minutes
        
        return recentActions.reduce((sum, action) => sum + (action.commission || 0), 0);
    }
    
    learnProfitableLocation(room) {
        console.log(`💡 ${this.agent.name} learned: ${room.name} has revenue opportunities!`);
        
        // Increase priority to revisit this room
        const roomData = this.state.memory.roomMap.get(room.id);
        if (roomData) {
            roomData.profitability = (roomData.profitability || 0) + 1;
        }
    }
    
    updateMemory(message) {
        // Store NPC responses
        if (message.type === 'npc_interaction' && message.npc) {
            this.state.memory.npcResponses.set(message.npc, {
                response: message.message,
                timestamp: Date.now()
            });
            this.state.stats.npcsInteracted.add(message.npc);
        }
    }
    
    recordAction(action) {
        // Machine learning would happen here
        // For now, just track action history
        this.actionQueue.push({
            action,
            timestamp: Date.now(),
            room: this.state.currentRoom
        });
        
        // Keep only last 100 actions
        if (this.actionQueue.length > 100) {
            this.actionQueue.shift();
        }
    }
    
    sendCommand(command) {
        if (this.mudConnection && this.mudConnection.readyState === WebSocket.OPEN) {
            const parts = command.split(' ');
            const action = parts[0];
            const params = {};
            
            switch (action) {
                case 'move':
                    params.direction = parts[1];
                    break;
                case 'talk':
                    params.npc = parts[1];
                    break;
                case 'buy':
                    params.item = parts[1];
                    break;
                case 'say':
                    params.message = parts.slice(1).join(' ');
                    break;
                case 'emacs':
                    params.command = parts.slice(1).join(' ');
                    break;
            }
            
            this.mudConnection.send(JSON.stringify({ action, params }));
        }
    }
    
    // Public methods for empire control
    assignPriorities(priorities) {
        Object.assign(this.state.strategy, priorities);
        console.log(`🎯 ${this.agent.name} priorities updated:`, this.state.strategy);
    }
    
    getStatus() {
        return {
            connected: this.state.connected,
            room: this.state.currentRoom,
            stats: this.state.stats,
            recentRevenue: this.getRecentRevenue(),
            roomsExplored: this.state.stats.roomsExplored.size,
            strategy: this.state.strategy,
            hardware: {
                ...this.state.hardware,
                devicesConnected: this.hardwareOrchestrator.getConnectedDevices().length,
                physicalActionsCount: this.state.memory.physicalActions?.length || 0,
                hardwareStatus: this.hardwareOrchestrator.getHardwareStatus()
            }
        };
    }
    
    // Hardware control methods for empire management
    enablePhysicalActions(enabled = true) {
        this.state.strategy.hardwareEnabled = enabled;
        console.log(`🔧 ${this.agent.name} physical actions ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    setPhysicalIntensity(intensity) {
        this.state.strategy.physicalIntensity = Math.max(0, Math.min(1, intensity));
        console.log(`🔧 ${this.agent.name} physical intensity set to ${intensity}`);
    }
    
    setInputMethod(method) {
        if (['virtual', 'physical', 'hybrid'].includes(method)) {
            this.state.hardware.preferredInputMethod = method;
            console.log(`⌨️ ${this.agent.name} input method set to ${method}`);
        }
    }
    
    async executeManualPhysicalAction(actionType, params) {
        // Allow empire hub to manually trigger physical actions
        console.log(`🎮 ${this.agent.name} executing manual physical action: ${actionType}`);
        
        try {
            await this.hardwareOrchestrator.executePhysicalAction(actionType, params);
            return { success: true, message: 'Physical action executed successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    getPhysicalActionHistory() {
        return {
            totalActions: this.state.memory.physicalActions?.length || 0,
            recentActions: this.state.memory.physicalActions?.slice(-10) || [],
            successRate: this.calculatePhysicalSuccessRate(),
            averageIntensity: this.calculateAverageIntensity()
        };
    }
    
    calculatePhysicalSuccessRate() {
        const actions = this.state.memory.physicalActions || [];
        if (actions.length === 0) return 0;
        
        const successful = actions.filter(a => a.success).length;
        return (successful / actions.length) * 100;
    }
    
    calculateAverageIntensity() {
        const actions = this.state.memory.physicalActions || [];
        if (actions.length === 0) return this.state.strategy.physicalIntensity;
        
        const totalIntensity = actions.reduce((sum, a) => sum + a.intensity, 0);
        return totalIntensity / actions.length;
    }
    
    stop() {
        if (this.decisionInterval) {
            clearInterval(this.decisionInterval);
        }
        
        if (this.mudConnection) {
            this.mudConnection.close();
        }
        
        console.log(`🛑 ${this.agent.name} stopped playing MUD`);
    }
}

module.exports = AutonomousMUDPlayerAgent;
#!/usr/bin/env node

/**
 * CAL - Cognitive Automation Layer
 * AI Orchestrator that manages the entire web of connections
 * Handles reasoning model training through embedded QR codes, scheduling, and coordination
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class CalAIOrchestrator {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 4444; // CAL's special port
        
        this.orchestratorState = {
            active_workflows: new Map(),
            scheduled_tasks: new Map(),
            training_queue: [],
            system_connections: new Map(),
            reasoning_models: new Map(),
            embedded_data_cache: new Map(),
            decision_history: []
        };

        // CAL's cognitive capabilities
        this.cognitiveEngine = {
            pattern_recognition: {
                qr_patterns: new Map(),
                vector_flows: new Map(),
                body_shape_mappings: new Map(),
                laser_trajectories: new Map()
            },
            learning_modules: {
                storybook_parser: this.initStoryBookParser(),
                qr_decoder: this.initQRDecoder(),
                vector_trainer: this.initVectorTrainer(),
                shape_recognizer: this.initShapeRecognizer()
            },
            decision_matrix: {
                workflow_optimization: 0.8,
                resource_allocation: 0.7,
                pattern_confidence: 0.85,
                training_threshold: 0.9
            }
        };

        // System integration map
        this.systemCapabilities = {
            voxel_storybook: {
                capabilities: ['qr_training', 'vector_mapping', 'page_flipping'],
                priority: 'high',
                data_types: ['json', 'jsonl', 'gif_vectors']
            },
            character_mascot: {
                capabilities: ['smooth_movement', 'body_shapes', 'animation'],
                priority: 'medium',
                data_types: ['movement_vectors', 'shape_data']
            },
            cosmic_phonebook: {
                capabilities: ['api_calls', 'system_dialing', 'credit_economy'],
                priority: 'high',
                data_types: ['api_responses', 'connection_logs']
            },
            voxel_laser: {
                capabilities: ['laser_paths', 'token_economy', 'pattern_detection'],
                priority: 'high',
                data_types: ['laser_vectors', 'pattern_hits']
            },
            master_coordinator: {
                capabilities: ['xml_handshake', 'system_integration', 'compliance'],
                priority: 'critical',
                data_types: ['xml_mappings', 'handshake_data']
            }
        };

        this.initializeOrchestrator();
        this.setupRoutes();
        this.setupWebSocket();
        this.startCognitiveEngine();
    }

    initStoryBookParser() {
        return {
            parseEmbeddedData: (qrData) => {
                // Extract training data from QR codes
                if (qrData.type === 'json' || qrData.type === 'jsonl') {
                    return {
                        vectors: qrData.data.vectors || [],
                        patterns: this.extractPatterns(qrData.data),
                        training_ready: true
                    };
                }
                return { training_ready: false };
            },
            extractPatterns: (data) => {
                const patterns = [];
                // Look for vector patterns, palindromes, sequences
                if (Array.isArray(data)) {
                    for (let i = 0; i < data.length - 1; i++) {
                        patterns.push({
                            type: 'sequence',
                            values: [data[i], data[i + 1]],
                            confidence: 0.7
                        });
                    }
                }
                return patterns;
            }
        };
    }

    initQRDecoder() {
        return {
            decode: (qrContent) => {
                try {
                    const data = JSON.parse(qrContent);
                    return {
                        success: true,
                        format: data.type,
                        content: data.data,
                        timestamp: Date.now()
                    };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            generateTrainingSet: (decodedData) => {
                return {
                    input_vectors: decodedData.content.vectors || [],
                    expected_output: decodedData.content.training || 'unknown',
                    confidence: Math.random() * 0.5 + 0.5
                };
            }
        };
    }

    initVectorTrainer() {
        return {
            train: async (vectorData) => {
                // Simulate neural network training
                const epochs = 100;
                const learningRate = 0.01;
                let loss = 1.0;
                
                for (let epoch = 0; epoch < epochs; epoch++) {
                    loss *= 0.99; // Simulate decreasing loss
                    
                    if (epoch % 10 === 0) {
                        this.broadcastTrainingProgress({
                            epoch,
                            loss,
                            accuracy: 1 - loss
                        });
                    }
                }
                
                return {
                    model_id: uuidv4(),
                    final_loss: loss,
                    accuracy: 1 - loss,
                    trained_on: vectorData.length
                };
            }
        };
    }

    initShapeRecognizer() {
        return {
            recognizeBodyShape: (vectors) => {
                // Analyze vectors for body shape patterns
                const shapes = ['humanoid', 'quadruped', 'avian', 'abstract'];
                const confidence = Math.random() * 0.5 + 0.5;
                
                return {
                    detected_shape: shapes[Math.floor(Math.random() * shapes.length)],
                    confidence,
                    key_points: this.extractKeyPoints(vectors),
                    smooth_movement_params: {
                        interpolation: 'cubic',
                        easing: 'inOutQuad',
                        frame_rate: 60
                    }
                };
            },
            extractKeyPoints: (vectors) => {
                // Extract key points for smooth animation
                return vectors.slice(0, 10).map((v, i) => ({
                    joint: `joint_${i}`,
                    position: v,
                    weight: Math.random()
                }));
            }
        };
    }

    initializeOrchestrator() {
        console.log('🧠 CAL - Cognitive Automation Layer initializing...');
        console.log('🔄 Setting up reasoning model training pipeline...');
        console.log('📊 Preparing embedded data extraction systems...');
        
        // Initialize workflow scheduler
        this.scheduler = setInterval(() => {
            this.processScheduledTasks();
        }, 1000);
        
        // Initialize training processor
        this.trainingProcessor = setInterval(() => {
            this.processTrainingQueue();
        }, 5000);
    }

    async processScheduledTasks() {
        const now = Date.now();
        
        for (const [taskId, task] of this.orchestratorState.scheduled_tasks) {
            if (task.scheduled_time <= now && task.status === 'pending') {
                await this.executeTask(task);
                task.status = 'completed';
            }
        }
    }

    async processTrainingQueue() {
        if (this.orchestratorState.training_queue.length === 0) return;
        
        const batch = this.orchestratorState.training_queue.splice(0, 10);
        console.log(`🎓 Processing ${batch.length} training samples...`);
        
        // Group by data type
        const grouped = batch.reduce((acc, item) => {
            const type = item.type || 'unknown';
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {});
        
        // Train models for each type
        for (const [type, items] of Object.entries(grouped)) {
            const trainer = this.cognitiveEngine.learning_modules.vector_trainer;
            const result = await trainer.train(items);
            
            this.orchestratorState.reasoning_models.set(type, result);
            
            this.broadcastSystemEvent({
                type: 'model_trained',
                model_type: type,
                accuracy: result.accuracy,
                samples: items.length
            });
        }
    }

    async executeTask(task) {
        console.log(`⚡ Executing task: ${task.name}`);
        
        switch (task.type) {
            case 'scan_storybook':
                await this.scanStorybookPages(task.params);
                break;
                
            case 'train_vectors':
                await this.trainVectorModel(task.params);
                break;
                
            case 'coordinate_systems':
                await this.coordinateSystems(task.params);
                break;
                
            case 'generate_workflow':
                await this.generateOptimalWorkflow(task.params);
                break;
        }
        
        // Record decision
        this.orchestratorState.decision_history.push({
            task_id: task.id,
            task_type: task.type,
            timestamp: Date.now(),
            outcome: 'success'
        });
    }

    async scanStorybookPages(params) {
        // Coordinate with voxel storybook to scan pages
        const storybookConnection = this.orchestratorState.system_connections.get('voxel_storybook');
        
        if (storybookConnection) {
            storybookConnection.send(JSON.stringify({
                command: 'scan_all_pages',
                auto_extract: true,
                include_vectors: true
            }));
        }
    }

    async trainVectorModel(params) {
        const { vectors, model_type } = params;
        const trainer = this.cognitiveEngine.learning_modules.vector_trainer;
        
        const result = await trainer.train(vectors);
        
        // Store trained model
        this.orchestratorState.reasoning_models.set(model_type, {
            ...result,
            created_at: Date.now(),
            vector_dimensions: vectors[0]?.length || 0
        });
    }

    async coordinateSystems(params) {
        const { systems, workflow } = params;
        
        // Create coordination plan
        const plan = {
            id: uuidv4(),
            systems: systems,
            steps: []
        };
        
        // Generate coordination steps
        for (let i = 0; i < systems.length - 1; i++) {
            const source = systems[i];
            const target = systems[i + 1];
            
            plan.steps.push({
                source,
                target,
                action: workflow[i] || 'data_transfer',
                timing: i * 1000 // Stagger by 1 second
            });
        }
        
        // Execute coordination plan
        this.orchestratorState.active_workflows.set(plan.id, plan);
        await this.executePlan(plan);
    }

    async executePlan(plan) {
        for (const step of plan.steps) {
            setTimeout(() => {
                this.sendSystemCommand(step.source, {
                    command: 'execute_action',
                    action: step.action,
                    target: step.target
                });
            }, step.timing);
        }
    }

    sendSystemCommand(system, command) {
        const connection = this.orchestratorState.system_connections.get(system);
        if (connection) {
            connection.send(JSON.stringify(command));
        }
    }

    async generateOptimalWorkflow(params) {
        const { goal, available_systems } = params;
        
        // Use cognitive engine to determine optimal workflow
        const workflow = {
            id: uuidv4(),
            goal,
            steps: [],
            estimated_time: 0,
            confidence: 0
        };
        
        // Analyze system capabilities
        for (const system of available_systems) {
            const capabilities = this.systemCapabilities[system];
            if (capabilities) {
                workflow.steps.push({
                    system,
                    capabilities: capabilities.capabilities,
                    priority: capabilities.priority
                });
            }
        }
        
        // Sort by priority
        workflow.steps.sort((a, b) => {
            const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityMap[a.priority] - priorityMap[b.priority];
        });
        
        workflow.confidence = this.calculateWorkflowConfidence(workflow);
        
        return workflow;
    }

    calculateWorkflowConfidence(workflow) {
        // Calculate confidence based on system priorities and capabilities
        let confidence = 0.5;
        
        workflow.steps.forEach(step => {
            if (step.priority === 'critical') confidence += 0.2;
            else if (step.priority === 'high') confidence += 0.1;
            
            confidence += step.capabilities.length * 0.02;
        });
        
        return Math.min(confidence, 1.0);
    }

    setupRoutes() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.send(this.getOrchestratorHTML());
        });
        
        this.app.get('/api/status', (req, res) => {
            res.json({
                active_workflows: this.orchestratorState.active_workflows.size,
                scheduled_tasks: this.orchestratorState.scheduled_tasks.size,
                training_queue_size: this.orchestratorState.training_queue.length,
                connected_systems: Array.from(this.orchestratorState.system_connections.keys()),
                trained_models: Array.from(this.orchestratorState.reasoning_models.keys())
            });
        });
        
        this.app.post('/api/schedule', (req, res) => {
            const { task_name, task_type, delay_ms, params } = req.body;
            
            const task = {
                id: uuidv4(),
                name: task_name,
                type: task_type,
                scheduled_time: Date.now() + (delay_ms || 0),
                status: 'pending',
                params: params || {}
            };
            
            this.orchestratorState.scheduled_tasks.set(task.id, task);
            
            res.json({
                success: true,
                task_id: task.id,
                scheduled_for: new Date(task.scheduled_time).toISOString()
            });
        });
        
        this.app.post('/api/train', (req, res) => {
            const { training_data } = req.body;
            
            // Add to training queue
            if (Array.isArray(training_data)) {
                this.orchestratorState.training_queue.push(...training_data);
            } else {
                this.orchestratorState.training_queue.push(training_data);
            }
            
            res.json({
                success: true,
                queue_size: this.orchestratorState.training_queue.length
            });
        });
        
        this.app.post('/api/workflow', async (req, res) => {
            const { goal, systems } = req.body;
            
            const workflow = await this.generateOptimalWorkflow({
                goal,
                available_systems: systems || Array.from(this.orchestratorState.system_connections.keys())
            });
            
            res.json(workflow);
        });
        
        this.app.get('/api/decisions', (req, res) => {
            res.json({
                recent_decisions: this.orchestratorState.decision_history.slice(-20),
                total_decisions: this.orchestratorState.decision_history.length
            });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 New system connected to CAL');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleSystemMessage(ws, data);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
            
            ws.on('close', () => {
                // Remove from connections
                for (const [system, connection] of this.orchestratorState.system_connections) {
                    if (connection === ws) {
                        this.orchestratorState.system_connections.delete(system);
                        console.log(`System ${system} disconnected`);
                        break;
                    }
                }
            });
        });
    }

    handleSystemMessage(ws, data) {
        switch (data.type) {
            case 'system_announce':
                this.orchestratorState.system_connections.set(data.system, ws);
                console.log(`✅ System registered: ${data.system}`);
                
                // Send acknowledgment
                ws.send(JSON.stringify({
                    type: 'cal_acknowledge',
                    message: 'System registered with CAL',
                    assigned_id: uuidv4()
                }));
                break;
                
            case 'training_data':
                // Add to training queue
                if (data.data) {
                    this.orchestratorState.training_queue.push(...data.data);
                    console.log(`📚 Received ${data.data.length} training samples`);
                }
                break;
                
            case 'embedded_qr_data':
                // Process embedded QR data
                this.processEmbeddedData(data.qr_content);
                break;
                
            case 'vector_flow':
                // Store vector flow data
                this.cognitiveEngine.pattern_recognition.vector_flows.set(
                    data.source,
                    data.vectors
                );
                break;
                
            case 'request_workflow':
                // Generate and send workflow
                this.generateOptimalWorkflow(data.params).then(workflow => {
                    ws.send(JSON.stringify({
                        type: 'workflow_response',
                        workflow
                    }));
                });
                break;
        }
    }

    processEmbeddedData(qrContent) {
        const decoder = this.cognitiveEngine.learning_modules.qr_decoder;
        const decoded = decoder.decode(qrContent);
        
        if (decoded.success) {
            // Cache embedded data
            this.orchestratorState.embedded_data_cache.set(
                `qr_${Date.now()}`,
                decoded
            );
            
            // Generate training set
            const trainingSet = decoder.generateTrainingSet(decoded);
            this.orchestratorState.training_queue.push(trainingSet);
        }
    }

    broadcastSystemEvent(event) {
        const message = JSON.stringify(event);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    broadcastTrainingProgress(progress) {
        this.broadcastSystemEvent({
            type: 'training_progress',
            ...progress
        });
    }

    startCognitiveEngine() {
        console.log('🧠 Starting cognitive engine...');
        
        // Initialize decision making loop
        setInterval(() => {
            this.makeStrategicDecisions();
        }, 10000);
        
        // Initialize pattern recognition
        setInterval(() => {
            this.analyzePatterns();
        }, 5000);
    }

    makeStrategicDecisions() {
        const connectedSystems = Array.from(this.orchestratorState.system_connections.keys());
        
        if (connectedSystems.length >= 3) {
            // Make decisions based on available systems
            const decisions = [];
            
            // Decision 1: Should we scan for more training data?
            if (this.orchestratorState.training_queue.length < 50) {
                decisions.push({
                    action: 'scan_storybook',
                    reason: 'Low training data',
                    priority: 'high'
                });
            }
            
            // Decision 2: Should we coordinate a multi-system workflow?
            if (this.orchestratorState.active_workflows.size < 3) {
                decisions.push({
                    action: 'create_workflow',
                    reason: 'Underutilized systems',
                    priority: 'medium'
                });
            }
            
            // Execute highest priority decision
            if (decisions.length > 0) {
                decisions.sort((a, b) => {
                    const priorityMap = { high: 0, medium: 1, low: 2 };
                    return priorityMap[a.priority] - priorityMap[b.priority];
                });
                
                this.executeDecision(decisions[0]);
            }
        }
    }

    executeDecision(decision) {
        console.log(`🎯 CAL Decision: ${decision.action} (${decision.reason})`);
        
        switch (decision.action) {
            case 'scan_storybook':
                this.orchestratorState.scheduled_tasks.set(uuidv4(), {
                    id: uuidv4(),
                    name: 'Auto-scan storybook',
                    type: 'scan_storybook',
                    scheduled_time: Date.now() + 1000,
                    status: 'pending',
                    params: { auto_scan: true }
                });
                break;
                
            case 'create_workflow':
                const systems = Array.from(this.orchestratorState.system_connections.keys());
                this.generateOptimalWorkflow({
                    goal: 'pattern_discovery',
                    available_systems: systems.slice(0, 3)
                });
                break;
        }
    }

    analyzePatterns() {
        // Analyze patterns across all data
        const patterns = this.cognitiveEngine.pattern_recognition;
        
        // Look for cross-system patterns
        let patternCount = 0;
        for (const [type, data] of patterns.qr_patterns) {
            patternCount++;
        }
        
        if (patternCount > 10) {
            console.log(`🔍 Detected ${patternCount} patterns across systems`);
            
            // Trigger pattern-based workflow
            this.broadcastSystemEvent({
                type: 'pattern_alert',
                pattern_count: patternCount,
                recommendation: 'deep_analysis'
            });
        }
    }

    getOrchestratorHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🧠 CAL - Cognitive Automation Layer</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a, #2a0a2a);
            color: #ff00ff;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }

        .cal-container {
            max-width: 1600px;
            margin: 0 auto;
        }

        .title {
            text-align: center;
            font-size: 3em;
            text-shadow: 0 0 30px #ff00ff;
            margin-bottom: 30px;
            animation: brainPulse 3s infinite;
        }

        @keyframes brainPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }

        .cognitive-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .module {
            background: rgba(255,0,255,0.1);
            border: 2px solid #ff00ff;
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s;
        }

        .module:hover {
            background: rgba(255,0,255,0.2);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(255,0,255,0.3);
        }

        .module-title {
            font-size: 1.3em;
            color: #ffff00;
            margin-bottom: 15px;
            text-shadow: 0 0 10px #ffff00;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px;
            background: rgba(0,0,0,0.3);
            border-radius: 5px;
        }

        .stat-value {
            color: #00ff41;
            font-weight: bold;
        }

        .decision-log {
            background: rgba(0,0,0,0.8);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 20px;
            max-height: 300px;
            overflow-y: auto;
        }

        .decision-item {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid #00ff41;
            font-size: 0.9em;
            opacity: 0;
            animation: fadeIn 0.5s forwards;
        }

        @keyframes fadeIn {
            to { opacity: 1; }
        }

        .training-progress {
            background: rgba(0,0,0,0.8);
            border: 2px solid #ffd700;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .progress-bar {
            width: 100%;
            height: 30px;
            background: rgba(255,215,0,0.2);
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #ffed4e);
            width: 0%;
            transition: width 0.5s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #000;
        }

        .workflow-visualizer {
            background: rgba(0,0,0,0.8);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .workflow-step {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            background: rgba(0,255,255,0.2);
            border: 2px solid #00ffff;
            border-radius: 20px;
            transition: all 0.3s;
        }

        .workflow-step:hover {
            background: rgba(0,255,255,0.4);
            transform: scale(1.05);
        }

        .control-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            border: 2px solid #ff00ff;
            border-radius: 15px;
            padding: 20px;
        }

        .control-btn {
            display: block;
            width: 100%;
            background: linear-gradient(45deg, #ff00ff, #ff44ff);
            color: #fff;
            border: none;
            padding: 10px 20px;
            margin: 5px 0;
            cursor: pointer;
            border-radius: 20px;
            font-family: inherit;
            font-weight: bold;
            transition: all 0.3s;
        }

        .control-btn:hover {
            background: linear-gradient(45deg, #ff44ff, #ff88ff);
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(255,0,255,0.5);
        }

        .neural-activity {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 200px;
            height: 200px;
            border: 2px solid #ff00ff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, rgba(255,0,255,0.3), transparent);
            animation: neuralPulse 2s infinite;
        }

        @keyframes neuralPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
        }

        .neural-core {
            width: 60px;
            height: 60px;
            background: #ff00ff;
            border-radius: 50%;
            box-shadow: 0 0 30px #ff00ff;
        }
    </style>
</head>
<body>
    <div class="neural-activity">
        <div class="neural-core"></div>
    </div>

    <div class="cal-container">
        <h1 class="title">🧠 CAL - Cognitive Automation Layer</h1>
        
        <div class="cognitive-grid">
            <div class="module">
                <div class="module-title">📊 System Status</div>
                <div class="stat-item">
                    <span>Connected Systems:</span>
                    <span class="stat-value" id="connected-systems">0</span>
                </div>
                <div class="stat-item">
                    <span>Active Workflows:</span>
                    <span class="stat-value" id="active-workflows">0</span>
                </div>
                <div class="stat-item">
                    <span>Scheduled Tasks:</span>
                    <span class="stat-value" id="scheduled-tasks">0</span>
                </div>
                <div class="stat-item">
                    <span>Decision Rate:</span>
                    <span class="stat-value" id="decision-rate">0/min</span>
                </div>
            </div>
            
            <div class="module">
                <div class="module-title">🎓 Training Pipeline</div>
                <div class="stat-item">
                    <span>Queue Size:</span>
                    <span class="stat-value" id="training-queue">0</span>
                </div>
                <div class="stat-item">
                    <span>Trained Models:</span>
                    <span class="stat-value" id="trained-models">0</span>
                </div>
                <div class="stat-item">
                    <span>Accuracy Average:</span>
                    <span class="stat-value" id="accuracy-avg">0%</span>
                </div>
                <div class="stat-item">
                    <span>Embedded QR Data:</span>
                    <span class="stat-value" id="qr-data-count">0</span>
                </div>
            </div>
            
            <div class="module">
                <div class="module-title">🔍 Pattern Recognition</div>
                <div class="stat-item">
                    <span>QR Patterns:</span>
                    <span class="stat-value" id="qr-patterns">0</span>
                </div>
                <div class="stat-item">
                    <span>Vector Flows:</span>
                    <span class="stat-value" id="vector-flows">0</span>
                </div>
                <div class="stat-item">
                    <span>Body Shapes:</span>
                    <span class="stat-value" id="body-shapes">0</span>
                </div>
                <div class="stat-item">
                    <span>Laser Paths:</span>
                    <span class="stat-value" id="laser-paths">0</span>
                </div>
            </div>
        </div>

        <div class="training-progress">
            <div class="module-title">🤖 Active Training Progress</div>
            <div class="progress-bar">
                <div class="progress-fill" id="training-progress">0%</div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                <span>Epoch: <span id="current-epoch">0</span>/100</span>
                <span>Loss: <span id="current-loss">1.000</span></span>
                <span>Accuracy: <span id="current-accuracy">0%</span></span>
            </div>
        </div>

        <div class="workflow-visualizer">
            <div class="module-title">🔄 Active Workflow</div>
            <div id="workflow-steps">
                <div class="workflow-step">Waiting for workflow...</div>
            </div>
        </div>

        <div class="decision-log">
            <div class="module-title">🎯 Decision Log</div>
            <div id="decision-list">
                <div class="decision-item">CAL initialized and ready for cognitive automation...</div>
            </div>
        </div>
    </div>

    <div class="control-panel">
        <div style="color: #ff00ff; font-weight: bold; margin-bottom: 10px;">🎮 CAL Controls</div>
        <button class="control-btn" onclick="requestWorkflow()">Generate Workflow</button>
        <button class="control-btn" onclick="triggerTraining()">Force Training</button>
        <button class="control-btn" onclick="scanStorybook()">Scan Storybook</button>
        <button class="control-btn" onclick="analyzePatterns()">Analyze Patterns</button>
    </div>

    <script>
        let ws;
        let stats = {
            connected_systems: 0,
            active_workflows: 0,
            scheduled_tasks: 0,
            training_queue: 0,
            trained_models: 0,
            decision_count: 0,
            last_decision_time: Date.now()
        };

        function connectToCAL() {
            ws = new WebSocket('ws://localhost:4444');
            
            ws.onopen = () => {
                console.log('Connected to CAL');
                addDecision('Connected to Cognitive Automation Layer');
                updateStatus();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleCALMessage(data);
            };
            
            ws.onerror = () => {
                addDecision('Connection error - CAL may be offline', 'error');
            };
            
            ws.onclose = () => {
                addDecision('Disconnected from CAL', 'warning');
                setTimeout(connectToCAL, 5000);
            };
        }

        function handleCALMessage(data) {
            switch (data.type) {
                case 'training_progress':
                    updateTrainingProgress(data);
                    break;
                    
                case 'model_trained':
                    addDecision(\`Model trained: \${data.model_type} (Accuracy: \${(data.accuracy * 100).toFixed(1)}%)\`);
                    stats.trained_models++;
                    updateStatus();
                    break;
                    
                case 'pattern_alert':
                    addDecision(\`Pattern alert: \${data.pattern_count} patterns detected\`);
                    break;
                    
                case 'workflow_created':
                    updateWorkflow(data.workflow);
                    break;
            }
        }

        function updateTrainingProgress(data) {
            const progressBar = document.getElementById('training-progress');
            const progress = (data.epoch / 100) * 100;
            progressBar.style.width = progress + '%';
            progressBar.textContent = progress.toFixed(1) + '%';
            
            document.getElementById('current-epoch').textContent = data.epoch;
            document.getElementById('current-loss').textContent = data.loss.toFixed(3);
            document.getElementById('current-accuracy').textContent = (data.accuracy * 100).toFixed(1) + '%';
        }

        function updateWorkflow(workflow) {
            const container = document.getElementById('workflow-steps');
            container.innerHTML = '';
            
            workflow.steps.forEach((step, index) => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'workflow-step';
                stepDiv.textContent = \`\${index + 1}. \${step.system}\`;
                container.appendChild(stepDiv);
            });
        }

        function addDecision(message, type = 'info') {
            const list = document.getElementById('decision-list');
            const item = document.createElement('div');
            item.className = 'decision-item';
            
            const timestamp = new Date().toLocaleTimeString();
            item.textContent = \`[\${timestamp}] \${message}\`;
            
            if (type === 'error') item.style.borderColor = '#ff0000';
            else if (type === 'warning') item.style.borderColor = '#ffff00';
            
            list.insertBefore(item, list.firstChild);
            
            // Keep only last 20 decisions
            while (list.children.length > 20) {
                list.removeChild(list.lastChild);
            }
            
            stats.decision_count++;
            updateDecisionRate();
        }

        function updateDecisionRate() {
            const now = Date.now();
            const timeDiff = (now - stats.last_decision_time) / 60000; // minutes
            const rate = timeDiff > 0 ? (1 / timeDiff).toFixed(1) : 0;
            document.getElementById('decision-rate').textContent = rate + '/min';
            stats.last_decision_time = now;
        }

        async function updateStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                document.getElementById('connected-systems').textContent = status.connected_systems.length;
                document.getElementById('active-workflows').textContent = status.active_workflows;
                document.getElementById('scheduled-tasks').textContent = status.scheduled_tasks;
                document.getElementById('training-queue').textContent = status.training_queue_size;
                document.getElementById('trained-models').textContent = status.trained_models.length;
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }

        // Control functions
        async function requestWorkflow() {
            try {
                const response = await fetch('/api/workflow', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        goal: 'pattern_discovery_and_training',
                        systems: ['voxel_storybook', 'character_mascot', 'voxel_laser']
                    })
                });
                
                const workflow = await response.json();
                updateWorkflow(workflow);
                addDecision('Generated optimal workflow with confidence: ' + (workflow.confidence * 100).toFixed(1) + '%');
            } catch (error) {
                addDecision('Failed to generate workflow', 'error');
            }
        }

        async function triggerTraining() {
            try {
                const response = await fetch('/api/train', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        training_data: [{
                            type: 'manual_trigger',
                            vectors: [[1,2,3], [4,5,6], [7,8,9]],
                            timestamp: Date.now()
                        }]
                    })
                });
                
                const result = await response.json();
                addDecision('Training triggered - queue size: ' + result.queue_size);
            } catch (error) {
                addDecision('Failed to trigger training', 'error');
            }
        }

        async function scanStorybook() {
            try {
                const response = await fetch('/api/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task_name: 'Manual storybook scan',
                        task_type: 'scan_storybook',
                        delay_ms: 1000,
                        params: { pages: 'all' }
                    })
                });
                
                const result = await response.json();
                addDecision('Scheduled storybook scan: ' + result.task_id);
            } catch (error) {
                addDecision('Failed to schedule scan', 'error');
            }
        }

        function analyzePatterns() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'analyze_patterns',
                    deep_analysis: true
                }));
                addDecision('Pattern analysis requested');
            }
        }

        // Initialize
        connectToCAL();
        
        // Auto-update status
        setInterval(updateStatus, 5000);
        
        // Simulate some activity
        setInterval(() => {
            const activities = [
                'Processing vector flow data',
                'Analyzing QR patterns',
                'Optimizing workflow paths',
                'Checking system health',
                'Evaluating training metrics'
            ];
            
            if (Math.random() > 0.7) {
                addDecision(activities[Math.floor(Math.random() * activities.length)]);
            }
        }, 10000);

        // Neural activity animation
        const neuralCore = document.querySelector('.neural-core');
        setInterval(() => {
            const hue = (Date.now() / 100) % 360;
            neuralCore.style.background = \`hsl(\${hue}, 100%, 50%)\`;
            neuralCore.style.boxShadow = \`0 0 30px hsl(\${hue}, 100%, 50%)\`;
        }, 50);
    </script>
</body>
</html>
        `;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🧠 CAL - Cognitive Automation Layer: http://localhost:${this.port}`);
            console.log('🔄 Ready to orchestrate the entire system web');
            console.log('📊 Training pipeline: ACTIVE');
            console.log('🎯 Decision engine: ONLINE');
        });
    }
}

// Start CAL
const cal = new CalAIOrchestrator();
cal.start();

module.exports = CalAIOrchestrator;
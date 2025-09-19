#!/usr/bin/env node
/**
 * Brand-LLM Bridge System
 * 
 * Unified interface connecting visual element selection, LLM analysis, and micro-editing
 * Provides real-time communication between brand guidelines, sprites, and AI reasoning
 * Enables seamless "nano banana" precision editing workflow
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const { logger, createErrorBoundary } = require('./emergency-logging-system');
const { VisualElementSelector } = require('./visual-element-selector');
const { LLMVisualAnalyzer } = require('./llm-visual-analyzer');
const { MicroEditEngine } = require('./micro-edit-engine');
const { BrandSpriteIntegration } = require('./brand-sprite-integration');

class BrandLLMBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        this.boundary = createErrorBoundary('brand-llm-bridge');
        
        this.config = {
            port: config.port || 8092,
            autoConnect: config.autoConnect !== false,
            realTimeUpdates: config.realTimeUpdates !== false,
            persistSessions: config.persistSessions !== false,
            enableRecording: config.enableRecording !== false,
            maxSessionHistory: config.maxSessionHistory || 100,
            ...config
        };
        
        // Core components
        this.visualSelector = new VisualElementSelector();
        this.llmAnalyzer = new LLMVisualAnalyzer({
            apiProvider: 'simulation', // Start with simulation
            includePixelData: true,
            brandAwareness: true
        });
        this.microEditEngine = new MicroEditEngine({
            precision: 'pixel',
            enableUndo: true,
            realTimePreview: true,
            brandCompliance: true
        });
        this.brandIntegration = new BrandSpriteIntegration();
        
        // WebSocket server for real-time communication
        this.wsServer = null;
        this.clients = new Set();
        
        // Session management
        this.activeSessions = new Map();
        this.sessionHistory = [];
        
        // Workflow state
        this.currentWorkflow = null;
        this.workflowSteps = [];
        this.isProcessing = false;
        
        // Canvas references
        this.canvas = null;
        this.overlayCanvas = null;
        
        this.initializeWebSocketServer();
        this.setupComponentIntegration();
        
        logger.log('SYSTEM', 'Brand-LLM Bridge initialized', {
            port: this.config.port,
            components: ['VisualSelector', 'LLMAnalyzer', 'MicroEditor', 'BrandIntegration']
        });
    }
    
    // Initialize WebSocket server for real-time communication
    initializeWebSocketServer() {
        this.wsServer = new WebSocket.Server({ 
            port: this.config.port,
            perMessageDeflate: false
        });
        
        this.wsServer.on('connection', (ws, request) => {
            this.handleClientConnection(ws, request);
        });
        
        this.wsServer.on('error', (error) => {
            logger.log('ERROR', 'WebSocket server error', { error: error.message });
        });
        
        logger.log('INFO', 'WebSocket server started', { port: this.config.port });
    }
    
    handleClientConnection(ws, request) {
        const clientId = this.generateClientId();
        const clientInfo = {
            id: clientId,
            ws: ws,
            ip: request.socket.remoteAddress,
            userAgent: request.headers['user-agent'],
            connectedAt: new Date().toISOString()
        };
        
        this.clients.add(clientInfo);
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleClientMessage(clientInfo, message);
            } catch (error) {
                this.sendToClient(clientInfo, {
                    type: 'error',
                    message: 'Invalid JSON message',
                    error: error.message
                });
            }
        });
        
        ws.on('close', () => {
            this.clients.delete(clientInfo);
            logger.log('INFO', 'Client disconnected', { clientId });
        });
        
        ws.on('error', (error) => {
            logger.log('ERROR', 'WebSocket client error', { clientId, error: error.message });
        });
        
        // Send welcome message with current state
        this.sendToClient(clientInfo, {
            type: 'welcome',
            clientId: clientId,
            capabilities: this.getCapabilities(),
            brandGuidelines: this.brandIntegration.getBrandGuidelines()
        });
        
        logger.log('INFO', 'Client connected', { clientId, ip: clientInfo.ip });
    }
    
    handleClientMessage(client, message) {
        const { type, data } = message;
        
        switch (type) {
            case 'start_workflow':
                this.startWorkflow(client, data);
                break;
                
            case 'select_elements':
                this.handleElementSelection(client, data);
                break;
                
            case 'analyze_selection':
                this.handleAnalysisRequest(client, data);
                break;
                
            case 'execute_edits':
                this.handleEditRequest(client, data);
                break;
                
            case 'preview_changes':
                this.handlePreviewRequest(client, data);
                break;
                
            case 'commit_changes':
                this.handleCommitRequest(client, data);
                break;
                
            case 'undo_action':
                this.handleUndoRequest(client, data);
                break;
                
            case 'get_brand_suggestions':
                this.handleBrandSuggestions(client, data);
                break;
                
            case 'export_session':
                this.handleExportRequest(client, data);
                break;
                
            default:
                this.sendToClient(client, {
                    type: 'error',
                    message: `Unknown message type: ${type}`
                });
        }
    }
    
    // Setup integration between components
    setupComponentIntegration() {
        // Visual selector events
        this.visualSelector.on('selection-added', (data) => {
            this.broadcastToClients({
                type: 'selection_added',
                selection: data.selection,
                timestamp: new Date().toISOString()
            });
        });
        
        this.visualSelector.on('selection-complete', (data) => {
            // Automatically trigger analysis if configured
            if (this.config.autoAnalyze && data.selection) {
                this.triggerAutoAnalysis(data.selection);
            }
        });
        
        // Micro-edit engine events
        this.microEditEngine.on('commands-executed', (data) => {
            this.broadcastToClients({
                type: 'commands_executed',
                results: data.results,
                timestamp: new Date().toISOString()
            });
        });
        
        this.microEditEngine.on('edits-committed', (data) => {
            this.broadcastToClients({
                type: 'edits_committed',
                results: data.results,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    // Initialize with canvas elements
    initialize(canvas, overlayCanvas) {
        this.canvas = canvas;
        this.overlayCanvas = overlayCanvas;
        
        // Initialize all components with canvas
        this.visualSelector.initialize(canvas, overlayCanvas);
        this.microEditEngine.initialize(canvas, overlayCanvas);
        
        logger.log('INFO', 'Brand-LLM Bridge initialized with canvas', {
            canvasSize: { width: canvas.width, height: canvas.height }
        });
        
        this.broadcastToClients({
            type: 'system_ready',
            canvasSize: { width: canvas.width, height: canvas.height },
            timestamp: new Date().toISOString()
        });
    }
    
    // Workflow management
    async startWorkflow(client, data) {
        const workflowId = this.generateWorkflowId();
        const workflow = {
            id: workflowId,
            clientId: client.id,
            type: data.workflowType || 'sprite_analysis',
            startTime: new Date().toISOString(),
            steps: [],
            currentStep: 0,
            data: data
        };
        
        this.currentWorkflow = workflow;
        this.activeSessions.set(workflowId, workflow);
        
        this.sendToClient(client, {
            type: 'workflow_started',
            workflowId: workflowId,
            workflow: workflow
        });
        
        // Start the workflow based on type
        switch (workflow.type) {
            case 'sprite_analysis':
                await this.executeSpriteAnalysisWorkflow(client, workflow);
                break;
                
            case 'brand_compliance':
                await this.executeBrandComplianceWorkflow(client, workflow);
                break;
                
            case 'micro_editing':
                await this.executeMicroEditingWorkflow(client, workflow);
                break;
                
            default:
                this.sendToClient(client, {
                    type: 'error',
                    message: `Unknown workflow type: ${workflow.type}`
                });
        }
    }
    
    async executeCompleteWorkflow(client, selectionData) {
        this.isProcessing = true;
        const workflowId = this.generateWorkflowId();
        
        try {
            // Step 1: Visual Analysis
            this.updateWorkflowProgress(client, workflowId, 'analyzing', 'Analyzing visual elements...');
            
            const analysis = await this.llmAnalyzer.analyzeVisualElement(selectionData, 'improve');
            
            this.sendToClient(client, {
                type: 'analysis_complete',
                workflowId: workflowId,
                analysis: analysis
            });
            
            // Step 2: Generate micro-edit commands
            this.updateWorkflowProgress(client, workflowId, 'generating', 'Generating micro-edit commands...');
            
            const commands = analysis.micro_edit_commands || [];
            
            // Step 3: Preview changes
            if (commands.length > 0) {
                this.updateWorkflowProgress(client, workflowId, 'previewing', 'Showing command previews...');
                
                const previewResults = await this.microEditEngine.executeCommands(commands, selectionData);
                
                this.sendToClient(client, {
                    type: 'preview_ready',
                    workflowId: workflowId,
                    commands: commands,
                    previewResults: previewResults
                });
                
                // Step 4: Brand compliance check
                this.updateWorkflowProgress(client, workflowId, 'validating', 'Checking brand compliance...');
                
                const brandValidation = this.validateBrandCompliance(previewResults);
                
                this.sendToClient(client, {
                    type: 'brand_validation',
                    workflowId: workflowId,
                    validation: brandValidation
                });
            }
            
            this.updateWorkflowProgress(client, workflowId, 'complete', 'Workflow completed successfully!');
            
        } catch (error) {
            logger.log('ERROR', 'Workflow execution failed', {
                workflowId,
                error: error.message
            });
            
            this.sendToClient(client, {
                type: 'workflow_error',
                workflowId: workflowId,
                error: error.message
            });
        } finally {
            this.isProcessing = false;
        }
    }
    
    // Handler methods
    async handleElementSelection(client, data) {
        try {
            const selectionData = this.visualSelector.exportSelectionsForLLM();
            
            this.sendToClient(client, {
                type: 'elements_selected',
                selectionData: selectionData,
                count: selectionData.selections.length
            });
            
            // Auto-trigger complete workflow if enabled
            if (this.config.autoWorkflow && selectionData.selections.length > 0) {
                await this.executeCompleteWorkflow(client, selectionData);
            }
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Selection handling failed',
                error: error.message
            });
        }
    }
    
    async handleAnalysisRequest(client, data) {
        try {
            const { selectionData, analysisType = 'improve' } = data;
            
            this.sendToClient(client, {
                type: 'analysis_started',
                analysisType: analysisType
            });
            
            const analysis = await this.llmAnalyzer.analyzeVisualElement(selectionData, analysisType);
            
            this.sendToClient(client, {
                type: 'analysis_complete',
                analysis: analysis,
                suggestions: analysis.improvement_suggestions,
                commands: analysis.micro_edit_commands
            });
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Analysis failed',
                error: error.message
            });
        }
    }
    
    async handleEditRequest(client, data) {
        try {
            const { commands, selectionData, executeImmediately = false } = data;
            
            this.sendToClient(client, {
                type: 'edit_started',
                commandCount: commands.length
            });
            
            const results = await this.microEditEngine.executeCommands(commands, selectionData);
            
            if (executeImmediately) {
                // Commit changes immediately
                await this.microEditEngine.commitEdits(results);
            }
            
            this.sendToClient(client, {
                type: 'edit_complete',
                results: results,
                committed: executeImmediately
            });
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Edit execution failed',
                error: error.message
            });
        }
    }
    
    async handlePreviewRequest(client, data) {
        try {
            const { commands, selectionData } = data;
            
            // Enable preview mode
            this.microEditEngine.previewMode = true;
            
            const previewResults = await this.microEditEngine.executeCommands(commands, selectionData);
            
            this.sendToClient(client, {
                type: 'preview_ready',
                previewResults: previewResults
            });
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Preview failed',
                error: error.message
            });
        }
    }
    
    async handleCommitRequest(client, data) {
        try {
            if (this.microEditEngine.previewMode) {
                // Commit the previewed changes
                await this.microEditEngine.commitEdits(data.results || []);
                
                this.sendToClient(client, {
                    type: 'changes_committed',
                    success: true
                });
            } else {
                this.sendToClient(client, {
                    type: 'error',
                    message: 'No preview to commit'
                });
            }
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Commit failed',
                error: error.message
            });
        }
    }
    
    handleUndoRequest(client, data) {
        try {
            const success = this.microEditEngine.undo();
            
            this.sendToClient(client, {
                type: 'undo_complete',
                success: success,
                canUndo: this.microEditEngine.canUndo(),
                canRedo: this.microEditEngine.canRedo()
            });
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Undo failed',
                error: error.message
            });
        }
    }
    
    handleBrandSuggestions(client, data) {
        try {
            const { selectionData } = data;
            const suggestions = [];
            
            selectionData.selections.forEach(selection => {
                const brandCompliance = this.brandIntegration.validateBrandCompliance(selection);
                
                if (brandCompliance.issues.length > 0) {
                    suggestions.push({
                        selectionId: selection.id,
                        compliance: brandCompliance,
                        suggestions: brandCompliance.recommendations
                    });
                }
            });
            
            this.sendToClient(client, {
                type: 'brand_suggestions',
                suggestions: suggestions
            });
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Brand suggestions failed',
                error: error.message
            });
        }
    }
    
    handleExportRequest(client, data) {
        try {
            const { format = 'json' } = data;
            
            const exportData = {
                timestamp: new Date().toISOString(),
                selections: this.visualSelector.exportSelectionsForLLM(),
                editHistory: this.microEditEngine.exportEditSession(),
                brandGuidelines: this.brandIntegration.getBrandGuidelines(),
                session: this.currentWorkflow
            };
            
            let formattedData;
            
            switch (format) {
                case 'json':
                    formattedData = JSON.stringify(exportData, null, 2);
                    break;
                case 'markdown':
                    formattedData = this.exportToMarkdown(exportData);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
            this.sendToClient(client, {
                type: 'export_ready',
                format: format,
                data: formattedData
            });
            
        } catch (error) {
            this.sendToClient(client, {
                type: 'error',
                message: 'Export failed',
                error: error.message
            });
        }
    }
    
    // Auto-analysis trigger
    async triggerAutoAnalysis(selection) {
        if (this.isProcessing) return;
        
        const selectionData = this.visualSelector.exportSelectionsForLLM();
        
        try {
            const analysis = await this.llmAnalyzer.analyzeVisualElement(selectionData, 'describe');
            
            this.broadcastToClients({
                type: 'auto_analysis',
                analysis: analysis,
                selection: selection
            });
            
        } catch (error) {
            logger.log('ERROR', 'Auto-analysis failed', { error: error.message });
        }
    }
    
    // Utility methods
    updateWorkflowProgress(client, workflowId, status, message) {
        this.sendToClient(client, {
            type: 'workflow_progress',
            workflowId: workflowId,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        });
    }
    
    validateBrandCompliance(results) {
        // Aggregate brand compliance validation across all results
        const validations = results.map(result => {
            if (result.brandValidation) {
                return result.brandValidation;
            }
            return { compliant: true, issues: [] };
        });
        
        return {
            overallCompliant: validations.every(v => v.compliant),
            totalIssues: validations.reduce((sum, v) => sum + (v.issues?.length || 0), 0),
            validations: validations
        };
    }
    
    sendToClient(client, message) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                ...message,
                timestamp: message.timestamp || new Date().toISOString(),
                clientId: client.id
            }));
        }
    }
    
    broadcastToClients(message) {
        this.clients.forEach(client => {
            this.sendToClient(client, message);
        });
    }
    
    getCapabilities() {
        return {
            visualSelection: ['rectangle', 'lasso', 'magicWand', 'eyedropper'],
            llmAnalysis: ['describe', 'improve', 'microEdit', 'compare', 'brandCheck'],
            microEditing: ['move', 'resize', 'color', 'style', 'brand'],
            brandCompliance: ['validation', 'suggestions', 'corrections'],
            realTime: ['preview', 'undo', 'redo', 'collaboration'],
            export: ['json', 'markdown', 'session']
        };
    }
    
    exportToMarkdown(data) {
        let md = `# Brand-LLM Session Export\n\n`;
        md += `**Generated:** ${data.timestamp}\n\n`;
        
        if (data.selections.selections.length > 0) {
            md += `## Visual Selections (${data.selections.selections.length})\n\n`;
            data.selections.selections.forEach((sel, i) => {
                md += `### Selection ${i + 1}\n`;
                md += `- **Type:** ${sel.type}\n`;
                md += `- **Size:** ${sel.bounds.width}x${sel.bounds.height}\n`;
                md += `- **Position:** (${sel.bounds.x}, ${sel.bounds.y})\n\n`;
            });
        }
        
        if (data.editHistory.editHistory.length > 0) {
            md += `## Edit History\n\n`;
            md += `**Total Steps:** ${data.editHistory.editHistory.length}\n`;
            md += `**Current Index:** ${data.editHistory.currentIndex}\n\n`;
        }
        
        md += `## Brand Guidelines\n\n`;
        md += `**Primary Colors:**\n`;
        Object.entries(data.brandGuidelines.colors.primary).forEach(([name, color]) => {
            md += `- ${name}: ${color}\n`;
        });
        
        return md;
    }
    
    generateClientId() {
        return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateWorkflowId() {
        return 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Cleanup
    shutdown() {
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        this.clients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.close();
            }
        });
        
        logger.log('INFO', 'Brand-LLM Bridge shutdown complete');
    }
}

// Export for use in other modules
module.exports = {
    BrandLLMBridge
};

// If run directly, start the bridge server
if (require.main === module) {
    console.log('🌉 Brand-LLM Bridge - Starting Server\n');
    
    const bridge = new BrandLLMBridge({
        port: 8092,
        autoWorkflow: true,
        realTimeUpdates: true
    });
    
    console.log('🔗 Bridge Components:');
    console.log('  ✅ Visual Element Selector - Smart highlighting and selection');
    console.log('  ✅ LLM Visual Analyzer - AI-powered visual analysis');
    console.log('  ✅ Micro-Edit Engine - Nano-precision adjustments');
    console.log('  ✅ Brand Integration - BlameChain compliance');
    
    console.log('\n🌐 WebSocket Server:');
    console.log(`  • Listening on port 8092`);
    console.log(`  • Real-time communication enabled`);
    console.log(`  • Auto-workflow enabled`);
    
    console.log('\n📡 Message Types:');
    console.log('  • start_workflow - Begin analysis workflow');
    console.log('  • select_elements - Handle visual selections');
    console.log('  • analyze_selection - Request LLM analysis');
    console.log('  • execute_edits - Run micro-edit commands');
    console.log('  • preview_changes - Show edit previews');
    console.log('  • commit_changes - Apply changes');
    console.log('  • undo_action - Revert changes');
    console.log('  • get_brand_suggestions - Brand compliance help');
    console.log('  • export_session - Export workflow data');
    
    console.log('\n🔄 Workflow Types:');
    console.log('  • sprite_analysis - Complete sprite → LLM → edit workflow');
    console.log('  • brand_compliance - Brand guideline validation');
    console.log('  • micro_editing - Precision adjustment workflow');
    
    console.log('\n🎯 Complete Integration:');
    console.log('  1. Select visual elements (pixel-perfect)');
    console.log('  2. AI analyzes and generates descriptions');
    console.log('  3. AI suggests micro-edit commands');
    console.log('  4. Preview changes in real-time');
    console.log('  5. Apply nano-precision adjustments');
    console.log('  6. Validate brand compliance');
    console.log('  7. Export results and session data');
    
    console.log('\n🚀 Ready for "nano banana" precision editing!');
    console.log('Connect via WebSocket to ws://localhost:8092');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Brand-LLM Bridge...');
        bridge.shutdown();
        process.exit(0);
    });
}
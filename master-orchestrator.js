#!/usr/bin/env node

/**
 * Document Generator Master Orchestrator
 * Connects all layers: Templates + Mesh + Tools + Integration
 */

const DocumentGeneratorIntegration = require('./integration-layer.js');
const { DocumentGeneratorMesh, MeshCharacter } = require('./mesh-layer.js');
const DocumentGeneratorToolLayer = require('./tool-layer.js');

class DocumentGeneratorMasterOrchestrator {
  constructor() {
    this.layers = {
      integration: null,
      mesh: null,
      tools: null
    };
    this.characters = new Map();
    this.isRunning = false;
  }

  async initialize() {
    console.log('🎭 DOCUMENT GENERATOR MASTER ORCHESTRATOR');
    console.log('==========================================');
    console.log('Initializing the complete system...\n');

    // Initialize all layers
    await this.initializeLayers();
    await this.connectLayers();
    await this.deployCharacters();
    
    this.isRunning = true;
    console.log('\n✅ MASTER ORCHESTRATOR OPERATIONAL!');
    
    return this;
  }

  async initializeLayers() {
    console.log('🔧 Initializing system layers...');
    
    // 1. Tool Layer (Foundation)
    console.log('\n1. 🛠️  Initializing Tool Layer...');
    this.layers.tools = new DocumentGeneratorToolLayer();
    await this.layers.tools.initialize();
    
    // 2. Mesh Layer (Communication)
    console.log('\n2. 🕸️  Initializing Mesh Layer...');
    this.layers.mesh = new DocumentGeneratorMesh();
    await this.layers.mesh.initialize();
    
    // 3. Integration Layer (Orchestration)
    console.log('\n3. 🔗 Initializing Integration Layer...');
    this.layers.integration = new DocumentGeneratorIntegration();
    await this.layers.integration.initialize();
    
    console.log('\n✅ All layers initialized');
  }

  async connectLayers() {
    console.log('\n🌉 Connecting layers...');
    
    // Connect Integration → Tools
    this.layers.integration.toolLayer = this.layers.tools;
    
    // Connect Integration → Mesh
    this.layers.integration.mesh = this.layers.mesh;
    
    // Connect Mesh → Tools (for tool discovery)
    this.layers.mesh.registerService('tool_layer', {
      type: 'core',
      port: null,
      endpoint: 'tool-layer.js',
      capabilities: ['document_parsing', 'ai_processing', 'code_generation']
    });
    
    // Event bridging
    this.setupEventBridging();
    
    console.log('✅ Layers connected');
  }

  setupEventBridging() {
    console.log('🌉 Setting up cross-layer event bridging...');
    
    // Integration → Mesh events
    this.layers.integration.on('document:processed', (data) => {
      this.layers.mesh.publish('document.processed', data, 'integration');
    });
    
    this.layers.integration.on('mvp:generated', (data) => {
      this.layers.mesh.publish('mvp.generated', data, 'integration');
    });
    
    // Mesh → Integration events
    this.layers.mesh.on('document.uploaded', (message) => {
      this.layers.integration.emit('document:uploaded', message.data);
    });
    
    console.log('✅ Event bridging active');
  }

  async deployCharacters() {
    console.log('\n🎭 Deploying characters...');
    
    // Deploy Aria (Conductor) - Master orchestrator
    const aria = new MeshCharacter(this.layers.mesh, 'Aria', 'Conductor');
    aria.masterOrchestrator = this;
    
    // Override Aria's orchestration to include full system control
    aria.conductOrchestration = (event) => {
      aria.announce(`orchestrating ${event.type} across all layers`);
      
      // Route to appropriate layer
      if (event.type.includes('document')) {
        this.handleDocumentEvent(event);
      } else if (event.type.includes('code')) {
        this.handleCodeEvent(event);
      } else if (event.type.includes('mvp')) {
        this.handleMVPEvent(event);
      }
    };
    
    this.characters.set('aria', aria);
    
    // Deploy Rex (Navigator) - Cross-layer routing
    const rex = new MeshCharacter(this.layers.mesh, 'Rex', 'Navigator');
    rex.masterOrchestrator = this;
    
    rex.navigateRouting = (event) => {
      rex.announce(`routing ${event.type} between layers`);
      this.routeEventBetweenLayers(event);
    };
    
    this.characters.set('rex', rex);
    
    // Deploy Sage (Guardian) - System monitoring
    const sage = new MeshCharacter(this.layers.mesh, 'Sage', 'Guardian');
    sage.masterOrchestrator = this;
    
    sage.guardSecurity = (event) => {
      sage.announce(`monitoring ${event.type} for system health`);
      this.monitorSystemHealth(event);
    };
    
    this.characters.set('sage', sage);
    
    // Deploy Echo (Template Specialist) - New character for template management
    const echo = new MeshCharacter(this.layers.mesh, 'Echo', 'Specialist');
    echo.masterOrchestrator = this;
    echo.specialty = 'templates';
    
    echo.handleEvent = (event) => {
      if (event.type.includes('template') || event.type.includes('generation')) {
        echo.announce(`managing templates for ${event.type}`);
        this.handleTemplateEvent(event);
      }
    };
    
    this.characters.set('echo', echo);
    
    console.log('✅ Characters deployed:');
    console.log('  🎵 Aria (Conductor) - Master orchestration');
    console.log('  🧭 Rex (Navigator) - Cross-layer routing');
    console.log('  🛡️  Sage (Guardian) - System monitoring');
    console.log('  🎨 Echo (Specialist) - Template management');
  }

  // Event handlers
  handleDocumentEvent(event) {
    console.log(`📄 Handling document event: ${event.type}`);
    
    if (event.type === 'document.uploaded') {
      this.processDocumentThroughLayers(event.data);
    }
  }

  handleCodeEvent(event) {
    console.log(`💻 Handling code event: ${event.type}`);
    
    if (event.type === 'code.generation_requested') {
      this.generateCodeThroughLayers(event.data);
    }
  }

  handleMVPEvent(event) {
    console.log(`🚀 Handling MVP event: ${event.type}`);
    
    if (event.type === 'mvp.package_requested') {
      this.packageMVPThroughLayers(event.data);
    }
  }

  handleTemplateEvent(event) {
    console.log(`📋 Handling template event: ${event.type}`);
    
    // Template-specific logic here
    const echo = this.characters.get('echo');
    echo.announce('processing template request');
  }

  routeEventBetweenLayers(event) {
    // Smart routing based on event type
    if (event.type.includes('tool')) {
      this.layers.tools.emit('external_event', event);
    } else if (event.type.includes('integration')) {
      this.layers.integration.emit('external_event', event);
    }
  }

  monitorSystemHealth(event) {
    const metrics = this.layers.mesh.getMetrics();
    
    if (metrics.healthyServices < metrics.services * 0.8) {
      console.log('⚠️  System health below threshold!');
      this.layers.mesh.publish('system.health_warning', metrics, 'sage');
    }
  }

  // Complete document processing pipeline
  async processDocumentThroughLayers(documentData) {
    console.log('\n🔄 COMPLETE DOCUMENT PROCESSING PIPELINE');
    console.log('========================================');
    
    const aria = this.characters.get('aria');
    aria.announce('beginning complete document processing');
    
    try {
      // Stage 1: Parse document (Tool Layer)
      console.log('\n1. 📄 Document Parsing (Tool Layer)...');
      const parsed = await this.layers.tools.processDocument(documentData.filepath);
      this.layers.mesh.publish('document.parsed', parsed, 'tools');
      
      // Stage 2: Extract requirements (Tool Layer + AI)
      console.log('\n2. 📋 Requirements Extraction...');
      const requirements = await this.layers.tools.extractRequirements(parsed);
      this.layers.mesh.publish('requirements.extracted', requirements, 'tools');
      
      // Stage 3: Human approval (Integration Layer)
      console.log('\n3. 👤 Human Approval Checkpoint...');
      const approved = await this.requestHumanApproval('requirements', requirements);
      if (!approved) throw new Error('Requirements not approved');
      
      // Stage 4: Design architecture (Tool Layer + AI)
      console.log('\n4. 🏗️  Architecture Design...');
      const architecture = await this.layers.tools.designArchitecture(requirements);
      this.layers.mesh.publish('architecture.designed', architecture, 'tools');
      
      // Stage 5: Human approval (Integration Layer)
      console.log('\n5. 👤 Architecture Approval...');
      const archApproved = await this.requestHumanApproval('architecture', architecture);
      if (!archApproved) throw new Error('Architecture not approved');
      
      // Stage 6: Generate code (Tool Layer)
      console.log('\n6. 💻 Code Generation...');
      const code = await this.layers.tools.generateCode(architecture, requirements);
      this.layers.mesh.publish('code.generated', code, 'tools');
      
      // Stage 7: Human approval (Integration Layer)
      console.log('\n7. 👤 Code Approval...');
      const codeApproved = await this.requestHumanApproval('code', code);
      if (!codeApproved) throw new Error('Code not approved');
      
      // Stage 8: Package MVP (Integration Layer + Git)
      console.log('\n8. 📦 MVP Packaging...');
      const mvp = await this.packageCompleteMVP(code, architecture, requirements);
      this.layers.mesh.publish('mvp.completed', mvp, 'integration');
      
      console.log('\n🎉 DOCUMENT PROCESSING COMPLETE!');
      aria.announce('document processing pipeline complete - MVP ready for deployment');
      
      return mvp;
      
    } catch (error) {
      console.error('\n❌ Pipeline failed:', error.message);
      this.layers.mesh.publish('pipeline.failed', { error: error.message }, 'orchestrator');
      throw error;
    }
  }

  async requestHumanApproval(stage, data) {
    console.log(`👤 Requesting human approval for: ${stage}`);
    
    // Use integration layer's approval system
    const approval = await this.layers.integration.requestHumanApproval(stage, data);
    
    return approval.approved;
  }

  async packageCompleteMVP(code, architecture, requirements) {
    console.log('📦 Packaging complete MVP...');
    
    // Use integration layer to package
    const mvp = await this.layers.integration.packageMVP(code, architecture, requirements);
    
    // Use git wrapper to create repository
    if (this.layers.integration.gitWrapper) {
      const repo = await this.layers.integration.gitWrapper.createMVPRepository(
        mvp.name,
        mvp
      );
      mvp.repository = repo;
    }
    
    return mvp;
  }

  // System control methods
  async startAllServices() {
    console.log('\n🚀 Starting all services...');
    
    const aria = this.characters.get('aria');
    aria.announce('starting all system services');
    
    // Start web interface
    if (this.layers.integration.services.webInterface) {
      console.log('🌐 Web interface already running');
    }
    
    // Start API server
    if (this.layers.integration.services.apiServer) {
      console.log('🔗 API server already running');
    }
    
    console.log('✅ All services operational');
  }

  async processDocument(filePath) {
    if (!this.isRunning) {
      throw new Error('Master orchestrator not initialized');
    }
    
    return this.processDocumentThroughLayers({ filepath: filePath });
  }

  getSystemStatus() {
    return {
      running: this.isRunning,
      layers: {
        integration: !!this.layers.integration,
        mesh: !!this.layers.mesh,
        tools: !!this.layers.tools
      },
      characters: Array.from(this.characters.keys()),
      services: this.layers.mesh ? this.layers.mesh.getServiceStatus() : {},
      metrics: this.layers.mesh ? this.layers.mesh.getMetrics() : {}
    };
  }

  showSystemDashboard() {
    console.log('\n🎭 DOCUMENT GENERATOR SYSTEM DASHBOARD');
    console.log('======================================');
    
    const status = this.getSystemStatus();
    
    console.log(`🔄 System Status: ${status.running ? 'RUNNING' : 'STOPPED'}`);
    console.log(`🏗️  Layers: Integration(${status.layers.integration}), Mesh(${status.layers.mesh}), Tools(${status.layers.tools})`);
    console.log(`🎭 Characters: [${status.characters.join(', ')}]`);
    
    if (this.layers.mesh) {
      console.log('\n🕸️  Service Mesh:');
      this.layers.mesh.showDashboard();
    }
    
    if (this.layers.tools) {
      console.log('\n🛠️  Tool Layer:');
      const toolStatus = this.layers.tools.getStatus();
      console.log(`   🔧 Tools: ${toolStatus.tools.length}`);
      console.log(`   🤖 AI Providers: ${toolStatus.aiProviders.length}`);
      console.log(`   📋 Templates: ${toolStatus.templates.length}`);
    }
    
    console.log('\n🎯 Ready for document processing!');
  }

  async shutdown() {
    console.log('\n🛑 Shutting down master orchestrator...');
    
    const aria = this.characters.get('aria');
    if (aria) {
      aria.announce('graceful system shutdown initiated');
    }
    
    // Shutdown integration layer
    if (this.layers.integration) {
      await this.layers.integration.shutdown();
    }
    
    this.isRunning = false;
    console.log('✅ Master orchestrator shutdown complete');
  }
}

// Start master orchestrator if run directly
if (require.main === module) {
  const masterOrchestrator = new DocumentGeneratorMasterOrchestrator();
  
  masterOrchestrator.initialize().then(async () => {
    
    // Show system dashboard
    masterOrchestrator.showSystemDashboard();
    
    // Start all services
    await masterOrchestrator.startAllServices();
    
    console.log('\n🎯 DOCUMENT GENERATOR FULLY OPERATIONAL!');
    console.log('========================================');
    console.log('🌐 Web Interface: http://localhost:8080');
    console.log('🔗 API Bridge: http://localhost:3001');
    console.log('📋 CLI: node cli.js');
    console.log('🎭 Master: node master-orchestrator.js');
    console.log('\n✅ Ready to transform documents into MVPs!');
    
  }).catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    await masterOrchestrator.shutdown();
    process.exit(0);
  });
}

module.exports = DocumentGeneratorMasterOrchestrator;
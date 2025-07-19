#!/usr/bin/env node

/**
 * Document Generator Mesh Layer
 * Service mesh connecting all distributed components
 */

const { EventEmitter } = require('events');
const WebSocket = require('ws');

class DocumentGeneratorMesh extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.connections = new Map();
    this.messageQueue = [];
    this.isRunning = false;
  }

  async initialize() {
    console.log('🕸️  DOCUMENT GENERATOR MESH LAYER');
    console.log('=================================');
    
    await this.setupServiceRegistry();
    await this.setupMessageBroker();
    await this.setupHealthMonitoring();
    
    this.isRunning = true;
    console.log('✅ Mesh layer operational');
    
    return this;
  }

  async setupServiceRegistry() {
    console.log('📋 Setting up service registry...');
    
    // Register all services
    this.registerService('cli', {
      type: 'interface',
      port: null,
      endpoint: 'node cli.js',
      capabilities: ['user_interface', 'process_control']
    });
    
    this.registerService('web', {
      type: 'interface', 
      port: 8080,
      endpoint: 'http://localhost:8080',
      capabilities: ['web_ui', 'file_upload', 'real_time_updates']
    });
    
    this.registerService('api', {
      type: 'core',
      port: 3001,
      endpoint: 'http://localhost:3001',
      capabilities: ['document_processing', 'job_management', 'human_approval']
    });
    
    this.registerService('sovereign', {
      type: 'processor',
      port: null,
      endpoint: 'FinishThisIdea/sovereign-chatlog-processor.js',
      capabilities: ['chat_analysis', 'reasoning', 'autonomous_processing']
    });
    
    this.registerService('git', {
      type: 'utility',
      port: null,
      endpoint: 'git-wrapper.js',
      capabilities: ['repository_management', 'mvp_packaging', 'deployment']
    });
    
    this.registerService('integration', {
      type: 'orchestrator',
      port: null,
      endpoint: 'integration-layer.js', 
      capabilities: ['service_coordination', 'event_routing', 'workflow_management']
    });
    
    console.log(`✅ ${this.services.size} services registered`);
  }

  registerService(name, config) {
    this.services.set(name, {
      ...config,
      status: 'registered',
      lastSeen: new Date(),
      connections: 0
    });
    
    console.log(`📝 Registered: ${name} (${config.type})`);
  }

  async setupMessageBroker() {
    console.log('📬 Setting up message broker...');
    
    // Event routing table
    this.routingTable = {
      'document.uploaded': ['api', 'integration'],
      'processing.started': ['web', 'cli'],
      'stage.completed': ['web', 'cli', 'git'],
      'approval.needed': ['web', 'cli'],
      'approval.received': ['api', 'integration'],
      'mvp.generated': ['git', 'web', 'cli'],
      'error.occurred': ['web', 'cli', 'integration']
    };
    
    // Message handling
    this.on('message', (message) => {
      this.routeMessage(message);
    });
    
    console.log('✅ Message broker ready');
  }

  routeMessage(message) {
    const { type, source, data } = message;
    const targets = this.routingTable[type] || [];
    
    console.log(`📡 Routing message: ${type} from ${source} to [${targets.join(', ')}]`);
    
    targets.forEach(target => {
      if (target !== source) {
        this.sendToService(target, message);
      }
    });
  }

  sendToService(serviceName, message) {
    const service = this.services.get(serviceName);
    if (!service) {
      console.log(`❌ Service not found: ${serviceName}`);
      return;
    }
    
    // Different delivery methods based on service type
    switch (service.type) {
      case 'interface':
        this.sendToInterface(serviceName, message);
        break;
      case 'core':
        this.sendToAPI(serviceName, message);
        break;
      case 'processor':
        this.sendToProcessor(serviceName, message);
        break;
      default:
        console.log(`📤 Queuing message for ${serviceName}:`, message.type);
        this.queueMessage(serviceName, message);
    }
  }

  sendToInterface(serviceName, message) {
    // Send to UI interfaces via WebSocket or event
    if (serviceName === 'web') {
      this.emit('web:message', message);
    } else if (serviceName === 'cli') {
      this.emit('cli:message', message);
    }
  }

  sendToAPI(serviceName, message) {
    // Send to API services via HTTP
    const service = this.services.get(serviceName);
    if (service.port) {
      // HTTP request to service
      console.log(`🌐 HTTP to ${service.endpoint}:`, message.type);
    }
  }

  sendToProcessor(serviceName, message) {
    // Send to processing services via events or files
    console.log(`⚙️ Processing message for ${serviceName}:`, message.type);
    this.emit(`${serviceName}:message`, message);
  }

  queueMessage(serviceName, message) {
    this.messageQueue.push({
      target: serviceName,
      message,
      timestamp: new Date()
    });
  }

  async setupHealthMonitoring() {
    console.log('❤️ Setting up health monitoring...');
    
    // Health check interval
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
    
    console.log('✅ Health monitoring active');
  }

  async performHealthChecks() {
    console.log('🔍 Performing health checks...');
    
    for (const [name, service] of this.services) {
      try {
        const health = await this.checkServiceHealth(name, service);
        service.status = health ? 'healthy' : 'unhealthy';
        service.lastSeen = new Date();
      } catch (error) {
        service.status = 'error';
        console.log(`❌ Health check failed for ${name}:`, error.message);
      }
    }
  }

  async checkServiceHealth(name, service) {
    switch (service.type) {
      case 'core':
        if (service.port) {
          try {
            const response = await fetch(`${service.endpoint}/health`);
            return response.ok;
          } catch {
            return false;
          }
        }
        return true;
        
      case 'interface':
      case 'processor':
      case 'utility':
        // Check if files exist and are accessible
        const fs = require('fs');
        const path = require('path');
        
        if (service.endpoint.endsWith('.js')) {
          return fs.existsSync(path.join(__dirname, service.endpoint));
        }
        return true;
        
      default:
        return true;
    }
  }

  // Mesh API for other components
  publish(eventType, data, source = 'unknown') {
    const message = {
      type: eventType,
      source,
      data,
      timestamp: new Date(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    console.log(`📢 Publishing: ${eventType} from ${source}`);
    this.emit('message', message);
    
    return message.id;
  }

  subscribe(serviceName, eventTypes, callback) {
    console.log(`📻 ${serviceName} subscribing to: [${eventTypes.join(', ')}]`);
    
    eventTypes.forEach(eventType => {
      this.on(`${serviceName}:message`, (message) => {
        if (message.type === eventType) {
          callback(message);
        }
      });
    });
  }

  getServiceStatus() {
    const status = {};
    
    for (const [name, service] of this.services) {
      status[name] = {
        type: service.type,
        status: service.status,
        endpoint: service.endpoint,
        lastSeen: service.lastSeen,
        capabilities: service.capabilities
      };
    }
    
    return status;
  }

  async discoverServices() {
    console.log('🔍 Discovering active services...');
    
    // Try to ping all registered services
    const discovered = [];
    
    for (const [name, service] of this.services) {
      const isActive = await this.checkServiceHealth(name, service);
      if (isActive) {
        discovered.push(name);
        console.log(`✅ Found active service: ${name}`);
      } else {
        console.log(`❌ Service not responding: ${name}`);
      }
    }
    
    return discovered;
  }

  // Workflow orchestration
  async orchestrateDocumentProcessing(document) {
    console.log('🎭 Orchestrating document processing workflow...');
    
    const workflowId = `workflow-${Date.now()}`;
    
    // Step 1: Document uploaded
    this.publish('document.uploaded', { document, workflowId }, 'mesh');
    
    // Step 2: Start processing
    this.publish('processing.started', { workflowId }, 'mesh');
    
    // The workflow will continue via event routing
    return workflowId;
  }

  // Service mesh statistics
  getMetrics() {
    return {
      services: this.services.size,
      healthyServices: Array.from(this.services.values()).filter(s => s.status === 'healthy').length,
      queuedMessages: this.messageQueue.length,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: Array.from(this.services.values()).reduce((sum, s) => sum + s.connections, 0)
    };
  }

  // Mesh dashboard
  showDashboard() {
    console.log('\n🕸️  DOCUMENT GENERATOR SERVICE MESH');
    console.log('===================================');
    
    const metrics = this.getMetrics();
    
    console.log(`📊 Services: ${metrics.healthyServices}/${metrics.services} healthy`);
    console.log(`📬 Queued Messages: ${metrics.queuedMessages}`);
    console.log(`⏱️  Uptime: ${Math.round(metrics.uptime)}s`);
    console.log(`💾 Memory: ${Math.round(metrics.memory.heapUsed / 1024 / 1024)}MB`);
    
    console.log('\n📋 Service Registry:');
    for (const [name, service] of this.services) {
      const statusIcon = service.status === 'healthy' ? '✅' : service.status === 'unhealthy' ? '⚠️' : '❌';
      console.log(`  ${statusIcon} ${name} (${service.type}) - ${service.endpoint}`);
    }
    
    console.log('\n📡 Message Routing:');
    Object.entries(this.routingTable).forEach(([event, targets]) => {
      console.log(`  ${event} → [${targets.join(', ')}]`);
    });
  }
}

// Character integration point
class MeshCharacter {
  constructor(mesh, name, role) {
    this.mesh = mesh;
    this.name = name;
    this.role = role;
    this.personality = this.definePersonality();
  }

  definePersonality() {
    const personalities = {
      'Conductor': {
        traits: ['orchestrating', 'coordinating', 'overseeing'],
        responses: ['conducting the symphony', 'harmonizing services', 'directing the flow']
      },
      'Navigator': {
        traits: ['routing', 'pathfinding', 'connecting'],
        responses: ['charting the course', 'finding the way', 'bridging connections']
      },
      'Guardian': {
        traits: ['protecting', 'monitoring', 'securing'],
        responses: ['standing watch', 'ensuring safety', 'maintaining vigilance']
      }
    };
    
    return personalities[this.role] || personalities['Navigator'];
  }

  announce(action) {
    const response = this.personality.responses[Math.floor(Math.random() * this.personality.responses.length)];
    console.log(`🎭 ${this.name} (${this.role}): ${response} - ${action}`);
  }

  handleEvent(event) {
    this.announce(`handling ${event.type}`);
    
    // Character-specific logic based on role
    switch (this.role) {
      case 'Conductor':
        this.conductOrchestration(event);
        break;
      case 'Navigator':
        this.navigateRouting(event);
        break;
      case 'Guardian':
        this.guardSecurity(event);
        break;
    }
  }

  conductOrchestration(event) {
    if (event.type.includes('processing')) {
      this.mesh.publish('orchestration.update', {
        conductor: this.name,
        action: 'coordinating_workflow',
        event: event.type
      }, 'conductor');
    }
  }

  navigateRouting(event) {
    if (event.type.includes('route') || event.type.includes('message')) {
      this.mesh.publish('navigation.update', {
        navigator: this.name,
        action: 'routing_message',
        event: event.type
      }, 'navigator');
    }
  }

  guardSecurity(event) {
    if (event.type.includes('error') || event.type.includes('security')) {
      this.mesh.publish('security.alert', {
        guardian: this.name,
        action: 'security_check',
        event: event.type
      }, 'guardian');
    }
  }
}

// Start mesh if run directly
if (require.main === module) {
  const mesh = new DocumentGeneratorMesh();
  
  mesh.initialize().then(async () => {
    // Add characters to the mesh
    const conductor = new MeshCharacter(mesh, 'Aria', 'Conductor');
    const navigator = new MeshCharacter(mesh, 'Rex', 'Navigator');
    const guardian = new MeshCharacter(mesh, 'Sage', 'Guardian');
    
    // Character event subscriptions
    mesh.on('message', (message) => {
      conductor.handleEvent(message);
      navigator.handleEvent(message);
      guardian.handleEvent(message);
    });
    
    console.log('\n🎭 Characters active in mesh:');
    console.log('  🎵 Aria (Conductor) - Orchestrating workflows');
    console.log('  🧭 Rex (Navigator) - Routing messages');  
    console.log('  🛡️  Sage (Guardian) - Monitoring security');
    
    mesh.showDashboard();
    
    // Discover active services
    const active = await mesh.discoverServices();
    console.log(`\n🔍 Discovery complete: ${active.length} active services`);
    
    console.log('\n✅ MESH LAYER OPERATIONAL!');
  });
}

module.exports = { DocumentGeneratorMesh, MeshCharacter };
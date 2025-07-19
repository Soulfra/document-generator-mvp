#!/usr/bin/env node

/**
 * ECONOMY BUS - Message bus connecting all three economies
 * Schema-driven communication between Product, Business, and Truth economies
 */

const EventEmitter = require('events');
const fs = require('fs');

console.log('🚌 ECONOMY BUS - CONNECTING ALL ECONOMIES');
console.log('=========================================');

class EconomyBus extends EventEmitter {
  constructor() {
    super();
    
    // Message schema
    this.schema = {
      economies: ['product', 'business', 'truth'],
      message_types: ['command', 'event', 'query', 'response', 'conflict', 'resolution'],
      priorities: ['low', 'medium', 'high', 'critical'],
      statuses: ['pending', 'processing', 'completed', 'failed', 'conflicted']
    };
    
    // Economy states
    this.economies = {
      product: { status: 'disconnected', last_seen: null, message_count: 0 },
      business: { status: 'disconnected', last_seen: null, message_count: 0 },
      truth: { status: 'disconnected', last_seen: null, message_count: 0 }
    };
    
    // Message queue
    this.messageQueue = [];
    this.messageHistory = [];
    
    // Bus routes
    this.routes = new Map();
    this.setupDefaultRoutes();
    
    console.log('🚌 Economy bus initialized');
  }

  setupDefaultRoutes() {
    // Product -> Business routes
    this.addRoute('product', 'business', 'user_signup', (msg) => {
      return { type: 'legal_event', data: { new_user_contract: msg.data.email } };
    });
    
    this.addRoute('product', 'business', 'revenue_increase', (msg) => {
      return { type: 'financial_event', data: { revenue: msg.data.amount } };
    });
    
    // Business -> Product routes
    this.addRoute('business', 'product', 'compliance_change', (msg) => {
      return { type: 'feature_toggle', data: { feature: 'privacy_mode', enabled: msg.data.impact > 0 } };
    });
    
    // Truth -> All routes
    this.addRoute('truth', '*', 'conflict_resolution', (msg) => {
      return { type: 'system_directive', data: { resolution: msg.data.decision } };
    });
    
    // All -> Truth routes (conflicts)
    this.addRoute('*', 'truth', 'execution_failure', (msg) => {
      return { type: 'conflict', data: { source: msg.from, error: msg.data } };
    });
  }

  addRoute(from, to, messageType, transformer) {
    const routeKey = `${from}->${to}:${messageType}`;
    this.routes.set(routeKey, transformer);
    console.log(`🛣️ Route added: ${routeKey}`);
  }

  connectEconomy(economyName, economyInstance) {
    if (!this.schema.economies.includes(economyName)) {
      throw new Error(`Unknown economy: ${economyName}`);
    }
    
    this.economies[economyName].status = 'connected';
    this.economies[economyName].last_seen = Date.now();
    this.economies[economyName].instance = economyInstance;
    
    console.log(`🔌 ${economyName} economy connected to bus`);
    
    // Set up economy event forwarding
    if (economyInstance && economyInstance.on) {
      economyInstance.on('*', (event, data) => {
        this.sendMessage(economyName, 'broadcast', 'event', event, data);
      });
    }
    
    this.emit('economy_connected', { economy: economyName, timestamp: Date.now() });
  }

  sendMessage(from, to, type, event, data, priority = 'medium') {
    const message = {
      id: this.generateMessageId(),
      from,
      to,
      type,
      event,
      data,
      priority,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Validate message
    if (!this.validateMessage(message)) {
      console.error('❌ Invalid message:', message);
      return null;
    }
    
    // Add to queue
    this.messageQueue.push(message);
    this.messageHistory.push({ ...message });
    
    console.log(`📨 Message queued: ${from} -> ${to} | ${event}`);
    
    // Process immediately
    this.processMessage(message);
    
    return message.id;
  }

  validateMessage(message) {
    return (
      this.schema.economies.includes(message.from) &&
      (this.schema.economies.includes(message.to) || message.to === 'broadcast' || message.to === '*') &&
      this.schema.message_types.includes(message.type) &&
      this.schema.priorities.includes(message.priority)
    );
  }

  processMessage(message) {
    message.status = 'processing';
    
    try {
      // Check for routes
      const routeKey = `${message.from}->${message.to}:${message.event}`;
      const wildcardRouteKey = `${message.from}->*:${message.event}`;
      const toTruthRouteKey = `*->truth:${message.event}`;
      
      const transformer = this.routes.get(routeKey) || 
                         this.routes.get(wildcardRouteKey) || 
                         this.routes.get(toTruthRouteKey);
      
      if (transformer) {
        const transformedMessage = transformer(message);
        console.log(`🔄 Message transformed via route: ${routeKey}`);
        
        if (transformedMessage) {
          this.forwardTransformedMessage(message.to, transformedMessage);
        }
      }
      
      // Direct delivery
      this.deliverMessage(message);
      
      message.status = 'completed';
      
    } catch (error) {
      console.error(`❌ Message processing failed: ${error.message}`);
      message.status = 'failed';
      message.error = error.message;
      
      // Send to Truth economy for conflict resolution
      this.sendMessage(message.from, 'truth', 'conflict', 'message_processing_failure', {
        original_message: message,
        error: error.message
      }, 'high');
    }
  }

  deliverMessage(message) {
    const targetEconomy = this.economies[message.to];
    
    if (message.to === 'broadcast' || message.to === '*') {
      // Broadcast to all connected economies
      Object.keys(this.economies).forEach(economyName => {
        if (economyName !== message.from && this.economies[economyName].status === 'connected') {
          this.deliverToEconomy(economyName, message);
        }
      });
    } else if (targetEconomy && targetEconomy.status === 'connected') {
      this.deliverToEconomy(message.to, message);
    } else {
      console.warn(`⚠️ Target economy ${message.to} not connected`);
    }
  }

  deliverToEconomy(economyName, message) {
    const economy = this.economies[economyName];
    
    if (economy.instance && economy.instance.emit) {
      economy.instance.emit('bus_message', message);
      console.log(`✅ Message delivered to ${economyName} economy`);
    }
    
    economy.message_count++;
    economy.last_seen = Date.now();
  }

  forwardTransformedMessage(to, transformedMessage) {
    this.sendMessage('bus', to, transformedMessage.type, 'transformed_message', transformedMessage.data);
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Bus management
  getBusStatus() {
    return {
      connected_economies: Object.keys(this.economies).filter(e => this.economies[e].status === 'connected'),
      message_queue_length: this.messageQueue.length,
      total_messages: this.messageHistory.length,
      routes_count: this.routes.size,
      uptime: Date.now() - this.startTime
    };
  }

  getMessageHistory(count = 10) {
    return this.messageHistory.slice(-count);
  }

  clearMessageQueue() {
    this.messageQueue = [];
    console.log('🧹 Message queue cleared');
  }

  // Schema management
  addMessageType(type) {
    if (!this.schema.message_types.includes(type)) {
      this.schema.message_types.push(type);
      console.log(`📋 New message type: ${type}`);
    }
  }

  // Test methods
  async testBus() {
    console.log('\n🧪 TESTING ECONOMY BUS');
    console.log('======================');
    
    // Test message sending
    const msgId1 = this.sendMessage('product', 'business', 'event', 'user_signup', { email: 'test@example.com' });
    const msgId2 = this.sendMessage('business', 'product', 'command', 'feature_toggle', { feature: 'premium' });
    const msgId3 = this.sendMessage('truth', 'broadcast', 'resolution', 'conflict_resolved', { decision: 'proceed' });
    
    console.log(`✅ Test messages sent: ${msgId1}, ${msgId2}, ${msgId3}`);
    
    // Test status
    console.log('\n📊 Bus Status:');
    console.log(JSON.stringify(this.getBusStatus(), null, 2));
    
    // Test message history
    console.log('\n📋 Recent Messages:');
    this.getMessageHistory(5).forEach(msg => {
      console.log(`  ${msg.from} -> ${msg.to} | ${msg.event} | ${msg.status}`);
    });
    
    return true;
  }

  startBus() {
    this.startTime = Date.now();
    
    // Start message processing loop
    setInterval(() => {
      this.processQueuedMessages();
    }, 1000);
    
    // Start health check
    setInterval(() => {
      this.healthCheck();
    }, 5000);
    
    console.log('🚌 Economy bus started');
  }

  processQueuedMessages() {
    const pending = this.messageQueue.filter(msg => msg.status === 'pending');
    pending.forEach(msg => {
      if (Date.now() - msg.timestamp > 5000) { // 5 second timeout
        msg.status = 'failed';
        msg.error = 'timeout';
      }
    });
  }

  healthCheck() {
    Object.keys(this.economies).forEach(economyName => {
      const economy = this.economies[economyName];
      if (economy.status === 'connected' && Date.now() - economy.last_seen > 30000) {
        economy.status = 'disconnected';
        console.warn(`⚠️ ${economyName} economy disconnected (timeout)`);
      }
    });
  }
}

// Create and export bus
const economyBus = new EconomyBus();

// Test if running directly
if (require.main === module) {
  async function main() {
    console.log('🚌 Starting Economy Bus...');
    
    economyBus.startBus();
    
    // Run tests
    await economyBus.testBus();
    
    console.log('\n✅ Economy Bus operational!');
    
    // Keep running
    console.log('🚌 Bus running... (Ctrl+C to stop)');
  }
  
  main().catch(console.error);
}

module.exports = EconomyBus;
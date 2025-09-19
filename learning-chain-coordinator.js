#!/usr/bin/env node

/**
 * LEARNING CHAIN COORDINATOR
 * Port 9800 - The "Daisychain" Learning System
 * 
 * Coordinates learning between all systems and amplifies successful patterns
 * If something is working well, it gets more resources and training
 * If something isn't working, it gets reinforcement learning
 */

const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class LearningChainCoordinator extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.wss = null;
    this.port = 9800;
    
    // Learning chain components
    this.chain = new Map();
    this.learningHistory = new Map();
    this.patternDatabase = new Map();
    this.reinforcementQueue = [];
    this.successThreshold = 0.75;
    this.failureThreshold = 0.4;
    
    // Connected systems
    this.connectedSystems = new Map([
      ['carrot-system', { url: 'http://localhost:9900/api/status', role: 'reinforcement', health: 0 }],
      ['ai-factory', { url: 'http://localhost:4567/api/status', role: 'generation', health: 0 }],
      ['main-api', { url: 'http://localhost:3009/api/system/status', role: 'coordination', health: 0 }],
      ['dashboard', { url: 'http://localhost:8081/api/system/status', role: 'monitoring', health: 0 }]
    ]);
    
    this.setupExpress();
    this.startLearningChain();
  }

  setupExpress() {
    this.app.use(express.json());
    this.app.use(express.static(__dirname));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'learning-chain-coordinator',
        port: this.port,
        connectedSystems: this.connectedSystems.size,
        activeChains: this.chain.size,
        timestamp: new Date().toISOString()
      });
    });

    // Status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        system: 'learning-chain-coordinator',
        connectedSystems: Object.fromEntries(this.connectedSystems),
        chains: Object.fromEntries(this.chain),
        patterns: Object.fromEntries(this.patternDatabase),
        reinforcementQueue: this.reinforcementQueue.length,
        metrics: {
          totalSystems: this.connectedSystems.size,
          healthySystems: this.getHealthySystems(),
          avgPerformance: this.getAveragePerformance(),
          learningRate: this.calculateLearningRate()
        }
      });
    });

    // Chain status endpoint
    this.app.get('/api/chains', (req, res) => {
      res.json({
        success: true,
        activeChains: Array.from(this.chain.entries()).map(([id, chain]) => ({
          id,
          systems: chain.systems,
          performance: chain.performance,
          status: chain.status,
          lastUpdate: chain.lastUpdate
        }))
      });
    });

    // Create new learning chain
    this.app.post('/api/chains/create', (req, res) => {
      const { systems, objective, priority = 'medium' } = req.body;
      
      if (!systems || !objective) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: systems, objective'
        });
      }
      
      const chainId = this.createLearningChain(systems, objective, priority);
      
      res.json({
        success: true,
        chainId,
        message: 'Learning chain created successfully'
      });
    });

    // Reinforce system endpoint
    this.app.post('/api/reinforce/:system', (req, res) => {
      const system = req.params.system;
      const { strategy = 'positive', intensity = 1, reason = 'manual reinforcement' } = req.body;
      
      if (this.connectedSystems.has(system)) {
        this.scheduleReinforcement(system, strategy, intensity, reason);
        res.json({
          success: true,
          message: `Reinforcement scheduled for ${system}`,
          strategy,
          intensity
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'System not found'
        });
      }
    });

    // Learning patterns endpoint
    this.app.get('/api/patterns', (req, res) => {
      res.json({
        success: true,
        patterns: Object.fromEntries(this.patternDatabase),
        insights: this.generateInsights(),
        recommendations: this.generateRecommendations()
      });
    });

    // Dashboard view
    this.app.get('/dashboard', (req, res) => {
      res.send(this.generateDashboardHTML());
    });
  }

  async startLearningChain() {
    console.log('🔗 Starting Learning Chain Coordinator...');
    
    // Monitor all connected systems every 3 seconds
    setInterval(() => {
      this.monitorAllSystems();
    }, 3000);
    
    // Analyze patterns every 15 seconds
    setInterval(() => {
      this.analyzePatterns();
    }, 15000);
    
    // Process reinforcement queue every 10 seconds
    setInterval(() => {
      this.processReinforcementQueue();
    }, 10000);
    
    // Update learning chains every 20 seconds
    setInterval(() => {
      this.updateLearningChains();
    }, 20000);
    
    console.log('🎯 Learning chain coordination started');
  }

  async monitorAllSystems() {
    for (const [systemName, system] of this.connectedSystems) {
      try {
        const startTime = Date.now();
        const response = await axios.get(system.url, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        const health = this.calculateSystemHealth(systemName, response, responseTime);
        system.health = health;
        
        // Record in learning history
        this.recordLearningEvent(systemName, {
          type: 'health_check',
          health,
          responseTime,
          timestamp: Date.now()
        });
        
        // Check if reinforcement is needed
        if (health < this.failureThreshold) {
          this.scheduleReinforcement(systemName, 'corrective', 2, `Low health: ${health.toFixed(2)}`);
        } else if (health > this.successThreshold) {
          this.scheduleReinforcement(systemName, 'positive', 1, `High performance: ${health.toFixed(2)}`);
        }
        
      } catch (error) {
        console.warn(`🚨 System ${systemName} monitoring failed:`, error.message);
        system.health = 0;
        this.scheduleReinforcement(systemName, 'recovery', 3, `System unreachable: ${error.message}`);
      }
    }
  }

  calculateSystemHealth(systemName, response, responseTime) {
    let health = 0;
    
    // Base health from response
    if (response.status === 200) health += 0.4;
    
    // Response time factor
    const responseTimeFactor = Math.max(0, 1 - (responseTime / 5000));
    health += responseTimeFactor * 0.3;
    
    // System-specific metrics
    const data = response.data;
    
    if (systemName === 'carrot-system' && data.metrics) {
      // Carrot system: health based on total carrots and performance
      const carrotFactor = Math.min(1, (data.metrics.totalCarrots || 0) / 20);
      const performanceFactor = data.metrics.avgPerformance || 0;
      health += (carrotFactor + performanceFactor) * 0.15;
    }
    
    if (systemName === 'ai-factory' && data.agents) {
      // AI factory: health based on agent readiness
      const readyAgents = Object.values(data.agents).filter(a => a.status === 'ready').length;
      const agentFactor = readyAgents / Object.keys(data.agents).length;
      health += agentFactor * 0.3;
    }
    
    if (systemName === 'main-api' && data.success) {
      // Main API: base health for being responsive
      health += 0.3;
    }
    
    return Math.min(1, health);
  }

  recordLearningEvent(systemName, event) {
    if (!this.learningHistory.has(systemName)) {
      this.learningHistory.set(systemName, []);
    }
    
    const history = this.learningHistory.get(systemName);
    history.push(event);
    
    // Keep only last 100 events
    if (history.length > 100) {
      history.shift();
    }
    
    this.emit('learning-event', { system: systemName, event });
  }

  scheduleReinforcement(systemName, strategy, intensity, reason) {
    const reinforcement = {
      system: systemName,
      strategy,
      intensity,
      reason,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    this.reinforcementQueue.push(reinforcement);
    console.log(`🎯 Scheduled ${strategy} reinforcement for ${systemName}: ${reason}`);
    
    this.emit('reinforcement-scheduled', reinforcement);
  }

  async processReinforcementQueue() {
    if (this.reinforcementQueue.length === 0) return;
    
    const reinforcement = this.reinforcementQueue.shift();
    
    try {
      await this.executeReinforcement(reinforcement);
      reinforcement.status = 'completed';
      console.log(`✅ Reinforcement completed for ${reinforcement.system}`);
    } catch (error) {
      console.error(`❌ Reinforcement failed for ${reinforcement.system}:`, error.message);
      reinforcement.status = 'failed';
      
      // Reschedule with lower intensity
      if (reinforcement.intensity > 1) {
        this.scheduleReinforcement(
          reinforcement.system,
          reinforcement.strategy,
          reinforcement.intensity - 1,
          `Retry: ${reinforcement.reason}`
        );
      }
    }
    
    this.emit('reinforcement-processed', reinforcement);
  }

  async executeReinforcement(reinforcement) {
    const { system, strategy, intensity, reason } = reinforcement;
    
    switch (strategy) {
      case 'positive':
        // Give carrots through carrot system
        if (system !== 'carrot-system') {
          await axios.post('http://localhost:9900/api/reward/' + system, {
            amount: intensity,
            reason: `Chain reinforcement: ${reason}`
          });
        }
        break;
        
      case 'corrective':
        // Increase monitoring frequency and adjust parameters
        console.log(`🔧 Applying corrective measures to ${system} (intensity: ${intensity})`);
        // Could implement specific corrective actions per system
        break;
        
      case 'recovery':
        // Attempt to restart or reconnect
        console.log(`🚑 Recovery procedures initiated for ${system} (intensity: ${intensity})`);
        // Could implement restart procedures
        break;
    }
  }

  analyzePatterns() {
    console.log('🧠 Analyzing learning patterns...');
    
    for (const [systemName, history] of this.learningHistory) {
      if (history.length < 10) continue;
      
      const recentEvents = history.slice(-20);
      const patterns = this.identifySystemPatterns(systemName, recentEvents);
      
      this.patternDatabase.set(systemName, {
        patterns,
        confidence: this.calculatePatternConfidence(patterns),
        lastAnalysis: Date.now(),
        eventCount: recentEvents.length
      });
    }
    
    // Cross-system pattern analysis
    this.analyzeSystemInteractions();
    
    this.emit('patterns-analyzed', { patterns: Object.fromEntries(this.patternDatabase) });
  }

  identifySystemPatterns(systemName, events) {
    const patterns = {};
    
    // Health trend analysis
    const healthEvents = events.filter(e => e.type === 'health_check');
    if (healthEvents.length > 5) {
      const healthTrend = this.calculateTrend(healthEvents.map(e => e.health));
      patterns.healthTrend = healthTrend;
      
      // Performance consistency
      const healthValues = healthEvents.map(e => e.health);
      const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
      const variance = healthValues.reduce((sum, h) => sum + Math.pow(h - avgHealth, 2), 0) / healthValues.length;
      patterns.consistency = 1 - Math.sqrt(variance); // Lower variance = higher consistency
    }
    
    // Response time patterns
    const responseTimes = healthEvents.map(e => e.responseTime).filter(t => t);
    if (responseTimes.length > 5) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      patterns.avgResponseTime = avgResponseTime;
      patterns.responseTimeStability = this.calculateStability(responseTimes);
    }
    
    // Peak performance hours
    const hourlyPerformance = {};
    healthEvents.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      if (!hourlyPerformance[hour]) hourlyPerformance[hour] = [];
      hourlyPerformance[hour].push(e.health);
    });
    
    const peakHours = Object.entries(hourlyPerformance)
      .map(([hour, healths]) => ({
        hour: parseInt(hour),
        avgHealth: healths.reduce((a, b) => a + b, 0) / healths.length
      }))
      .filter(h => h.avgHealth > 0.7)
      .map(h => h.hour);
    
    patterns.peakHours = peakHours;
    
    return patterns;
  }

  analyzeSystemInteractions() {
    console.log('🔗 Analyzing system interactions...');
    
    // Find correlations between system performances
    const systemPerformances = new Map();
    
    for (const [systemName, history] of this.learningHistory) {
      const recentHealth = history
        .filter(e => e.type === 'health_check')
        .slice(-10)
        .map(e => ({ timestamp: e.timestamp, health: e.health }));
      
      systemPerformances.set(systemName, recentHealth);
    }
    
    // Calculate cross-correlations
    const interactions = {};
    const systemNames = Array.from(systemPerformances.keys());
    
    for (let i = 0; i < systemNames.length; i++) {
      for (let j = i + 1; j < systemNames.length; j++) {
        const system1 = systemNames[i];
        const system2 = systemNames[j];
        
        const correlation = this.calculateCorrelation(
          systemPerformances.get(system1),
          systemPerformances.get(system2)
        );
        
        if (Math.abs(correlation) > 0.5) {
          interactions[`${system1}-${system2}`] = {
            correlation,
            type: correlation > 0 ? 'positive' : 'negative',
            strength: Math.abs(correlation)
          };
        }
      }
    }
    
    this.patternDatabase.set('system-interactions', {
      interactions,
      lastAnalysis: Date.now()
    });
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  calculateStability(values) {
    if (values.length < 2) return 1;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const coefficient = Math.sqrt(variance) / mean;
    
    return Math.max(0, 1 - coefficient);
  }

  calculateCorrelation(data1, data2) {
    if (data1.length !== data2.length || data1.length < 2) return 0;
    
    const n = data1.length;
    const sum1 = data1.reduce((sum, d) => sum + d.health, 0);
    const sum2 = data2.reduce((sum, d) => sum + d.health, 0);
    const sum1Sq = data1.reduce((sum, d) => sum + d.health * d.health, 0);
    const sum2Sq = data2.reduce((sum, d) => sum + d.health * d.health, 0);
    const pSum = data1.reduce((sum, d, i) => sum + d.health * data2[i].health, 0);
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return den === 0 ? 0 : num / den;
  }

  calculatePatternConfidence(patterns) {
    let confidence = 0;
    
    if (patterns.healthTrend !== undefined) {
      confidence += Math.abs(patterns.healthTrend) > 0.1 ? 0.3 : 0.1;
    }
    
    if (patterns.consistency !== undefined) {
      confidence += patterns.consistency > 0.7 ? 0.3 : 0.1;
    }
    
    if (patterns.peakHours && patterns.peakHours.length > 0) {
      confidence += 0.2;
    }
    
    if (patterns.responseTimeStability !== undefined) {
      confidence += patterns.responseTimeStability > 0.7 ? 0.2 : 0.1;
    }
    
    return Math.min(1, confidence);
  }

  createLearningChain(systems, objective, priority) {
    const chainId = `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const chain = {
      id: chainId,
      systems,
      objective,
      priority,
      performance: new Map(),
      status: 'active',
      created: Date.now(),
      lastUpdate: Date.now()
    };
    
    this.chain.set(chainId, chain);
    console.log(`🔗 Created learning chain ${chainId} for systems: ${systems.join(', ')}`);
    
    return chainId;
  }

  updateLearningChains() {
    for (const [chainId, chain] of this.chain) {
      // Calculate chain performance
      let totalPerformance = 0;
      let validSystems = 0;
      
      for (const systemName of chain.systems) {
        const system = this.connectedSystems.get(systemName);
        if (system && system.health > 0) {
          totalPerformance += system.health;
          validSystems++;
        }
      }
      
      if (validSystems > 0) {
        const chainPerformance = totalPerformance / validSystems;
        chain.performance.set(Date.now(), chainPerformance);
        
        // Adjust chain priority based on performance
        if (chainPerformance > 0.8) {
          chain.priority = 'high';
        } else if (chainPerformance < 0.5) {
          chain.priority = 'critical';
        }
        
        chain.lastUpdate = Date.now();
        
        console.log(`🔗 Chain ${chainId} performance: ${(chainPerformance * 100).toFixed(1)}%`);
      }
    }
  }

  getHealthySystems() {
    return Array.from(this.connectedSystems.values()).filter(s => s.health > 0.7).length;
  }

  getAveragePerformance() {
    const systems = Array.from(this.connectedSystems.values());
    if (systems.length === 0) return 0;
    
    const totalHealth = systems.reduce((sum, s) => sum + s.health, 0);
    return totalHealth / systems.length;
  }

  calculateLearningRate() {
    const recentPatterns = Array.from(this.patternDatabase.values())
      .filter(p => Date.now() - p.lastAnalysis < 60000); // Last minute
    
    if (recentPatterns.length === 0) return 0;
    
    const avgConfidence = recentPatterns.reduce((sum, p) => sum + p.confidence, 0) / recentPatterns.length;
    return avgConfidence;
  }

  generateInsights() {
    const insights = [];
    
    // System health insights
    const unhealthySystems = Array.from(this.connectedSystems.entries())
      .filter(([_, system]) => system.health < 0.5)
      .map(([name, _]) => name);
    
    if (unhealthySystems.length > 0) {
      insights.push({
        type: 'warning',
        message: `Systems need attention: ${unhealthySystems.join(', ')}`,
        systems: unhealthySystems
      });
    }
    
    // Pattern insights
    const highConfidencePatterns = Array.from(this.patternDatabase.entries())
      .filter(([_, pattern]) => pattern.confidence > 0.7);
    
    if (highConfidencePatterns.length > 0) {
      insights.push({
        type: 'success',
        message: `Strong patterns detected in ${highConfidencePatterns.length} systems`,
        patterns: highConfidencePatterns.map(([name, _]) => name)
      });
    }
    
    // Interaction insights
    const interactions = this.patternDatabase.get('system-interactions');
    if (interactions && Object.keys(interactions.interactions).length > 0) {
      const strongInteractions = Object.entries(interactions.interactions)
        .filter(([_, interaction]) => interaction.strength > 0.7);
      
      if (strongInteractions.length > 0) {
        insights.push({
          type: 'info',
          message: `Strong system correlations detected: ${strongInteractions.map(([pair, _]) => pair).join(', ')}`,
          correlations: strongInteractions
        });
      }
    }
    
    return insights;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // System-specific recommendations
    for (const [systemName, system] of this.connectedSystems) {
      const patterns = this.patternDatabase.get(systemName);
      
      if (system.health < 0.5) {
        recommendations.push({
          system: systemName,
          type: 'critical',
          action: 'Immediate attention required',
          reason: `Health at ${(system.health * 100).toFixed(1)}%`
        });
      }
      
      if (patterns && patterns.patterns.healthTrend < -0.1) {
        recommendations.push({
          system: systemName,
          type: 'warning',
          action: 'Monitor declining performance',
          reason: 'Negative health trend detected'
        });
      }
      
      if (patterns && patterns.patterns.consistency < 0.5) {
        recommendations.push({
          system: systemName,
          type: 'optimization',
          action: 'Improve stability',
          reason: 'Performance inconsistency detected'
        });
      }
    }
    
    return recommendations;
  }

  generateDashboardHTML() {
    const insights = this.generateInsights();
    const recommendations = this.generateRecommendations();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🔗 Learning Chain Coordinator Dashboard</title>
    <style>
        body { font-family: monospace; background: #000; color: #00ff00; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #001100; border: 1px solid #00ff00; padding: 15px; border-radius: 5px; }
        .metric-title { color: #ffff00; font-weight: bold; margin-bottom: 10px; }
        .metric-value { font-size: 20px; color: #00ff00; }
        .systems { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .system { background: #001100; border: 1px solid #00ff00; padding: 15px; border-radius: 5px; }
        .system-name { color: #ffff00; font-weight: bold; margin-bottom: 10px; }
        .health-bar { background: #330000; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .health-fill { height: 100%; transition: width 0.3s ease; }
        .insights { margin-top: 20px; }
        .insight { background: #001100; border-left: 4px solid; padding: 10px; margin: 10px 0; }
        .insight.success { border-color: #00ff00; }
        .insight.warning { border-color: #ffff00; }
        .insight.info { border-color: #00ffff; }
        .auto-refresh { position: fixed; top: 10px; right: 10px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Learning Chain Coordinator</h1>
            <p>Daisychain Learning & Reinforcement System</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-title">Connected Systems 🖥️</div>
                <div class="metric-value">${this.connectedSystems.size}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Healthy Systems ✅</div>
                <div class="metric-value">${this.getHealthySystems()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Average Performance 📊</div>
                <div class="metric-value">${(this.getAveragePerformance() * 100).toFixed(1)}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Learning Rate 🧠</div>
                <div class="metric-value">${(this.calculateLearningRate() * 100).toFixed(1)}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Active Chains 🔗</div>
                <div class="metric-value">${this.chain.size}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Reinforcement Queue ⚡</div>
                <div class="metric-value">${this.reinforcementQueue.length}</div>
            </div>
        </div>
        
        <div class="systems">
            ${Array.from(this.connectedSystems.entries()).map(([name, system]) => {
              const healthColor = system.health > 0.7 ? '#00ff00' : system.health > 0.4 ? '#ffff00' : '#ff0000';
              return `
                <div class="system">
                    <div class="system-name">${name}</div>
                    <div>Role: ${system.role}</div>
                    <div>Health: ${(system.health * 100).toFixed(1)}%</div>
                    <div class="health-bar">
                        <div class="health-fill" style="width: ${system.health * 100}%; background-color: ${healthColor};"></div>
                    </div>
                    <div>URL: ${system.url}</div>
                </div>
              `;
            }).join('')}
        </div>
        
        <div class="insights">
            <h2>🔍 System Insights</h2>
            ${insights.map(insight => `
                <div class="insight ${insight.type}">
                    <strong>${insight.type.toUpperCase()}:</strong> ${insight.message}
                </div>
            `).join('')}
            
            <h2>💡 Recommendations</h2>
            ${recommendations.map(rec => `
                <div class="insight ${rec.type}">
                    <strong>${rec.system}:</strong> ${rec.action} - ${rec.reason}
                </div>
            `).join('')}
        </div>
        
        <div class="auto-refresh">Auto-refreshing every 15 seconds</div>
    </div>
    
    <script>
        setInterval(() => {
            location.reload();
        }, 15000);
    </script>
</body>
</html>
    `;
  }

  async start() {
    const server = this.app.listen(this.port, () => {
      console.log(`🔗 Learning Chain Coordinator started on http://localhost:${this.port}`);
      console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
      console.log(`🔌 API: http://localhost:${this.port}/api/status`);
      console.log('🎯 Now coordinating learning across all systems...');
    });

    // Setup WebSocket for real-time updates
    this.wss = new WebSocket.Server({ server });
    this.wss.on('connection', (ws) => {
      console.log('🔗 Dashboard connected via WebSocket');
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'initial-state',
        data: {
          systems: Object.fromEntries(this.connectedSystems),
          chains: Object.fromEntries(this.chain),
          patterns: Object.fromEntries(this.patternDatabase)
        }
      }));
      
      // Forward events to connected clients
      const forwardEvent = (eventName) => {
        this.on(eventName, (data) => {
          ws.send(JSON.stringify({ type: eventName, data }));
        });
      };
      
      forwardEvent('learning-event');
      forwardEvent('reinforcement-scheduled');
      forwardEvent('reinforcement-processed');
      forwardEvent('patterns-analyzed');
    });

    return server;
  }
}

// Start the system if run directly
if (require.main === module) {
  const coordinator = new LearningChainCoordinator();
  coordinator.start().catch(console.error);
}

module.exports = LearningChainCoordinator;
/**
 * Human Conductor Interface
 * 
 * Provides a comprehensive interface for humans to conduct and orchestrate
 * sovereign AI agents, including approval workflows, monitoring, and control.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class HumanConductorInterface extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.conductorId = options.conductorId || 'human_conductor';
    this.database = options.database; // SovereignOrchestrationDatabase instance
    this.agents = new Map(); // Map of agentId -> SovereignAgent
    
    this.isInitialized = false;
    this.monitoringInterval = null;
    
    // Conductor preferences
    this.preferences = {
      autoApproveThreshold: 0.9, // Auto-approve if confidence > 90%
      requireApprovalForRiskyActions: true,
      maxConcurrentAgents: 10,
      defaultAutonomyLevel: 5,
      notificationLevel: 'important' // all, important, critical
    };
    
    // Performance metrics
    this.metrics = {
      totalApprovals: 0,
      totalRejections: 0,
      averageResponseTime: 0,
      agentsManaged: 0,
      tasksCompleted: 0
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log(`🎭 Initializing Human Conductor Interface for ${this.conductorId}`);
    
    try {
      // Start monitoring loop
      this.startMonitoringLoop();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log(`✅ Human Conductor Interface initialized`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Human Conductor Interface:', error);
      throw error;
    }
  }

  startMonitoringLoop() {
    // Monitor agent status every 10 seconds
    this.monitoringInterval = setInterval(() => {
      this.monitorAgents();
    }, 10000);
  }

  setupEventListeners() {
    // Listen for approval requests from agents
    this.on('approvalNeeded', (data) => {
      this.handleApprovalRequest(data);
    });
    
    // Listen for agent status changes
    this.on('agentStatusChange', (data) => {
      this.handleAgentStatusChange(data);
    });
  }

  async monitorAgents() {
    try {
      // Check for pending approvals
      const pendingApprovals = await this.database.getPendingApprovals(this.conductorId);
      
      if (pendingApprovals.length > 0) {
        this.emit('pendingApprovalsUpdate', {
          count: pendingApprovals.length,
          approvals: pendingApprovals
        });
      }
      
      // Check agent health
      for (const [agentId, agent] of this.agents) {
        const status = await agent.getStatus();
        
        if (status.status === 'error') {
          this.emit('agentError', {
            agentId,
            agentName: agent.name,
            status
          });
        }
      }
      
    } catch (error) {
      console.error('Error in conductor monitoring loop:', error);
    }
  }

  // Agent Management
  async createAgent(agentConfig) {
    const SovereignAgent = require('./SovereignAgent');
    
    const agent = new SovereignAgent({
      ...agentConfig,
      database: this.database,
      aiServiceManager: this.aiServiceManager
    });
    
    await agent.initialize();
    
    // Set up agent event listeners
    this.setupAgentEventListeners(agent);
    
    this.agents.set(agent.id, agent);
    this.metrics.agentsManaged++;
    
    console.log(`🤖 Conductor created agent: ${agent.name} (${agent.id})`);
    
    this.emit('agentCreated', {
      agentId: agent.id,
      agentName: agent.name,
      conductorId: this.conductorId
    });
    
    return agent;
  }

  setupAgentEventListeners(agent) {
    agent.on('approvalNeeded', (data) => {
      this.emit('approvalNeeded', data);
    });
    
    agent.on('statusUpdate', (data) => {
      this.emit('agentStatusChange', data);
    });
    
    agent.on('emotionalStateUpdate', (data) => {
      this.emit('agentEmotionalStateUpdate', data);
    });
    
    agent.on('taskCompleted', (data) => {
      this.metrics.tasksCompleted++;
      this.emit('taskCompleted', data);
    });
    
    agent.on('processError', (data) => {
      this.emit('agentError', data);
    });
  }

  async forkAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    await agent.forkProcess();
    
    console.log(`🔄 Conductor forked agent: ${agent.name}`);
    
    this.emit('agentForked', {
      agentId,
      agentName: agent.name,
      processId: agent.processId
    });
    
    return agent;
  }

  async sendTaskToAgent(agentId, taskDescription, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const taskId = await agent.sendTask(taskDescription, context);
    
    console.log(`📝 Conductor sent task to ${agent.name}: ${taskDescription}`);
    
    this.emit('taskSent', {
      agentId,
      taskId,
      taskDescription,
      conductorId: this.conductorId
    });
    
    return taskId;
  }

  // Approval Management
  async approveAction(sessionId, reasoning = null) {
    const startTime = Date.now();
    
    try {
      // Get the reasoning session
      const session = await this.database.getReasoningSession(sessionId);
      if (!session) {
        throw new Error(`Reasoning session ${sessionId} not found`);
      }
      
      // Get the agent
      const agent = this.agents.get(session.agent_id);
      if (!agent) {
        throw new Error(`Agent ${session.agent_id} not found`);
      }
      
      // Approve the action
      await agent.approveAction(sessionId, this.conductorId, reasoning);
      
      // Update metrics
      this.metrics.totalApprovals++;
      this.updateAverageResponseTime(startTime);
      
      console.log(`✅ Conductor approved action for ${agent.name}: ${session.decision_made}`);
      
      this.emit('actionApproved', {
        sessionId,
        agentId: session.agent_id,
        agentName: agent.name,
        approvedBy: this.conductorId,
        reasoning
      });
      
      return { success: true, sessionId };
      
    } catch (error) {
      console.error('Error approving action:', error);
      throw error;
    }
  }

  async rejectAction(sessionId, reasoning = null) {
    const startTime = Date.now();
    
    try {
      // Get the reasoning session
      const session = await this.database.getReasoningSession(sessionId);
      if (!session) {
        throw new Error(`Reasoning session ${sessionId} not found`);
      }
      
      // Get the agent
      const agent = this.agents.get(session.agent_id);
      if (!agent) {
        throw new Error(`Agent ${session.agent_id} not found`);
      }
      
      // Reject the action
      await agent.rejectAction(sessionId, this.conductorId, reasoning);
      
      // Update metrics
      this.metrics.totalRejections++;
      this.updateAverageResponseTime(startTime);
      
      console.log(`❌ Conductor rejected action for ${agent.name}: ${session.decision_made}`);
      
      this.emit('actionRejected', {
        sessionId,
        agentId: session.agent_id,
        agentName: agent.name,
        rejectedBy: this.conductorId,
        reasoning
      });
      
      return { success: true, sessionId };
      
    } catch (error) {
      console.error('Error rejecting action:', error);
      throw error;
    }
  }

  async batchApproveActions(sessionIds, reasoning = null) {
    const results = [];
    
    for (const sessionId of sessionIds) {
      try {
        const result = await this.approveAction(sessionId, reasoning);
        results.push({ sessionId, success: true });
      } catch (error) {
        results.push({ sessionId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Agent Control
  async pauseAgent(agentId, reasoning = null) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    await agent.pauseAgent(this.conductorId, reasoning);
    
    console.log(`⏸️ Conductor paused agent: ${agent.name}`);
    
    this.emit('agentPaused', {
      agentId,
      agentName: agent.name,
      pausedBy: this.conductorId,
      reasoning
    });
    
    return { success: true };
  }

  async resumeAgent(agentId, reasoning = null) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    await agent.resumeAgent(this.conductorId, reasoning);
    
    console.log(`▶️ Conductor resumed agent: ${agent.name}`);
    
    this.emit('agentResumed', {
      agentId,
      agentName: agent.name,
      resumedBy: this.conductorId,
      reasoning
    });
    
    return { success: true };
  }

  async terminateAgent(agentId, reasoning = null) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    await agent.terminateAgent(this.conductorId, reasoning);
    
    // Remove from our tracking
    this.agents.delete(agentId);
    
    console.log(`🛑 Conductor terminated agent: ${agent.name}`);
    
    this.emit('agentTerminated', {
      agentId,
      agentName: agent.name,
      terminatedBy: this.conductorId,
      reasoning
    });
    
    return { success: true };
  }

  // Monitoring and Status
  async getAgentStatus(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    return agent.getStatus();
  }

  async getAllAgentStatuses() {
    const statuses = {};
    
    for (const [agentId, agent] of this.agents) {
      statuses[agentId] = await agent.getStatus();
    }
    
    return statuses;
  }

  async getPendingApprovals() {
    return this.database.getPendingApprovals(this.conductorId);
  }

  async getAgentMemory(agentId, memoryType = null) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    return agent.getMemory(memoryType);
  }

  async getAgentReasoningSessions(agentId, limit = 50) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    return agent.getReasoningSessions(limit);
  }

  // Dashboard Data
  async getDashboardData() {
    const agentStatuses = await this.getAllAgentStatuses();
    const pendingApprovals = await this.getPendingApprovals();
    
    const summary = {
      totalAgents: this.agents.size,
      activeAgents: Object.values(agentStatuses).filter(s => s.status === 'running').length,
      pausedAgents: Object.values(agentStatuses).filter(s => s.status === 'paused').length,
      errorAgents: Object.values(agentStatuses).filter(s => s.status === 'error').length,
      pendingApprovals: pendingApprovals.length,
      urgentApprovals: pendingApprovals.filter(a => a.confidence_level < 0.5).length
    };
    
    return {
      summary,
      agentStatuses,
      pendingApprovals,
      metrics: this.metrics,
      preferences: this.preferences
    };
  }

  // Auto-approval Logic
  async processAutoApprovals() {
    const pendingApprovals = await this.getPendingApprovals();
    
    for (const approval of pendingApprovals) {
      if (this.shouldAutoApprove(approval)) {
        await this.approveAction(approval.id, 'Auto-approved based on confidence threshold');
      }
    }
  }

  shouldAutoApprove(approval) {
    // Check if auto-approval is enabled
    if (!this.preferences.autoApproveThreshold) return false;
    
    // Check confidence level
    if (approval.confidence_level < this.preferences.autoApproveThreshold) return false;
    
    // Don't auto-approve risky actions
    if (this.preferences.requireApprovalForRiskyActions && this.isRiskyAction(approval)) {
      return false;
    }
    
    return true;
  }

  isRiskyAction(approval) {
    const riskKeywords = [
      'delete', 'remove', 'destroy', 'terminate', 'kill',
      'production', 'live', 'critical', 'important',
      'permanent', 'irreversible', 'database', 'system'
    ];
    
    const text = (approval.decision_made || '').toLowerCase();
    return riskKeywords.some(keyword => text.includes(keyword));
  }

  // Utility Methods
  updateAverageResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    const totalResponses = this.metrics.totalApprovals + this.metrics.totalRejections;
    
    this.metrics.averageResponseTime = (
      (this.metrics.averageResponseTime * (totalResponses - 1)) + responseTime
    ) / totalResponses;
  }

  async handleApprovalRequest(data) {
    console.log(`🔔 Approval request from ${data.agentId}: ${data.approvalRequest}`);
    
    // Check if should auto-approve
    if (this.shouldAutoApprove(data)) {
      await this.approveAction(data.sessionId, 'Auto-approved');
    } else {
      // Emit for UI notification
      this.emit('approvalRequestReceived', data);
    }
  }

  async handleAgentStatusChange(data) {
    console.log(`📊 Agent status change: ${data.id} -> ${data.status}`);
    
    // Handle critical status changes
    if (data.status === 'error') {
      this.emit('criticalAgentError', data);
    }
  }

  async shutdown() {
    console.log(`🛑 Shutting down Human Conductor Interface`);
    
    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Terminate all agents
    for (const [agentId, agent] of this.agents) {
      try {
        await agent.terminateAgent(this.conductorId, 'Conductor shutdown');
      } catch (error) {
        console.error(`Error terminating agent ${agentId}:`, error);
      }
    }
    
    this.agents.clear();
    this.isInitialized = false;
  }

  // Configuration
  async updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    
    console.log(`⚙️ Conductor preferences updated:`, newPreferences);
    
    this.emit('preferencesUpdated', this.preferences);
  }

  async getMetrics() {
    return {
      ...this.metrics,
      currentTime: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  // Quick Actions
  async pauseAllAgents(reasoning = 'Emergency pause by conductor') {
    const results = [];
    
    for (const [agentId, agent] of this.agents) {
      try {
        await this.pauseAgent(agentId, reasoning);
        results.push({ agentId, success: true });
      } catch (error) {
        results.push({ agentId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  async resumeAllAgents(reasoning = 'Resume all agents') {
    const results = [];
    
    for (const [agentId, agent] of this.agents) {
      try {
        if (agent.status === 'paused') {
          await this.resumeAgent(agentId, reasoning);
          results.push({ agentId, success: true });
        }
      } catch (error) {
        results.push({ agentId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  async emergencyStop(reasoning = 'Emergency stop by conductor') {
    console.log(`🚨 EMERGENCY STOP activated by conductor: ${reasoning}`);
    
    // Terminate all agents immediately
    for (const [agentId, agent] of this.agents) {
      try {
        await agent.terminateAgent(this.conductorId, reasoning);
      } catch (error) {
        console.error(`Error in emergency stop for agent ${agentId}:`, error);
      }
    }
    
    this.emit('emergencyStop', {
      conductorId: this.conductorId,
      reasoning,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = HumanConductorInterface;
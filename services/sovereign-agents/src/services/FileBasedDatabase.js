/**
 * File-Based Database
 * 
 * A simple file-based database implementation as fallback for better-sqlite3
 * Provides the same interface as SovereignOrchestrationDatabase but uses JSON files
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class FileBasedDatabase extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      dataDir: options.dataDir || path.join(process.cwd(), 'data'),
      backupInterval: options.backupInterval || 1800000, // 30 minutes
      ...options
    };
    
    this.isInitialized = false;
    this.backupTimer = null;
    this.data = {
      agents: new Map(),
      reasoningSessions: new Map(),
      memory: new Map(),
      conductorActions: new Map(),
      gitOperations: new Map(),
      processMonitoring: new Map(),
      orchestrationSessions: new Map(),
      communications: new Map()
    };
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🗄️ Initializing File-Based Database...');
    
    try {
      // Ensure data directory exists
      await fs.mkdir(this.options.dataDir, { recursive: true });
      
      // Load existing data
      await this.loadData();
      
      // Setup backup schedule
      this.setupBackupSchedule();
      
      this.isInitialized = true;
      console.log('✅ File-Based Database initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize file-based database:', error);
      throw error;
    }
  }
  
  async loadData() {
    const dataFiles = [
      'agents.json',
      'reasoning-sessions.json',
      'memory.json',
      'conductor-actions.json',
      'git-operations.json',
      'process-monitoring.json',
      'orchestration-sessions.json',
      'communications.json'
    ];
    
    const dataKeys = [
      'agents',
      'reasoningSessions',
      'memory',
      'conductorActions',
      'gitOperations',
      'processMonitoring',
      'orchestrationSessions',
      'communications'
    ];
    
    for (let i = 0; i < dataFiles.length; i++) {
      const file = path.join(this.options.dataDir, dataFiles[i]);
      const key = dataKeys[i];
      
      try {
        const data = await fs.readFile(file, 'utf8');
        const parsed = JSON.parse(data);
        
        // Convert arrays back to Maps
        this.data[key] = new Map(parsed);
        
      } catch (error) {
        // File doesn't exist or is corrupted, start with empty Map
        this.data[key] = new Map();
      }
    }
  }
  
  async saveData() {
    const dataFiles = [
      'agents.json',
      'reasoning-sessions.json',
      'memory.json',
      'conductor-actions.json',
      'git-operations.json',
      'process-monitoring.json',
      'orchestration-sessions.json',
      'communications.json'
    ];
    
    const dataKeys = [
      'agents',
      'reasoningSessions',
      'memory',
      'conductorActions',
      'gitOperations',
      'processMonitoring',
      'orchestrationSessions',
      'communications'
    ];
    
    for (let i = 0; i < dataFiles.length; i++) {
      const file = path.join(this.options.dataDir, dataFiles[i]);
      const key = dataKeys[i];
      
      try {
        // Convert Map to array for JSON serialization
        const data = Array.from(this.data[key].entries());
        await fs.writeFile(file, JSON.stringify(data, null, 2));
        
      } catch (error) {
        console.error(`Error saving ${dataFiles[i]}:`, error);
      }
    }
  }
  
  // Sovereign Agent Management
  async createSovereignAgent(agentData) {
    const agent = {
      ...agentData,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      total_sessions: 0,
      successful_tasks: 0,
      failed_tasks: 0,
      process_status: 'initialized'
    };
    
    this.data.agents.set(agentData.id, agent);
    await this.saveData();
    
    this.emit('sovereignAgentCreated', { id: agentData.id, name: agentData.name });
    return { success: true };
  }
  
  async updateSovereignAgent(agentId, updates) {
    const agent = this.data.agents.get(agentId);
    if (agent) {
      Object.assign(agent, updates);
      agent.last_active = new Date().toISOString();
      
      this.data.agents.set(agentId, agent);
      await this.saveData();
      
      this.emit('sovereignAgentUpdated', { id: agentId, updates });
    }
    
    return { success: true };
  }
  
  async getSovereignAgent(agentId) {
    const agent = this.data.agents.get(agentId);
    if (agent) {
      // Ensure JSON fields are parsed
      return {
        ...agent,
        personality: typeof agent.personality === 'string' ? JSON.parse(agent.personality) : agent.personality,
        capabilities: typeof agent.capabilities === 'string' ? JSON.parse(agent.capabilities) : agent.capabilities,
        memory_context: agent.memoryContext || {},
        long_term_memory: agent.longTermMemory || {},
        emotional_state: typeof agent.emotionalState === 'string' ? JSON.parse(agent.emotionalState) : agent.emotionalState,
        autonomy_level: agent.autonomyLevel || 5,
        human_approval_required: agent.humanApprovalRequired !== false
      };
    }
    return null;
  }
  
  async getAllSovereignAgents() {
    const agents = Array.from(this.data.agents.values());
    
    // Parse JSON fields for all agents
    return agents.map(agent => ({
      ...agent,
      personality: typeof agent.personality === 'string' ? JSON.parse(agent.personality) : agent.personality,
      capabilities: typeof agent.capabilities === 'string' ? JSON.parse(agent.capabilities) : agent.capabilities,
      memory_context: agent.memoryContext || {},
      long_term_memory: agent.longTermMemory || {},
      emotional_state: typeof agent.emotionalState === 'string' ? JSON.parse(agent.emotionalState) : agent.emotionalState
    }));
  }
  
  // Reasoning Session Management
  async createReasoningSession(sessionData) {
    const session = {
      ...sessionData,
      id: sessionData.id || crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    
    this.data.reasoningSessions.set(session.id, session);
    await this.saveData();
    
    this.emit('reasoningSessionCreated', { id: session.id, agentId: session.agentId });
    return { success: true };
  }
  
  async getReasoningSession(sessionId) {
    const session = this.data.reasoningSessions.get(sessionId);
    if (session) {
      return {
        ...session,
        input_context: typeof session.inputContext === 'string' ? JSON.parse(session.inputContext) : session.inputContext,
        thought_process: typeof session.thoughtProcess === 'string' ? JSON.parse(session.thoughtProcess) : session.thoughtProcess,
        outcome: typeof session.outcome === 'string' ? JSON.parse(session.outcome) : session.outcome,
        learning_extracted: typeof session.learningExtracted === 'string' ? JSON.parse(session.learningExtracted) : session.learningExtracted
      };
    }
    return null;
  }
  
  async getAgentReasoningSessions(agentId, limit = 50) {
    const sessions = Array.from(this.data.reasoningSessions.values())
      .filter(s => s.agentId === agentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
    
    return sessions.map(session => ({
      ...session,
      input_context: typeof session.inputContext === 'string' ? JSON.parse(session.inputContext) : session.inputContext,
      thought_process: typeof session.thoughtProcess === 'string' ? JSON.parse(session.thoughtProcess) : session.thoughtProcess,
      outcome: typeof session.outcome === 'string' ? JSON.parse(session.outcome) : session.outcome,
      learning_extracted: typeof session.learningExtracted === 'string' ? JSON.parse(session.learningExtracted) : session.learningExtracted
    }));
  }
  
  // Agent Memory Management
  async storeAgentMemory(memoryData) {
    const memory = {
      ...memoryData,
      id: memoryData.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      access_count: 0
    };
    
    this.data.memory.set(memory.id, memory);
    await this.saveData();
    
    this.emit('memoryStored', { agentId: memoryData.agentId, memoryType: memoryData.memoryType });
    return { success: true };
  }
  
  async getAgentMemory(agentId, memoryType = null, limit = 100) {
    const memories = Array.from(this.data.memory.values())
      .filter(m => m.agentId === agentId && (memoryType ? m.memoryType === memoryType : true))
      .sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0))
      .slice(0, limit);
    
    // Update access count
    memories.forEach(memory => {
      memory.access_count = (memory.access_count || 0) + 1;
      memory.last_accessed = new Date().toISOString();
      this.data.memory.set(memory.id, memory);
    });
    
    // Save updated access counts
    await this.saveData();
    
    return memories.map(memory => ({
      ...memory,
      memory_content: typeof memory.memoryContent === 'string' ? JSON.parse(memory.memoryContent) : memory.memoryContent
    }));
  }
  
  // Conductor Actions
  async recordConductorAction(actionData) {
    const action = {
      ...actionData,
      id: actionData.id || crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    
    this.data.conductorActions.set(action.id, action);
    await this.saveData();
    
    this.emit('conductorActionRecorded', { conductorId: actionData.conductorId, actionType: actionData.actionType });
    return { success: true };
  }
  
  async getPendingApprovals(conductorId = null) {
    const approvals = Array.from(this.data.reasoningSessions.values())
      .filter(s => s.humanApprovalNeeded && !s.approvedBy)
      .map(s => ({
        ...s,
        agent_name: this.data.agents.get(s.agentId)?.name || 'Unknown Agent'
      }));
    
    return approvals;
  }
  
  // Git Operations
  async recordGitOperation(operationData) {
    const operation = {
      ...operationData,
      id: operationData.id || crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    
    this.data.gitOperations.set(operation.id, operation);
    await this.saveData();
    
    this.emit('gitOperationRecorded', { agentId: operationData.agentId, operationType: operationData.operationType });
    return { success: true };
  }
  
  // Database Maintenance
  setupBackupSchedule() {
    if (this.options.backupInterval > 0) {
      this.backupTimer = setInterval(() => {
        this.createBackup().catch(error => {
          console.error('❌ Database backup failed:', error);
        });
      }, this.options.backupInterval);
    }
  }
  
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.options.dataDir, `backup_${timestamp}`);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy all data files to backup directory
      const files = await fs.readdir(this.options.dataDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const srcPath = path.join(this.options.dataDir, file);
          const destPath = path.join(backupDir, file);
          await fs.copyFile(srcPath, destPath);
        }
      }
      
      console.log(`📦 Database backup created: ${backupDir}`);
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
    }
  }
  
  async close() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    // Final save
    await this.saveData();
    
    console.log('📴 File-based database connection closed');
  }
  
  async getDebugInfo() {
    const agentCount = this.data.agents.size;
    const activeAgents = Array.from(this.data.agents.values())
      .filter(a => a.process_status === 'running').length;
    const pendingApprovals = Array.from(this.data.reasoningSessions.values())
      .filter(s => s.humanApprovalNeeded && !s.approvedBy).length;
    
    return {
      initialized: this.isInitialized,
      dataDir: this.options.dataDir,
      agentCount,
      activeAgents,
      pendingApprovals,
      tableInfo: {
        sovereign_agents: this.data.agents.size,
        reasoning_sessions: this.data.reasoningSessions.size,
        agent_memory: this.data.memory.size,
        conductor_actions: this.data.conductorActions.size,
        git_operations: this.data.gitOperations.size,
        process_monitoring: this.data.processMonitoring.size,
        orchestration_sessions: this.data.orchestrationSessions.size,
        communications: this.data.communications.size
      }
    };
  }
}

module.exports = FileBasedDatabase;
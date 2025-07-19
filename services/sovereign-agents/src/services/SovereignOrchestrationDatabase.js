/**
 * Sovereign Orchestration Database
 * 
 * Extended database with sovereign agent support, reasoning persistence,
 * memory tracking, and human conductor capabilities.
 */

const EventEmitter = require('events');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class SovereignOrchestrationDatabase extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      dbPath: options.dbPath || path.join(process.cwd(), 'data', 'sovereign_orchestration.db'),
      enableWAL: true,
      maxConnections: 10,
      backupInterval: 1800000, // 30 minutes
      ...options
    };
    
    this.db = null;
    this.isInitialized = false;
    this.backupTimer = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🧠 Initializing Sovereign Orchestration Database...');
    
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.options.dbPath);
      await fs.mkdir(dbDir, { recursive: true });
      
      // Initialize SQLite database
      this.db = new Database(this.options.dbPath);
      
      // Enable WAL mode for better performance
      if (this.options.enableWAL) {
        this.db.pragma('journal_mode = WAL');
      }
      
      // Create tables
      await this.createTables();
      
      // Setup backup schedule
      this.setupBackupSchedule();
      
      this.isInitialized = true;
      console.log('✅ Sovereign Orchestration Database initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize sovereign database:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      // Sovereign agents with persistent identities
      `CREATE TABLE IF NOT EXISTS sovereign_agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        personality TEXT, -- JSON: traits, preferences, decision-making patterns
        capabilities TEXT, -- JSON: skills, tools, permissions
        memory_context TEXT, -- JSON: working memory, recent contexts
        long_term_memory TEXT, -- JSON: persistent learnings, patterns
        emotional_state TEXT, -- JSON: current mood, energy, focus
        process_id INTEGER,
        process_status TEXT DEFAULT 'initialized', -- initialized, forked, running, paused, stopped
        autonomy_level INTEGER DEFAULT 5, -- 1-10 scale of autonomous decision-making
        human_approval_required BOOLEAN DEFAULT true,
        conductor_permissions TEXT, -- JSON: what the conductor can control
        git_workspace TEXT, -- Path to agent's git workspace
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_sessions INTEGER DEFAULT 0,
        successful_tasks INTEGER DEFAULT 0,
        failed_tasks INTEGER DEFAULT 0
      )`,
      
      // Agent reasoning sessions with thought processes
      `CREATE TABLE IF NOT EXISTS reasoning_sessions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        session_type TEXT NOT NULL, -- decision, problem_solving, creative, analysis
        input_context TEXT, -- JSON: what triggered this reasoning
        thought_process TEXT, -- JSON: step-by-step reasoning chain
        decision_made TEXT, -- The final decision or output
        confidence_level REAL, -- 0-1 confidence in the decision
        reasoning_time INTEGER, -- milliseconds spent reasoning
        human_approval_needed BOOLEAN DEFAULT false,
        approval_request TEXT, -- What approval is needed
        approved_by TEXT, -- Human conductor who approved
        approval_timestamp DATETIME,
        implemented BOOLEAN DEFAULT false,
        outcome TEXT, -- JSON: results after implementation
        learning_extracted TEXT, -- JSON: what was learned from this session
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES sovereign_agents(id)
      )`,
      
      // Agent memory system for persistent context
      `CREATE TABLE IF NOT EXISTS agent_memory (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        memory_type TEXT NOT NULL, -- working, episodic, semantic, procedural
        memory_key TEXT NOT NULL, -- identifier for this memory
        memory_content TEXT, -- JSON: the actual memory content
        importance_score REAL DEFAULT 0.5, -- 0-1 how important this memory is
        access_count INTEGER DEFAULT 0,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME, -- for working memory cleanup
        FOREIGN KEY (agent_id) REFERENCES sovereign_agents(id)
      )`,
      
      // Git operations for version control tracking
      `CREATE TABLE IF NOT EXISTS git_operations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        operation_type TEXT NOT NULL, -- init, add, commit, push, pull, branch, merge
        repository_path TEXT NOT NULL,
        command_executed TEXT,
        git_output TEXT,
        success BOOLEAN,
        commit_hash TEXT,
        branch_name TEXT,
        human_approved BOOLEAN DEFAULT false,
        approved_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES sovereign_agents(id)
      )`,
      
      // Human conductor actions and approvals
      `CREATE TABLE IF NOT EXISTS conductor_actions (
        id TEXT PRIMARY KEY,
        conductor_id TEXT NOT NULL, -- human conductor identifier
        action_type TEXT NOT NULL, -- approve, reject, modify, pause, resume, terminate
        target_agent_id TEXT,
        target_session_id TEXT,
        action_context TEXT, -- JSON: what was being approved/rejected
        reasoning TEXT, -- why the conductor took this action
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (target_agent_id) REFERENCES sovereign_agents(id),
        FOREIGN KEY (target_session_id) REFERENCES reasoning_sessions(id)
      )`,
      
      // Agent communication and collaboration
      `CREATE TABLE IF NOT EXISTS agent_communications (
        id TEXT PRIMARY KEY,
        from_agent_id TEXT NOT NULL,
        to_agent_id TEXT,
        message_type TEXT NOT NULL, -- request, response, notification, collaboration
        message_content TEXT, -- JSON: the message content
        response_required BOOLEAN DEFAULT false,
        response_id TEXT, -- links to response message
        priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        FOREIGN KEY (from_agent_id) REFERENCES sovereign_agents(id),
        FOREIGN KEY (to_agent_id) REFERENCES sovereign_agents(id)
      )`,
      
      // Process monitoring and health
      `CREATE TABLE IF NOT EXISTS process_monitoring (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        process_id INTEGER,
        cpu_usage REAL,
        memory_usage REAL,
        status TEXT, -- running, idle, busy, error, dead
        health_score REAL, -- 0-1 health indicator
        error_count INTEGER DEFAULT 0,
        last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES sovereign_agents(id)
      )`,
      
      // Enhanced orchestration sessions
      `CREATE TABLE IF NOT EXISTS orchestration_sessions (
        id TEXT PRIMARY KEY,
        task_description TEXT NOT NULL,
        task_context TEXT, -- JSON
        conductor_id TEXT, -- human conductor managing this session
        primary_agent_id TEXT, -- main agent handling the task
        collaborating_agents TEXT, -- JSON array of other agents involved
        autonomy_level INTEGER DEFAULT 5, -- how autonomous this session is
        human_checkpoints TEXT, -- JSON: when human approval is needed
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        success BOOLEAN,
        error_count INTEGER DEFAULT 0,
        total_cost REAL DEFAULT 0,
        efficiency_score REAL,
        agents_used TEXT, -- JSON array
        conductor_interventions INTEGER DEFAULT 0,
        approval_delays INTEGER DEFAULT 0, -- milliseconds waiting for approvals
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (primary_agent_id) REFERENCES sovereign_agents(id)
      )`
    ];
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sovereign_agents_status ON sovereign_agents(process_status)',
      'CREATE INDEX IF NOT EXISTS idx_sovereign_agents_last_active ON sovereign_agents(last_active)',
      'CREATE INDEX IF NOT EXISTS idx_reasoning_sessions_agent_id ON reasoning_sessions(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_reasoning_sessions_approval ON reasoning_sessions(human_approval_needed)',
      'CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON agent_memory(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type)',
      'CREATE INDEX IF NOT EXISTS idx_agent_memory_importance ON agent_memory(importance_score)',
      'CREATE INDEX IF NOT EXISTS idx_git_operations_agent_id ON git_operations(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_git_operations_success ON git_operations(success)',
      'CREATE INDEX IF NOT EXISTS idx_conductor_actions_conductor_id ON conductor_actions(conductor_id)',
      'CREATE INDEX IF NOT EXISTS idx_conductor_actions_target_agent ON conductor_actions(target_agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_agent_communications_from_agent ON agent_communications(from_agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_agent_communications_to_agent ON agent_communications(to_agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_process_monitoring_agent_id ON process_monitoring(agent_id)',
      'CREATE INDEX IF NOT EXISTS idx_process_monitoring_status ON process_monitoring(status)',
      'CREATE INDEX IF NOT EXISTS idx_orchestration_sessions_conductor ON orchestration_sessions(conductor_id)',
      'CREATE INDEX IF NOT EXISTS idx_orchestration_sessions_primary_agent ON orchestration_sessions(primary_agent_id)'
    ];
    
    // Execute table creation
    for (const table of tables) {
      this.db.exec(table);
    }
    
    // Create indexes
    for (const index of indexes) {
      this.db.exec(index);
    }
    
    console.log('✅ Sovereign database tables and indexes created');
  }

  // Sovereign Agent Management
  async createSovereignAgent(agentData) {
    const stmt = this.db.prepare(`
      INSERT INTO sovereign_agents (
        id, name, personality, capabilities, memory_context, 
        long_term_memory, emotional_state, autonomy_level, 
        human_approval_required, conductor_permissions, git_workspace
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      agentData.id,
      agentData.name,
      JSON.stringify(agentData.personality || {}),
      JSON.stringify(agentData.capabilities || {}),
      JSON.stringify(agentData.memoryContext || {}),
      JSON.stringify(agentData.longTermMemory || {}),
      JSON.stringify(agentData.emotionalState || { mood: 'neutral', energy: 0.7, focus: 0.8 }),
      agentData.autonomyLevel || 5,
      agentData.humanApprovalRequired !== false,
      JSON.stringify(agentData.conductorPermissions || {}),
      agentData.gitWorkspace || null
    );
    
    this.emit('sovereignAgentCreated', { id: agentData.id, name: agentData.name });
    return result;
  }

  async updateSovereignAgent(agentId, updates) {
    const setClause = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (['personality', 'capabilities', 'memoryContext', 'longTermMemory', 'emotionalState', 'conductorPermissions'].includes(key)) {
        setClause.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
        values.push(JSON.stringify(value));
      } else {
        setClause.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
        values.push(value);
      }
    }
    
    values.push(agentId);
    
    const stmt = this.db.prepare(`
      UPDATE sovereign_agents 
      SET ${setClause.join(', ')}, last_active = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    
    this.emit('sovereignAgentUpdated', { id: agentId, updates });
    return result;
  }

  async getSovereignAgent(agentId) {
    const stmt = this.db.prepare('SELECT * FROM sovereign_agents WHERE id = ?');
    const agent = stmt.get(agentId);
    
    if (agent) {
      // Parse JSON fields
      if (agent.personality) agent.personality = JSON.parse(agent.personality);
      if (agent.capabilities) agent.capabilities = JSON.parse(agent.capabilities);
      if (agent.memory_context) agent.memory_context = JSON.parse(agent.memory_context);
      if (agent.long_term_memory) agent.long_term_memory = JSON.parse(agent.long_term_memory);
      if (agent.emotional_state) agent.emotional_state = JSON.parse(agent.emotional_state);
      if (agent.conductor_permissions) agent.conductor_permissions = JSON.parse(agent.conductor_permissions);
    }
    
    return agent;
  }

  async getAllSovereignAgents() {
    const stmt = this.db.prepare('SELECT * FROM sovereign_agents ORDER BY last_active DESC');
    const agents = stmt.all();
    
    // Parse JSON fields for all agents
    for (const agent of agents) {
      if (agent.personality) agent.personality = JSON.parse(agent.personality);
      if (agent.capabilities) agent.capabilities = JSON.parse(agent.capabilities);
      if (agent.memory_context) agent.memory_context = JSON.parse(agent.memory_context);
      if (agent.long_term_memory) agent.long_term_memory = JSON.parse(agent.long_term_memory);
      if (agent.emotional_state) agent.emotional_state = JSON.parse(agent.emotional_state);
      if (agent.conductor_permissions) agent.conductor_permissions = JSON.parse(agent.conductor_permissions);
    }
    
    return agents;
  }

  // Reasoning Session Management
  async createReasoningSession(sessionData) {
    const stmt = this.db.prepare(`
      INSERT INTO reasoning_sessions (
        id, agent_id, session_type, input_context, thought_process,
        decision_made, confidence_level, reasoning_time, human_approval_needed,
        approval_request
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      sessionData.id || crypto.randomUUID(),
      sessionData.agentId,
      sessionData.sessionType || 'decision',
      JSON.stringify(sessionData.inputContext || {}),
      JSON.stringify(sessionData.thoughtProcess || []),
      sessionData.decisionMade || null,
      sessionData.confidenceLevel || 0.5,
      sessionData.reasoningTime || null,
      sessionData.humanApprovalNeeded || false,
      sessionData.approvalRequest || null
    );
    
    this.emit('reasoningSessionCreated', { id: sessionData.id, agentId: sessionData.agentId });
    return result;
  }

  async getReasoningSession(sessionId) {
    const stmt = this.db.prepare('SELECT * FROM reasoning_sessions WHERE id = ?');
    const session = stmt.get(sessionId);
    
    if (session) {
      if (session.input_context) session.input_context = JSON.parse(session.input_context);
      if (session.thought_process) session.thought_process = JSON.parse(session.thought_process);
      if (session.outcome) session.outcome = JSON.parse(session.outcome);
      if (session.learning_extracted) session.learning_extracted = JSON.parse(session.learning_extracted);
    }
    
    return session;
  }

  async getAgentReasoningSessions(agentId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM reasoning_sessions 
      WHERE agent_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    const sessions = stmt.all(agentId, limit);
    
    // Parse JSON fields
    for (const session of sessions) {
      if (session.input_context) session.input_context = JSON.parse(session.input_context);
      if (session.thought_process) session.thought_process = JSON.parse(session.thought_process);
      if (session.outcome) session.outcome = JSON.parse(session.outcome);
      if (session.learning_extracted) session.learning_extracted = JSON.parse(session.learning_extracted);
    }
    
    return sessions;
  }

  // Agent Memory Management
  async storeAgentMemory(memoryData) {
    const stmt = this.db.prepare(`
      INSERT INTO agent_memory (
        id, agent_id, memory_type, memory_key, memory_content,
        importance_score, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      memoryData.id || crypto.randomUUID(),
      memoryData.agentId,
      memoryData.memoryType || 'working',
      memoryData.memoryKey,
      JSON.stringify(memoryData.memoryContent),
      memoryData.importanceScore || 0.5,
      memoryData.expiresAt || null
    );
    
    this.emit('memoryStored', { agentId: memoryData.agentId, memoryType: memoryData.memoryType });
    return result;
  }

  async getAgentMemory(agentId, memoryType = null, limit = 100) {
    let stmt;
    let params;
    
    if (memoryType) {
      stmt = this.db.prepare(`
        SELECT * FROM agent_memory 
        WHERE agent_id = ? AND memory_type = ?
        ORDER BY importance_score DESC, last_accessed DESC
        LIMIT ?
      `);
      params = [agentId, memoryType, limit];
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM agent_memory 
        WHERE agent_id = ?
        ORDER BY importance_score DESC, last_accessed DESC
        LIMIT ?
      `);
      params = [agentId, limit];
    }
    
    const memories = stmt.all(...params);
    
    // Parse JSON content and update access count
    for (const memory of memories) {
      if (memory.memory_content) memory.memory_content = JSON.parse(memory.memory_content);
      
      // Update access count
      this.db.prepare('UPDATE agent_memory SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?')
        .run(memory.id);
    }
    
    return memories;
  }

  // Git Operations Tracking
  async recordGitOperation(operationData) {
    const stmt = this.db.prepare(`
      INSERT INTO git_operations (
        id, agent_id, operation_type, repository_path, command_executed,
        git_output, success, commit_hash, branch_name, human_approved, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      operationData.id || crypto.randomUUID(),
      operationData.agentId,
      operationData.operationType,
      operationData.repositoryPath,
      operationData.commandExecuted || null,
      operationData.gitOutput || null,
      operationData.success,
      operationData.commitHash || null,
      operationData.branchName || null,
      operationData.humanApproved || false,
      operationData.approvedBy || null
    );
    
    this.emit('gitOperationRecorded', { agentId: operationData.agentId, operationType: operationData.operationType });
    return result;
  }

  // Conductor Actions
  async recordConductorAction(actionData) {
    const stmt = this.db.prepare(`
      INSERT INTO conductor_actions (
        id, conductor_id, action_type, target_agent_id, target_session_id,
        action_context, reasoning
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      actionData.id || crypto.randomUUID(),
      actionData.conductorId,
      actionData.actionType,
      actionData.targetAgentId || null,
      actionData.targetSessionId || null,
      JSON.stringify(actionData.actionContext || {}),
      actionData.reasoning || null
    );
    
    this.emit('conductorActionRecorded', { conductorId: actionData.conductorId, actionType: actionData.actionType });
    return result;
  }

  async getPendingApprovals(conductorId = null) {
    let stmt;
    let params;
    
    if (conductorId) {
      stmt = this.db.prepare(`
        SELECT rs.*, sa.name as agent_name
        FROM reasoning_sessions rs
        JOIN sovereign_agents sa ON rs.agent_id = sa.id
        WHERE rs.human_approval_needed = true 
        AND rs.approved_by IS NULL
        AND sa.conductor_permissions LIKE '%' || ? || '%'
        ORDER BY rs.created_at ASC
      `);
      params = [conductorId];
    } else {
      stmt = this.db.prepare(`
        SELECT rs.*, sa.name as agent_name
        FROM reasoning_sessions rs
        JOIN sovereign_agents sa ON rs.agent_id = sa.id
        WHERE rs.human_approval_needed = true 
        AND rs.approved_by IS NULL
        ORDER BY rs.created_at ASC
      `);
      params = [];
    }
    
    const approvals = stmt.all(...params);
    
    // Parse JSON fields
    for (const approval of approvals) {
      if (approval.input_context) approval.input_context = JSON.parse(approval.input_context);
      if (approval.thought_process) approval.thought_process = JSON.parse(approval.thought_process);
    }
    
    return approvals;
  }

  // Database Maintenance
  setupBackupSchedule() {
    if (this.options.backupInterval > 0) {
      this.backupTimer = setInterval(() => {
        this.createBackup().catch(error => {
          console.error('❌ Sovereign database backup failed:', error);
        });
      }, this.options.backupInterval);
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.options.dbPath.replace('.db', `_backup_${timestamp}.db`);
    
    try {
      await fs.copyFile(this.options.dbPath, backupPath);
      console.log(`📦 Sovereign database backup created: ${backupPath}`);
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
    }
  }

  async close() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    if (this.db) {
      this.db.close();
    }
    
    console.log('📴 Sovereign database connection closed');
  }

  async getDebugInfo() {
    const agentCount = this.db.prepare('SELECT COUNT(*) as count FROM sovereign_agents').get();
    const activeAgents = this.db.prepare('SELECT COUNT(*) as count FROM sovereign_agents WHERE process_status = "running"').get();
    const pendingApprovals = this.db.prepare('SELECT COUNT(*) as count FROM reasoning_sessions WHERE human_approval_needed = true AND approved_by IS NULL').get();
    
    return {
      initialized: this.isInitialized,
      dbPath: this.options.dbPath,
      agentCount: agentCount.count,
      activeAgents: activeAgents.count,
      pendingApprovals: pendingApprovals.count,
      tableInfo: this.getTableInfo()
    };
  }

  getTableInfo() {
    try {
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      
      const info = {};
      for (const table of tables) {
        const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        info[table.name] = count.count;
      }
      
      return info;
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = SovereignOrchestrationDatabase;
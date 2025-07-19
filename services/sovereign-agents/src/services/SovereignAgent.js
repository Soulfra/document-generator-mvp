/**
 * SovereignAgent - Autonomous AI agent with persistent identity and reasoning
 * 
 * Features:
 * - Persistent identity and memory stored in database
 * - Chain-of-thought reasoning with human approval gates
 * - Process forking for true autonomy
 * - Soul-like responsiveness with emotional state
 * - Git integration for version control
 * - Human conductor collaboration
 */

const EventEmitter = require('events');
const { fork } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

class SovereignAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.id = config.id || crypto.randomUUID();
    this.name = config.name || `Agent_${this.id.substring(0, 8)}`;
    this.database = config.database; // SovereignOrchestrationDatabase instance
    this.aiServiceManager = config.aiServiceManager; // AIServiceManager instance
    
    // Agent configuration
    this.personality = config.personality || {
      creativity: 0.7,
      cautiousness: 0.6,
      collaborativeness: 0.8,
      persistence: 0.7,
      curiosity: 0.8
    };
    
    this.capabilities = config.capabilities || {
      codeGeneration: true,
      fileOperations: true,
      gitOperations: true,
      reasoning: true,
      learning: true,
      collaboration: true
    };
    
    this.autonomyLevel = config.autonomyLevel || 5; // 1-10 scale
    this.humanApprovalRequired = config.humanApprovalRequired !== false;
    this.conductorPermissions = config.conductorPermissions || {};
    this.gitWorkspace = config.gitWorkspace || null;
    
    // Internal state
    this.isInitialized = false;
    this.processId = null;
    this.childProcess = null;
    this.status = 'initialized';
    
    // Memory and emotional state
    this.memoryContext = {};
    this.longTermMemory = {};
    this.emotionalState = {
      mood: 'neutral', // happy, sad, excited, frustrated, neutral, focused
      energy: 0.7,     // 0-1 energy level
      focus: 0.8,      // 0-1 focus level
      confidence: 0.6  // 0-1 confidence in abilities
    };
    
    // Reasoning engine
    this.reasoningEngine = new ReasoningEngine(this);
    
    // Git operations handler
    this.gitHandler = new GitHandler(this);
    
    // Performance metrics
    this.metrics = {
      totalSessions: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageReasoningTime: 0,
      humanApprovalRate: 0
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log(`🤖 Initializing Sovereign Agent: ${this.name} (${this.id})`);
    
    try {
      // Store agent in database
      await this.database.createSovereignAgent({
        id: this.id,
        name: this.name,
        personality: this.personality,
        capabilities: this.capabilities,
        memoryContext: this.memoryContext,
        longTermMemory: this.longTermMemory,
        emotionalState: this.emotionalState,
        autonomyLevel: this.autonomyLevel,
        humanApprovalRequired: this.humanApprovalRequired,
        conductorPermissions: this.conductorPermissions,
        gitWorkspace: this.gitWorkspace
      });
      
      // Initialize reasoning engine
      await this.reasoningEngine.initialize();
      
      // Initialize git handler if workspace is provided
      if (this.gitWorkspace) {
        await this.gitHandler.initialize();
      }
      
      this.isInitialized = true;
      this.status = 'ready';
      
      console.log(`✅ Sovereign Agent ${this.name} initialized successfully`);
      this.emit('initialized', { id: this.id, name: this.name });
      
    } catch (error) {
      console.error(`❌ Failed to initialize Sovereign Agent ${this.name}:`, error);
      throw error;
    }
  }

  async forkProcess() {
    if (this.childProcess) {
      console.log(`Agent ${this.name} already has a forked process`);
      return this.childProcess;
    }
    
    console.log(`🔄 Forking process for Sovereign Agent: ${this.name}`);
    
    try {
      // Create the child process
      this.childProcess = fork(path.join(__dirname, 'SovereignAgentWorker.js'), [], {
        silent: false,
        env: {
          ...process.env,
          AGENT_ID: this.id,
          AGENT_NAME: this.name,
          DATABASE_PATH: this.database.options.dbPath
        }
      });
      
      this.processId = this.childProcess.pid;
      
      // Set up IPC communication
      this.setupIPCCommunication();
      
      // Update database with process info
      await this.database.updateSovereignAgent(this.id, {
        processId: this.processId,
        processStatus: 'forked'
      });
      
      this.status = 'forked';
      
      console.log(`✅ Process forked for Agent ${this.name}, PID: ${this.processId}`);
      this.emit('processForked', { id: this.id, processId: this.processId });
      
      return this.childProcess;
      
    } catch (error) {
      console.error(`❌ Failed to fork process for Agent ${this.name}:`, error);
      throw error;
    }
  }

  setupIPCCommunication() {
    if (!this.childProcess) return;
    
    // Handle messages from child process
    this.childProcess.on('message', async (message) => {
      try {
        await this.handleChildMessage(message);
      } catch (error) {
        console.error(`Error handling child message from ${this.name}:`, error);
      }
    });
    
    // Handle child process exit
    this.childProcess.on('exit', (code) => {
      console.log(`Child process for Agent ${this.name} exited with code ${code}`);
      this.handleChildExit(code);
    });
    
    // Handle child process errors
    this.childProcess.on('error', (error) => {
      console.error(`Child process error for Agent ${this.name}:`, error);
      this.handleChildError(error);
    });
  }

  async handleChildMessage(message) {
    switch (message.type) {
      case 'reasoningRequest':
        await this.handleReasoningRequest(message);
        break;
      case 'approvalRequest':
        await this.handleApprovalRequest(message);
        break;
      case 'memoryUpdate':
        await this.handleMemoryUpdate(message);
        break;
      case 'gitOperation':
        await this.handleGitOperation(message);
        break;
      case 'statusUpdate':
        await this.handleStatusUpdate(message);
        break;
      case 'emotionalStateUpdate':
        await this.handleEmotionalStateUpdate(message);
        break;
      default:
        console.log(`Unknown message type from ${this.name}:`, message.type);
    }
  }

  async handleReasoningRequest(message) {
    const result = await this.reasoningEngine.processRequest(message.data);
    
    if (this.childProcess) {
      this.childProcess.send({
        type: 'reasoningResponse',
        requestId: message.requestId,
        result
      });
    }
  }

  async handleApprovalRequest(message) {
    const { sessionId, approvalRequest, confidenceLevel } = message.data;
    
    // Store reasoning session for approval
    await this.database.createReasoningSession({
      id: sessionId,
      agentId: this.id,
      sessionType: 'approval',
      inputContext: message.data.inputContext,
      thoughtProcess: message.data.thoughtProcess,
      decisionMade: message.data.decisionMade,
      confidenceLevel,
      humanApprovalNeeded: true,
      approvalRequest
    });
    
    // Emit approval needed event
    this.emit('approvalNeeded', {
      agentId: this.id,
      sessionId,
      approvalRequest,
      confidenceLevel
    });
  }

  async handleMemoryUpdate(message) {
    const { memoryType, memoryKey, memoryContent, importanceScore } = message.data;
    
    await this.database.storeAgentMemory({
      agentId: this.id,
      memoryType,
      memoryKey,
      memoryContent,
      importanceScore
    });
    
    // Update local memory context
    if (memoryType === 'working') {
      this.memoryContext[memoryKey] = memoryContent;
    } else if (memoryType === 'semantic') {
      this.longTermMemory[memoryKey] = memoryContent;
    }
    
    // Update agent in database
    await this.database.updateSovereignAgent(this.id, {
      memoryContext: this.memoryContext,
      longTermMemory: this.longTermMemory
    });
  }

  async handleGitOperation(message) {
    const result = await this.gitHandler.handleOperation(message.data);
    
    if (this.childProcess) {
      this.childProcess.send({
        type: 'gitOperationResponse',
        requestId: message.requestId,
        result
      });
    }
  }

  async handleStatusUpdate(message) {
    this.status = message.data.status;
    
    await this.database.updateSovereignAgent(this.id, {
      processStatus: this.status
    });
    
    this.emit('statusUpdate', { id: this.id, status: this.status });
  }

  async handleEmotionalStateUpdate(message) {
    this.emotionalState = { ...this.emotionalState, ...message.data };
    
    await this.database.updateSovereignAgent(this.id, {
      emotionalState: this.emotionalState
    });
    
    this.emit('emotionalStateUpdate', { id: this.id, emotionalState: this.emotionalState });
  }

  async handleChildExit(code) {
    this.status = 'stopped';
    this.processId = null;
    this.childProcess = null;
    
    await this.database.updateSovereignAgent(this.id, {
      processStatus: 'stopped',
      processId: null
    });
    
    this.emit('processStopped', { id: this.id, exitCode: code });
  }

  async handleChildError(error) {
    console.error(`Child process error for Agent ${this.name}:`, error);
    
    this.status = 'error';
    await this.database.updateSovereignAgent(this.id, {
      processStatus: 'error'
    });
    
    this.emit('processError', { id: this.id, error: error.message });
  }

  // Public methods for conductor interaction
  async sendTask(taskDescription, context = {}) {
    if (!this.childProcess) {
      throw new Error(`Agent ${this.name} process not forked`);
    }
    
    const taskId = crypto.randomUUID();
    
    this.childProcess.send({
      type: 'task',
      taskId,
      data: {
        description: taskDescription,
        context,
        autonomyLevel: this.autonomyLevel,
        humanApprovalRequired: this.humanApprovalRequired
      }
    });
    
    return taskId;
  }

  async approveAction(sessionId, approvedBy, reasoning = null) {
    // Update reasoning session
    await this.database.db.prepare(`
      UPDATE reasoning_sessions 
      SET approved_by = ?, approval_timestamp = CURRENT_TIMESTAMP, implemented = true
      WHERE id = ?
    `).run(approvedBy, sessionId);
    
    // Record conductor action
    await this.database.recordConductorAction({
      conductorId: approvedBy,
      actionType: 'approve',
      targetAgentId: this.id,
      targetSessionId: sessionId,
      reasoning
    });
    
    // Notify child process
    if (this.childProcess) {
      this.childProcess.send({
        type: 'approvalResponse',
        sessionId,
        approved: true,
        approvedBy,
        reasoning
      });
    }
    
    this.emit('actionApproved', { sessionId, approvedBy });
  }

  async rejectAction(sessionId, rejectedBy, reasoning = null) {
    // Update reasoning session
    await this.database.db.prepare(`
      UPDATE reasoning_sessions 
      SET approved_by = ?, approval_timestamp = CURRENT_TIMESTAMP, implemented = false
      WHERE id = ?
    `).run(rejectedBy, sessionId);
    
    // Record conductor action
    await this.database.recordConductorAction({
      conductorId: rejectedBy,
      actionType: 'reject',
      targetAgentId: this.id,
      targetSessionId: sessionId,
      reasoning
    });
    
    // Notify child process
    if (this.childProcess) {
      this.childProcess.send({
        type: 'approvalResponse',
        sessionId,
        approved: false,
        rejectedBy,
        reasoning
      });
    }
    
    this.emit('actionRejected', { sessionId, rejectedBy });
  }

  async pauseAgent(pausedBy, reasoning = null) {
    this.status = 'paused';
    
    await this.database.updateSovereignAgent(this.id, {
      processStatus: 'paused'
    });
    
    await this.database.recordConductorAction({
      conductorId: pausedBy,
      actionType: 'pause',
      targetAgentId: this.id,
      reasoning
    });
    
    if (this.childProcess) {
      this.childProcess.send({
        type: 'pause',
        pausedBy,
        reasoning
      });
    }
    
    this.emit('agentPaused', { id: this.id, pausedBy });
  }

  async resumeAgent(resumedBy, reasoning = null) {
    this.status = 'running';
    
    await this.database.updateSovereignAgent(this.id, {
      processStatus: 'running'
    });
    
    await this.database.recordConductorAction({
      conductorId: resumedBy,
      actionType: 'resume',
      targetAgentId: this.id,
      reasoning
    });
    
    if (this.childProcess) {
      this.childProcess.send({
        type: 'resume',
        resumedBy,
        reasoning
      });
    }
    
    this.emit('agentResumed', { id: this.id, resumedBy });
  }

  async terminateAgent(terminatedBy, reasoning = null) {
    this.status = 'terminated';
    
    await this.database.updateSovereignAgent(this.id, {
      processStatus: 'terminated'
    });
    
    await this.database.recordConductorAction({
      conductorId: terminatedBy,
      actionType: 'terminate',
      targetAgentId: this.id,
      reasoning
    });
    
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
      this.processId = null;
    }
    
    this.emit('agentTerminated', { id: this.id, terminatedBy });
  }

  async getStatus() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      processId: this.processId,
      autonomyLevel: this.autonomyLevel,
      emotionalState: this.emotionalState,
      metrics: this.metrics,
      hasChildProcess: !!this.childProcess
    };
  }

  async getMemory(memoryType = null) {
    return this.database.getAgentMemory(this.id, memoryType);
  }

  async getReasoningSessions(limit = 50) {
    return this.database.getAgentReasoningSessions(this.id, limit);
  }
}

// Reasoning Engine for chain-of-thought processing
class ReasoningEngine {
  constructor(agent) {
    this.agent = agent;
    this.database = agent.database;
    this.aiServiceManager = agent.aiServiceManager;
  }

  async initialize() {
    console.log(`🧠 Initializing Reasoning Engine for Agent ${this.agent.name}`);
  }

  async processRequest(requestData) {
    const sessionId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // Create reasoning session
      const session = {
        id: sessionId,
        agentId: this.agent.id,
        sessionType: requestData.type || 'decision',
        inputContext: requestData.context || {},
        thoughtProcess: [],
        confidenceLevel: 0,
        humanApprovalNeeded: false
      };
      
      // Chain of thought reasoning
      const thoughtProcess = await this.performChainOfThought(requestData);
      session.thoughtProcess = thoughtProcess;
      
      // Make decision based on reasoning
      const decision = await this.makeDecision(thoughtProcess, requestData);
      session.decisionMade = decision.decision;
      session.confidenceLevel = decision.confidence;
      
      // Determine if human approval is needed
      session.humanApprovalNeeded = this.needsHumanApproval(decision, requestData);
      
      if (session.humanApprovalNeeded) {
        session.approvalRequest = this.generateApprovalRequest(decision, requestData);
      }
      
      // Calculate reasoning time
      const reasoningTime = Date.now() - startTime;
      session.reasoningTime = reasoningTime;
      
      // Store reasoning session
      await this.database.createReasoningSession(session);
      
      return {
        sessionId,
        decision: decision.decision,
        confidence: decision.confidence,
        needsApproval: session.humanApprovalNeeded,
        approvalRequest: session.approvalRequest,
        thoughtProcess: thoughtProcess,
        reasoningTime
      };
      
    } catch (error) {
      console.error(`Reasoning error for Agent ${this.agent.name}:`, error);
      throw error;
    }
  }

  async performChainOfThought(requestData) {
    const thoughts = [];
    
    // Step 1: Understand the request
    const understanding = await this.generateThought(
      `Understanding request: ${requestData.description || 'No description'}`,
      requestData
    );
    thoughts.push(understanding);
    
    // Step 2: Analyze constraints and context
    const analysis = await this.generateThought(
      `Analyzing constraints and context for this request`,
      { ...requestData, previousThought: understanding }
    );
    thoughts.push(analysis);
    
    // Step 3: Consider options
    const options = await this.generateThought(
      `Considering possible approaches and options`,
      { ...requestData, previousThoughts: thoughts }
    );
    thoughts.push(options);
    
    // Step 4: Evaluate risks and benefits
    const evaluation = await this.generateThought(
      `Evaluating risks and benefits of each option`,
      { ...requestData, previousThoughts: thoughts }
    );
    thoughts.push(evaluation);
    
    return thoughts;
  }

  async generateThought(prompt, context) {
    const fullPrompt = `
Agent: ${this.agent.name}
Personality: ${JSON.stringify(this.agent.personality)}
Emotional State: ${JSON.stringify(this.agent.emotionalState)}

Task: ${prompt}

Context: ${JSON.stringify(context)}

Provide a detailed thought process considering the agent's personality and emotional state.
    `;
    
    try {
      const result = await this.aiServiceManager.query(fullPrompt, {
        preferredService: 'deepseek',
        model: 'deepseek-chat',
        maxTokens: 500,
        temperature: 0.7
      });
      
      return {
        prompt,
        thought: result.text || result.response || 'No response',
        timestamp: new Date().toISOString(),
        confidence: 0.8
      };
      
    } catch (error) {
      console.error(`Error generating thought for Agent ${this.agent.name}:`, error);
      return {
        prompt,
        thought: 'Error generating thought',
        timestamp: new Date().toISOString(),
        confidence: 0.1,
        error: error.message
      };
    }
  }

  async makeDecision(thoughtProcess, requestData) {
    const decisionPrompt = `
Based on the following chain of thought, make a specific decision:

Thoughts:
${thoughtProcess.map((t, i) => `${i+1}. ${t.thought}`).join('\n')}

Request: ${requestData.description || 'No description'}

Provide a clear, actionable decision and rate your confidence (0-1).
    `;
    
    try {
      const result = await this.aiServiceManager.query(decisionPrompt, {
        preferredService: 'deepseek',
        model: 'deepseek-chat',
        maxTokens: 300,
        temperature: 0.5
      });
      
      return {
        decision: result.text || result.response || 'No decision made',
        confidence: 0.7,
        reasoning: 'Based on chain of thought analysis'
      };
      
    } catch (error) {
      console.error(`Error making decision for Agent ${this.agent.name}:`, error);
      return {
        decision: 'Error making decision',
        confidence: 0.1,
        reasoning: 'Error occurred during decision making'
      };
    }
  }

  needsHumanApproval(decision, requestData) {
    // Check if human approval is required based on agent settings
    if (this.agent.humanApprovalRequired) {
      return true;
    }
    
    // Check based on confidence level
    if (decision.confidence < 0.7) {
      return true;
    }
    
    // Check based on risk assessment
    const riskKeywords = ['delete', 'remove', 'terminate', 'destroy', 'critical', 'production'];
    const requestText = (requestData.description || '').toLowerCase();
    
    for (const keyword of riskKeywords) {
      if (requestText.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  }

  generateApprovalRequest(decision, requestData) {
    return {
      agentName: this.agent.name,
      requestSummary: requestData.description || 'No description',
      proposedAction: decision.decision,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      riskLevel: decision.confidence < 0.5 ? 'high' : decision.confidence < 0.7 ? 'medium' : 'low'
    };
  }
}

// Git Handler for version control operations
class GitHandler {
  constructor(agent) {
    this.agent = agent;
    this.database = agent.database;
    this.workspace = agent.gitWorkspace;
  }

  async initialize() {
    if (!this.workspace) return;
    
    console.log(`🔧 Initializing Git Handler for Agent ${this.agent.name}`);
    
    // Ensure workspace exists
    try {
      await fs.mkdir(this.workspace, { recursive: true });
    } catch (error) {
      console.error(`Error creating workspace for ${this.agent.name}:`, error);
    }
  }

  async handleOperation(operationData) {
    const { operation, ...params } = operationData;
    
    try {
      let result;
      
      switch (operation) {
        case 'init':
          result = await this.initRepository(params);
          break;
        case 'add':
          result = await this.addFiles(params);
          break;
        case 'commit':
          result = await this.commitChanges(params);
          break;
        case 'push':
          result = await this.pushChanges(params);
          break;
        case 'pull':
          result = await this.pullChanges(params);
          break;
        case 'status':
          result = await this.getStatus(params);
          break;
        default:
          throw new Error(`Unknown git operation: ${operation}`);
      }
      
      // Record operation in database
      await this.database.recordGitOperation({
        agentId: this.agent.id,
        operationType: operation,
        repositoryPath: this.workspace,
        commandExecuted: result.command,
        gitOutput: result.output,
        success: result.success,
        commitHash: result.commitHash,
        branchName: result.branchName
      });
      
      return result;
      
    } catch (error) {
      console.error(`Git operation error for Agent ${this.agent.name}:`, error);
      
      // Record failed operation
      await this.database.recordGitOperation({
        agentId: this.agent.id,
        operationType: operation,
        repositoryPath: this.workspace,
        commandExecuted: `git ${operation}`,
        gitOutput: error.message,
        success: false
      });
      
      throw error;
    }
  }

  async executeGitCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn('git', command.split(' ').slice(1), {
        cwd: this.workspace,
        capture: ['stdout', 'stderr']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: stdout, command });
        } else {
          reject(new Error(`Git command failed: ${stderr}`));
        }
      });
    });
  }

  async initRepository(params) {
    const result = await this.executeGitCommand('git init');
    return { ...result, branchName: 'main' };
  }

  async addFiles(params) {
    const files = params.files || '.';
    const result = await this.executeGitCommand(`git add ${files}`);
    return result;
  }

  async commitChanges(params) {
    const message = params.message || 'Automated commit by sovereign agent';
    const result = await this.executeGitCommand(`git commit -m "${message}"`);
    
    // Extract commit hash from output
    const commitHashMatch = result.output.match(/\[[\w-]+\s+([a-f0-9]+)\]/);
    const commitHash = commitHashMatch ? commitHashMatch[1] : null;
    
    return { ...result, commitHash };
  }

  async pushChanges(params) {
    const remote = params.remote || 'origin';
    const branch = params.branch || 'main';
    const result = await this.executeGitCommand(`git push ${remote} ${branch}`);
    return result;
  }

  async pullChanges(params) {
    const remote = params.remote || 'origin';
    const branch = params.branch || 'main';
    const result = await this.executeGitCommand(`git pull ${remote} ${branch}`);
    return result;
  }

  async getStatus(params) {
    const result = await this.executeGitCommand('git status --porcelain');
    return result;
  }
}

module.exports = SovereignAgent;
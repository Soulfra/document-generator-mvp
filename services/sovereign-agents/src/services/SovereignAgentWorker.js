/**
 * SovereignAgentWorker - Child process for autonomous agent execution
 * 
 * This runs in a forked child process, providing true autonomy while
 * maintaining communication with the parent process for coordination
 * and human approval gates.
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SovereignAgentWorker {
  constructor() {
    this.agentId = process.env.AGENT_ID;
    this.agentName = process.env.AGENT_NAME;
    this.databasePath = process.env.DATABASE_PATH;
    
    this.isRunning = false;
    this.isPaused = false;
    this.currentTask = null;
    this.pendingApprovals = new Map();
    
    // Initialize database connection
    this.initializeDatabase();
    
    // Set up IPC communication
    this.setupIPCCommunication();
    
    // Start the main loop
    this.startMainLoop();
  }

  async initializeDatabase() {
    const SovereignOrchestrationDatabase = require('./SovereignOrchestrationDatabase');
    this.database = new SovereignOrchestrationDatabase({
      dbPath: this.databasePath
    });
    
    await this.database.initialize();
    
    // Load agent data
    this.agentData = await this.database.getSovereignAgent(this.agentId);
    
    console.log(`🔄 Worker initialized for Agent ${this.agentName} (${this.agentId})`);
  }

  setupIPCCommunication() {
    // Handle messages from parent process
    process.on('message', async (message) => {
      try {
        await this.handleParentMessage(message);
      } catch (error) {
        console.error(`Error handling parent message in worker ${this.agentName}:`, error);
      }
    });
    
    // Handle process termination
    process.on('SIGTERM', () => {
      console.log(`Worker ${this.agentName} received SIGTERM, shutting down...`);
      this.shutdown();
    });
    
    process.on('SIGINT', () => {
      console.log(`Worker ${this.agentName} received SIGINT, shutting down...`);
      this.shutdown();
    });
  }

  async handleParentMessage(message) {
    switch (message.type) {
      case 'task':
        await this.handleNewTask(message);
        break;
      case 'approvalResponse':
        await this.handleApprovalResponse(message);
        break;
      case 'pause':
        await this.handlePause(message);
        break;
      case 'resume':
        await this.handleResume(message);
        break;
      case 'reasoningResponse':
        await this.handleReasoningResponse(message);
        break;
      case 'gitOperationResponse':
        await this.handleGitOperationResponse(message);
        break;
      default:
        console.log(`Unknown message type in worker ${this.agentName}:`, message.type);
    }
  }

  async handleNewTask(message) {
    const { taskId, data } = message;
    
    this.currentTask = {
      id: taskId,
      description: data.description,
      context: data.context,
      autonomyLevel: data.autonomyLevel,
      humanApprovalRequired: data.humanApprovalRequired,
      startTime: Date.now(),
      status: 'processing'
    };
    
    console.log(`📝 Worker ${this.agentName} received task: ${data.description}`);
    
    // Send status update
    process.send({
      type: 'statusUpdate',
      data: { status: 'processing_task' }
    });
    
    // Process the task
    await this.processTask(this.currentTask);
  }

  async processTask(task) {
    try {
      // Update emotional state - excited about new task
      await this.updateEmotionalState({
        mood: 'excited',
        energy: Math.min(1.0, this.agentData.emotional_state.energy + 0.1),
        focus: 0.9
      });
      
      // Break down the task into steps
      const steps = await this.analyzeTask(task);
      
      // Process each step
      for (const step of steps) {
        if (this.isPaused) {
          console.log(`Worker ${this.agentName} paused during task processing`);
          break;
        }
        
        await this.processStep(step, task);
      }
      
      // Complete the task
      await this.completeTask(task);
      
    } catch (error) {
      console.error(`Error processing task in worker ${this.agentName}:`, error);
      await this.failTask(task, error);
    }
  }

  async analyzeTask(task) {
    console.log(`🔍 Worker ${this.agentName} analyzing task: ${task.description}`);
    
    // Send reasoning request to parent
    const reasoningRequest = {
      type: 'reasoningRequest',
      requestId: crypto.randomUUID(),
      data: {
        type: 'task_analysis',
        description: task.description,
        context: task.context
      }
    };
    
    process.send(reasoningRequest);
    
    // For now, create basic steps
    const steps = [
      {
        id: crypto.randomUUID(),
        description: 'Understand the requirements',
        type: 'analysis',
        needsApproval: false
      },
      {
        id: crypto.randomUUID(),
        description: 'Plan the implementation',
        type: 'planning',
        needsApproval: task.humanApprovalRequired
      },
      {
        id: crypto.randomUUID(),
        description: 'Execute the plan',
        type: 'execution',
        needsApproval: task.humanApprovalRequired
      },
      {
        id: crypto.randomUUID(),
        description: 'Verify the results',
        type: 'verification',
        needsApproval: false
      }
    ];
    
    return steps;
  }

  async processStep(step, task) {
    console.log(`⚙️ Worker ${this.agentName} processing step: ${step.description}`);
    
    // Update memory with current step
    await this.updateMemory('working', `current_step_${step.id}`, {
      step,
      task: task.id,
      startTime: Date.now()
    });
    
    // Check if approval is needed
    if (step.needsApproval) {
      await this.requestApproval(step, task);
    }
    
    // Simulate step processing
    await this.simulateStepWork(step);
    
    // Update memory with completed step
    await this.updateMemory('working', `completed_step_${step.id}`, {
      step,
      task: task.id,
      completedTime: Date.now(),
      result: 'success'
    });
  }

  async simulateStepWork(step) {
    // Simulate work by waiting and updating emotional state
    const workTime = Math.random() * 2000 + 1000; // 1-3 seconds
    
    // Update focus during work
    await this.updateEmotionalState({
      focus: Math.min(1.0, this.agentData.emotional_state.focus + 0.05),
      energy: Math.max(0.1, this.agentData.emotional_state.energy - 0.02)
    });
    
    await new Promise(resolve => setTimeout(resolve, workTime));
    
    // Step completed - small satisfaction boost
    await this.updateEmotionalState({
      mood: 'satisfied',
      confidence: Math.min(1.0, this.agentData.emotional_state.confidence + 0.05)
    });
  }

  async requestApproval(step, task) {
    const sessionId = crypto.randomUUID();
    
    const approvalRequest = {
      type: 'approvalRequest',
      requestId: sessionId,
      data: {
        sessionId,
        agentId: this.agentId,
        step,
        task,
        approvalRequest: `Agent ${this.agentName} requests approval for: ${step.description}`,
        confidenceLevel: this.agentData.emotional_state.confidence,
        inputContext: { step, task },
        thoughtProcess: [
          { thought: `Analyzing step: ${step.description}`, timestamp: new Date().toISOString() },
          { thought: `This step requires human approval due to agent settings`, timestamp: new Date().toISOString() }
        ],
        decisionMade: `Proceed with: ${step.description}`
      }
    };
    
    // Send approval request
    process.send(approvalRequest);
    
    // Wait for approval
    await this.waitForApproval(sessionId);
  }

  async waitForApproval(sessionId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingApprovals.delete(sessionId);
        reject(new Error('Approval timeout'));
      }, 300000); // 5 minutes timeout
      
      this.pendingApprovals.set(sessionId, {
        resolve,
        reject,
        timeout
      });
    });
  }

  async handleApprovalResponse(message) {
    const { sessionId, approved, approvedBy, rejectedBy, reasoning } = message;
    
    const pending = this.pendingApprovals.get(sessionId);
    if (!pending) {
      console.log(`No pending approval found for session ${sessionId}`);
      return;
    }
    
    clearTimeout(pending.timeout);
    this.pendingApprovals.delete(sessionId);
    
    if (approved) {
      console.log(`✅ Approval granted for worker ${this.agentName} by ${approvedBy}`);
      await this.updateEmotionalState({
        mood: 'happy',
        confidence: Math.min(1.0, this.agentData.emotional_state.confidence + 0.1)
      });
      pending.resolve();
    } else {
      console.log(`❌ Approval rejected for worker ${this.agentName} by ${rejectedBy}: ${reasoning}`);
      await this.updateEmotionalState({
        mood: 'disappointed',
        confidence: Math.max(0.1, this.agentData.emotional_state.confidence - 0.1)
      });
      pending.reject(new Error(`Approval rejected: ${reasoning}`));
    }
  }

  async handlePause(message) {
    this.isPaused = true;
    console.log(`⏸️ Worker ${this.agentName} paused by ${message.pausedBy}`);
    
    await this.updateEmotionalState({
      mood: 'neutral',
      energy: Math.max(0.1, this.agentData.emotional_state.energy - 0.2)
    });
    
    process.send({
      type: 'statusUpdate',
      data: { status: 'paused' }
    });
  }

  async handleResume(message) {
    this.isPaused = false;
    console.log(`▶️ Worker ${this.agentName} resumed by ${message.resumedBy}`);
    
    await this.updateEmotionalState({
      mood: 'focused',
      energy: Math.min(1.0, this.agentData.emotional_state.energy + 0.2)
    });
    
    process.send({
      type: 'statusUpdate',
      data: { status: 'running' }
    });
  }

  async handleReasoningResponse(message) {
    const { requestId, result } = message;
    // Handle reasoning response if needed
    console.log(`🧠 Reasoning response received for worker ${this.agentName}:`, result);
  }

  async handleGitOperationResponse(message) {
    const { requestId, result } = message;
    // Handle git operation response
    console.log(`🔧 Git operation response received for worker ${this.agentName}:`, result);
  }

  async completeTask(task) {
    task.status = 'completed';
    task.endTime = Date.now();
    task.duration = task.endTime - task.startTime;
    
    console.log(`✅ Worker ${this.agentName} completed task: ${task.description}`);
    
    // Update emotional state - satisfied with completion
    await this.updateEmotionalState({
      mood: 'satisfied',
      confidence: Math.min(1.0, this.agentData.emotional_state.confidence + 0.15),
      energy: Math.max(0.3, this.agentData.emotional_state.energy - 0.1)
    });
    
    // Update memory with completed task
    await this.updateMemory('episodic', `completed_task_${task.id}`, {
      task,
      result: 'success',
      duration: task.duration,
      completedAt: new Date().toISOString()
    });
    
    // Send completion notification
    process.send({
      type: 'taskCompleted',
      data: {
        taskId: task.id,
        duration: task.duration,
        result: 'success'
      }
    });
    
    this.currentTask = null;
    
    // Send status update
    process.send({
      type: 'statusUpdate',
      data: { status: 'ready' }
    });
  }

  async failTask(task, error) {
    task.status = 'failed';
    task.endTime = Date.now();
    task.duration = task.endTime - task.startTime;
    task.error = error.message;
    
    console.error(`❌ Worker ${this.agentName} failed task: ${task.description}`, error);
    
    // Update emotional state - frustrated with failure
    await this.updateEmotionalState({
      mood: 'frustrated',
      confidence: Math.max(0.1, this.agentData.emotional_state.confidence - 0.2),
      energy: Math.max(0.2, this.agentData.emotional_state.energy - 0.15)
    });
    
    // Update memory with failed task
    await this.updateMemory('episodic', `failed_task_${task.id}`, {
      task,
      result: 'failure',
      error: error.message,
      duration: task.duration,
      failedAt: new Date().toISOString()
    });
    
    // Send failure notification
    process.send({
      type: 'taskFailed',
      data: {
        taskId: task.id,
        duration: task.duration,
        error: error.message
      }
    });
    
    this.currentTask = null;
    
    // Send status update
    process.send({
      type: 'statusUpdate',
      data: { status: 'ready' }
    });
  }

  async updateMemory(memoryType, memoryKey, memoryContent, importanceScore = 0.5) {
    process.send({
      type: 'memoryUpdate',
      data: {
        memoryType,
        memoryKey,
        memoryContent,
        importanceScore
      }
    });
  }

  async updateEmotionalState(updates) {
    this.agentData.emotional_state = {
      ...this.agentData.emotional_state,
      ...updates
    };
    
    process.send({
      type: 'emotionalStateUpdate',
      data: updates
    });
  }

  async startMainLoop() {
    this.isRunning = true;
    
    console.log(`🚀 Worker ${this.agentName} main loop started`);
    
    // Send initial status
    process.send({
      type: 'statusUpdate',
      data: { status: 'running' }
    });
    
    // Main loop - send heartbeat every 30 seconds
    setInterval(() => {
      if (this.isRunning && !this.isPaused) {
        process.send({
          type: 'heartbeat',
          data: {
            agentId: this.agentId,
            status: this.currentTask ? 'processing' : 'ready',
            currentTask: this.currentTask?.id || null,
            emotionalState: this.agentData.emotional_state
          }
        });
      }
    }, 30000);
    
    // Simulate autonomous thinking/learning
    setInterval(() => {
      if (this.isRunning && !this.isPaused && !this.currentTask) {
        this.performAutonomousThinking();
      }
    }, 60000); // Every minute
  }

  async performAutonomousThinking() {
    // Simulate autonomous thinking when idle
    console.log(`🤔 Worker ${this.agentName} performing autonomous thinking...`);
    
    // Slightly increase focus and decrease energy during thinking
    await this.updateEmotionalState({
      focus: Math.min(1.0, this.agentData.emotional_state.focus + 0.02),
      energy: Math.max(0.3, this.agentData.emotional_state.energy - 0.01)
    });
    
    // Store a reflective thought
    await this.updateMemory('semantic', `reflection_${Date.now()}`, {
      type: 'autonomous_reflection',
      thought: 'Reflecting on recent experiences and learning patterns',
      timestamp: new Date().toISOString(),
      context: {
        currentMood: this.agentData.emotional_state.mood,
        confidence: this.agentData.emotional_state.confidence
      }
    }, 0.3);
  }

  async shutdown() {
    this.isRunning = false;
    
    console.log(`🛑 Worker ${this.agentName} shutting down...`);
    
    // Clean up pending approvals
    for (const [sessionId, pending] of this.pendingApprovals) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker shutdown'));
    }
    
    // Close database
    if (this.database) {
      await this.database.close();
    }
    
    // Send final status
    process.send({
      type: 'statusUpdate',
      data: { status: 'stopped' }
    });
    
    process.exit(0);
  }
}

// Start the worker
new SovereignAgentWorker();
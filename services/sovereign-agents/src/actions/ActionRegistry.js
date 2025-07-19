/**
 * Action Registry - Component-based action system for Sovereign Agents
 */

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class ActionRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      maxConcurrentActions: options.maxConcurrentActions || 10,
      actionTimeout: options.actionTimeout || 300000, // 5 minutes
      enableRollback: options.enableRollback !== false,
      ...options
    };

    this.actions = new Map();
    this.categories = new Map();
    this.runningActions = new Map();
    this.actionHistory = [];
    this.rollbackStack = [];
    this.metrics = {
      registered: 0,
      executed: 0,
      successful: 0,
      failed: 0,
      rolledBack: 0
    };
  }

  /**
   * Register a new action
   */
  registerAction(actionDef) {
    const validation = this.validateActionDefinition(actionDef);
    if (!validation.valid) {
      throw new Error(`Invalid action definition: ${validation.errors.join(', ')}`);
    }

    const action = {
      id: actionDef.id || uuidv4(),
      name: actionDef.name,
      description: actionDef.description,
      category: actionDef.category,
      version: actionDef.version || '1.0.0',
      
      // Function definitions
      execute: actionDef.execute,
      validate: actionDef.validate || (() => ({ valid: true })),
      rollback: actionDef.rollback,
      
      // Configuration
      config: {
        requiresApproval: actionDef.requiresApproval || false,
        timeout: actionDef.timeout || this.options.actionTimeout,
        retryable: actionDef.retryable !== false,
        maxRetries: actionDef.maxRetries || 3,
        rollbackable: actionDef.rollbackable !== false,
        concurrent: actionDef.concurrent !== false,
        dependencies: actionDef.dependencies || [],
        permissions: actionDef.permissions || [],
        ...actionDef.config
      },

      // Metadata
      metadata: {
        registeredAt: new Date().toISOString(),
        registeredBy: actionDef.registeredBy || 'system',
        tags: actionDef.tags || [],
        ...actionDef.metadata
      },

      // Execution stats
      stats: {
        executions: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0,
        lastExecuted: null,
        lastResult: null
      }
    };

    this.actions.set(action.id, action);
    this.addToCategory(action.category, action.id);
    this.metrics.registered++;

    console.log(`🔧 Action registered: ${action.name} (${action.id})`);
    this.emit('action:registered', action);

    return action.id;
  }

  /**
   * Execute an action
   */
  async executeAction(actionId, parameters = {}, context = {}) {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    // Check concurrent executions
    if (this.runningActions.size >= this.options.maxConcurrentActions) {
      throw new Error('Maximum concurrent actions limit reached');
    }

    // Check if action is already running (if not concurrent)
    if (!action.config.concurrent && this.runningActions.has(actionId)) {
      throw new Error(`Action ${action.name} is already running and not concurrent`);
    }

    const executionId = uuidv4();
    const execution = {
      id: executionId,
      actionId,
      action,
      parameters,
      context: {
        executedBy: context.executedBy || 'system',
        agentId: context.agentId,
        correlationId: context.correlationId || uuidv4(),
        ...context
      },
      startTime: new Date(),
      status: 'running',
      result: null,
      error: null,
      rollbackData: null
    };

    try {
      // Add to running actions
      this.runningActions.set(executionId, execution);
      
      console.log(`🚀 Executing action: ${action.name} (${executionId})`);
      this.emit('action:started', execution);

      // Validate parameters
      const validation = await action.validate(parameters, context);
      if (!validation.valid) {
        throw new Error(`Parameter validation failed: ${validation.errors?.join(', ') || 'Invalid parameters'}`);
      }

      // Check dependencies
      await this.checkDependencies(action, context);

      // Execute with timeout
      const result = await this.executeWithTimeout(action, parameters, context, execution);

      // Success
      execution.status = 'completed';
      execution.result = result;
      execution.endTime = new Date();
      execution.duration = execution.endTime - execution.startTime;

      // Update stats
      action.stats.executions++;
      action.stats.successes++;
      action.stats.lastExecuted = execution.endTime.toISOString();
      action.stats.lastResult = 'success';
      action.stats.avgDuration = this.calculateAvgDuration(action, execution.duration);

      // Add to history
      this.actionHistory.unshift({...execution});
      if (this.actionHistory.length > 1000) {
        this.actionHistory.pop();
      }

      // Add to rollback stack if rollbackable
      if (action.config.rollbackable && execution.rollbackData) {
        this.rollbackStack.push({
          executionId,
          actionId,
          rollbackData: execution.rollbackData,
          timestamp: execution.endTime
        });
      }

      this.metrics.executed++;
      this.metrics.successful++;

      console.log(`✅ Action completed: ${action.name} (${executionId}) in ${execution.duration}ms`);
      this.emit('action:completed', execution);

      return {
        executionId,
        result,
        duration: execution.duration,
        timestamp: execution.endTime
      };

    } catch (error) {
      execution.status = 'failed';
      execution.error = error;
      execution.endTime = new Date();
      execution.duration = execution.endTime - execution.startTime;

      // Update stats
      action.stats.executions++;
      action.stats.failures++;
      action.stats.lastExecuted = execution.endTime.toISOString();
      action.stats.lastResult = 'failure';

      this.actionHistory.unshift({...execution});
      this.metrics.executed++;
      this.metrics.failed++;

      console.error(`❌ Action failed: ${action.name} (${executionId}):`, error.message);
      this.emit('action:failed', execution);

      throw error;

    } finally {
      // Remove from running actions
      this.runningActions.delete(executionId);
    }
  }

  /**
   * Execute action with timeout
   */
  async executeWithTimeout(action, parameters, context, execution) {
    return new Promise(async (resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Action timeout after ${action.config.timeout}ms`));
      }, action.config.timeout);

      try {
        // Execute the action
        const result = await action.execute(parameters, context, execution);
        
        // Store rollback data if provided
        if (result && typeof result === 'object' && result.rollbackData) {
          execution.rollbackData = result.rollbackData;
          // Return just the actual result
          resolve(result.result || result);
        } else {
          resolve(result);
        }

      } catch (error) {
        reject(error);
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  /**
   * Check action dependencies
   */
  async checkDependencies(action, context) {
    if (!action.config.dependencies || action.config.dependencies.length === 0) {
      return true;
    }

    for (const dependency of action.config.dependencies) {
      if (typeof dependency === 'string') {
        // Simple action dependency
        if (!this.actions.has(dependency)) {
          throw new Error(`Missing dependency: ${dependency}`);
        }
      } else if (typeof dependency === 'object') {
        // Complex dependency with conditions
        const result = await this.evaluateDependency(dependency, context);
        if (!result) {
          throw new Error(`Dependency not satisfied: ${dependency.name || dependency}`);
        }
      }
    }

    return true;
  }

  /**
   * Evaluate complex dependency
   */
  async evaluateDependency(dependency, context) {
    if (dependency.type === 'service') {
      // Check if service is available
      return this.checkServiceHealth(dependency.service);
    } else if (dependency.type === 'permission') {
      // Check if user has permission
      return this.checkPermission(dependency.permission, context);
    } else if (dependency.type === 'state') {
      // Check application state
      return this.checkState(dependency.state, context);
    }

    return true;
  }

  /**
   * Rollback action by execution ID
   */
  async rollbackAction(executionId) {
    const rollbackEntry = this.rollbackStack.find(entry => entry.executionId === executionId);
    if (!rollbackEntry) {
      throw new Error(`No rollback data found for execution: ${executionId}`);
    }

    const action = this.actions.get(rollbackEntry.actionId);
    if (!action || !action.rollback) {
      throw new Error(`Action ${rollbackEntry.actionId} is not rollbackable`);
    }

    try {
      console.log(`🔄 Rolling back action: ${action.name} (${executionId})`);
      
      const rollbackResult = await action.rollback(rollbackEntry.rollbackData, {
        executionId,
        originalTimestamp: rollbackEntry.timestamp
      });

      // Remove from rollback stack
      this.rollbackStack = this.rollbackStack.filter(entry => entry.executionId !== executionId);
      
      this.metrics.rolledBack++;
      console.log(`✅ Action rolled back: ${action.name} (${executionId})`);
      this.emit('action:rolledback', { executionId, actionId: rollbackEntry.actionId, result: rollbackResult });

      return rollbackResult;

    } catch (error) {
      console.error(`❌ Rollback failed: ${action.name} (${executionId}):`, error.message);
      throw error;
    }
  }

  /**
   * Get action by ID
   */
  getAction(actionId) {
    return this.actions.get(actionId);
  }

  /**
   * Get actions by category
   */
  getActionsByCategory(category) {
    const categoryActions = this.categories.get(category) || [];
    return categoryActions.map(actionId => this.actions.get(actionId)).filter(Boolean);
  }

  /**
   * Search actions
   */
  searchActions(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const action of this.actions.values()) {
      if (
        action.name.toLowerCase().includes(lowerQuery) ||
        action.description.toLowerCase().includes(lowerQuery) ||
        action.category.toLowerCase().includes(lowerQuery) ||
        action.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push(action);
      }
    }

    return results;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 100) {
    return this.actionHistory.slice(0, limit);
  }

  /**
   * Get running actions
   */
  getRunningActions() {
    return Array.from(this.runningActions.values());
  }

  /**
   * Get rollback stack
   */
  getRollbackStack() {
    return [...this.rollbackStack];
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalActions: this.actions.size,
      categories: this.categories.size,
      runningActions: this.runningActions.size,
      rollbackEntries: this.rollbackStack.length,
      historyEntries: this.actionHistory.length
    };
  }

  /**
   * Validate action definition
   */
  validateActionDefinition(actionDef) {
    const errors = [];

    if (!actionDef.name) errors.push('Action name is required');
    if (!actionDef.description) errors.push('Action description is required');
    if (!actionDef.category) errors.push('Action category is required');
    if (typeof actionDef.execute !== 'function') errors.push('Action execute function is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Add action to category
   */
  addToCategory(category, actionId) {
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(actionId);
  }

  /**
   * Calculate average duration
   */
  calculateAvgDuration(action, newDuration) {
    const currentAvg = action.stats.avgDuration;
    const executions = action.stats.executions;
    
    if (executions === 1) {
      return newDuration;
    }
    
    return Math.round(((currentAvg * (executions - 1)) + newDuration) / executions);
  }

  /**
   * Check service health (stub)
   */
  async checkServiceHealth(service) {
    // TODO: Implement actual service health checking
    return true;
  }

  /**
   * Check permission (stub)
   */
  async checkPermission(permission, context) {
    // TODO: Implement actual permission checking
    return true;
  }

  /**
   * Check state (stub)
   */
  async checkState(state, context) {
    // TODO: Implement actual state checking
    return true;
  }

  /**
   * Export action definitions for backup/migration
   */
  exportActions() {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      actions: Array.from(this.actions.values()).map(action => ({
        ...action,
        stats: undefined, // Don't export runtime stats
        execute: undefined, // Don't export functions
        validate: undefined,
        rollback: undefined
      }))
    };

    return exportData;
  }

  /**
   * Clear old history and rollback entries
   */
  cleanup(options = {}) {
    const historyLimit = options.historyLimit || 1000;
    const rollbackLimit = options.rollbackLimit || 100;
    const maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 7 days

    const cutoff = new Date(Date.now() - maxAge);

    // Clean history
    this.actionHistory = this.actionHistory
      .filter(entry => new Date(entry.startTime) > cutoff)
      .slice(0, historyLimit);

    // Clean rollback stack
    this.rollbackStack = this.rollbackStack
      .filter(entry => new Date(entry.timestamp) > cutoff)
      .slice(0, rollbackLimit);

    console.log(`🧹 Cleaned up action registry - History: ${this.actionHistory.length}, Rollback: ${this.rollbackStack.length}`);
  }
}

module.exports = ActionRegistry;
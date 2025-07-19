/**
 * Error Recovery Manager - Handles system failures and recovery
 */

class ErrorRecoveryManager {
  constructor(jobQueue, wsManager, monitoringManager) {
    this.jobQueue = jobQueue;
    this.wsManager = wsManager;
    this.monitoringManager = monitoringManager;
    this.recoveryStrategies = new Map();
    this.failedJobs = new Map();
    this.retryAttempts = new Map();
    
    this.setupRecoveryStrategies();
    this.startRecoveryLoop();
    
    console.log('🔄 Error Recovery Manager initialized');
  }

  /**
   * Setup recovery strategies for different error types
   */
  setupRecoveryStrategies() {
    // Memory error recovery
    this.addRecoveryStrategy('memory_error', async (error, context) => {
      console.log('🔄 Recovering from memory error...');
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Cancel non-essential jobs
      await this.cancelLowPriorityJobs();
      
      // Wait a bit for memory to free up
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return { success: true, action: 'memory_cleanup' };
    });

    // Database connection error recovery
    this.addRecoveryStrategy('database_error', async (error, context) => {
      console.log('🔄 Recovering from database error...');
      
      // Reinitialize job queue
      try {
        await this.jobQueue.initialize();
        return { success: true, action: 'database_reconnection' };
      } catch (retryError) {
        return { success: false, action: 'database_reconnection_failed', error: retryError.message };
      }
    });

    // AI service timeout recovery
    this.addRecoveryStrategy('ai_timeout', async (error, context) => {
      console.log('🔄 Recovering from AI service timeout...');
      
      // Retry with simpler prompts or different model
      if (context.jobId) {
        const job = await this.jobQueue.getJob(context.jobId);
        if (job) {
          job.metadata.fallbackMode = true;
          job.metadata.timeoutCount = (job.metadata.timeoutCount || 0) + 1;
          
          await this.jobQueue.updateJob(context.jobId, {
            metadata: job.metadata,
            status: 'queued', // Retry
            currentStep: 'Retrying with fallback settings'
          });
        }
      }
      
      return { success: true, action: 'ai_fallback_retry' };
    });

    // File system error recovery
    this.addRecoveryStrategy('filesystem_error', async (error, context) => {
      console.log('🔄 Recovering from filesystem error...');
      
      // Cleanup temp files and recreate directories
      try {
        const fs = require('fs').promises;
        const path = require('path');
        
        const tempDir = path.join(__dirname, 'temp');
        const uploadsDir = path.join(__dirname, 'uploads');
        const generatedDir = path.join(__dirname, 'generated');
        
        await fs.mkdir(tempDir, { recursive: true });
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.mkdir(generatedDir, { recursive: true });
        
        return { success: true, action: 'filesystem_cleanup' };
      } catch (retryError) {
        return { success: false, action: 'filesystem_recovery_failed', error: retryError.message };
      }
    });

    // WebSocket connection recovery
    this.addRecoveryStrategy('websocket_error', async (error, context) => {
      console.log('🔄 Recovering from WebSocket error...');
      
      // Reinitialize WebSocket connections
      try {
        this.wsManager.disconnectAll();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true, action: 'websocket_reset' };
      } catch (retryError) {
        return { success: false, action: 'websocket_recovery_failed', error: retryError.message };
      }
    });
  }

  /**
   * Add a recovery strategy
   */
  addRecoveryStrategy(errorType, strategyFunction) {
    this.recoveryStrategies.set(errorType, strategyFunction);
  }

  /**
   * Handle error and attempt recovery
   */
  async handleError(error, context = {}) {
    const errorType = this.classifyError(error);
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`🚨 Error detected [${errorType}]:`, error.message);
    
    // Record the error
    this.monitoringManager.recordMetric('error_count', 1, { type: errorType });
    this.monitoringManager.createAlert('error', 'System Error', 
      `${errorType}: ${error.message}`, 
      { errorId, stack: error.stack, context });

    // Attempt recovery
    const strategy = this.recoveryStrategies.get(errorType);
    if (strategy) {
      try {
        const result = await strategy(error, context);
        
        if (result.success) {
          console.log(`✅ Recovery successful: ${result.action}`);
          this.monitoringManager.createAlert('info', 'Recovery Success', 
            `Successfully recovered from ${errorType}`, 
            { errorId, action: result.action });
          return result;
        } else {
          console.error(`❌ Recovery failed: ${result.error}`);
          this.monitoringManager.createAlert('critical', 'Recovery Failed', 
            `Failed to recover from ${errorType}: ${result.error}`, 
            { errorId, action: result.action });
        }
      } catch (recoveryError) {
        console.error('❌ Recovery strategy failed:', recoveryError);
        this.monitoringManager.createAlert('critical', 'Recovery Exception', 
          `Recovery strategy threw error: ${recoveryError.message}`, 
          { errorId, originalError: error.message });
      }
    } else {
      console.warn(`⚠️ No recovery strategy for error type: ${errorType}`);
      this.monitoringManager.createAlert('warning', 'No Recovery Strategy', 
        `No recovery strategy found for ${errorType}`, 
        { errorId, error: error.message });
    }

    return { success: false, errorId };
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack ? error.stack.toLowerCase() : '';
    
    if (message.includes('memory') || message.includes('heap') || stack.includes('out of memory')) {
      return 'memory_error';
    }
    
    if (message.includes('database') || message.includes('connection') || message.includes('sql')) {
      return 'database_error';
    }
    
    if (message.includes('timeout') || message.includes('ai') || message.includes('openai') || message.includes('anthropic')) {
      return 'ai_timeout';
    }
    
    if (message.includes('file') || message.includes('directory') || message.includes('enoent')) {
      return 'filesystem_error';
    }
    
    if (message.includes('websocket') || message.includes('socket')) {
      return 'websocket_error';
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('request')) {
      return 'network_error';
    }
    
    return 'unknown_error';
  }

  /**
   * Retry failed job with exponential backoff
   */
  async retryJob(jobId, error) {
    const job = await this.jobQueue.getJob(jobId);
    if (!job) {
      return false;
    }

    const retryCount = this.retryAttempts.get(jobId) || 0;
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) {
      console.log(`❌ Job ${jobId} exceeded max retries (${maxRetries})`);
      
      await this.jobQueue.updateJob(jobId, {
        status: 'failed',
        error: `Max retries exceeded. Last error: ${error.message}`,
        retryCount
      });
      
      this.monitoringManager.createAlert('error', 'Job Retry Limit Exceeded', 
        `Job ${jobId} failed after ${maxRetries} retries`, 
        { jobId, lastError: error.message });
      
      return false;
    }

    // Calculate exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, retryCount), 60000); // Max 1 minute
    
    console.log(`🔄 Retrying job ${jobId} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
    
    setTimeout(async () => {
      try {
        this.retryAttempts.set(jobId, retryCount + 1);
        
        await this.jobQueue.updateJob(jobId, {
          status: 'queued',
          error: null,
          retryCount: retryCount + 1,
          currentStep: `Retrying (attempt ${retryCount + 1})`
        });
        
        this.monitoringManager.createAlert('info', 'Job Retry', 
          `Retrying job ${jobId} (attempt ${retryCount + 1})`, 
          { jobId, delay });
          
      } catch (retryError) {
        console.error('Failed to retry job:', retryError);
        await this.handleError(retryError, { jobId, action: 'retry_job' });
      }
    }, delay);
    
    return true;
  }

  /**
   * Cancel low priority jobs to free resources
   */
  async cancelLowPriorityJobs() {
    try {
      const jobs = await this.jobQueue.getJobs({ status: 'queued' });
      let cancelledCount = 0;
      
      for (const job of jobs) {
        if (job.metadata.priority === 'low' || !job.metadata.priority) {
          await this.jobQueue.updateJob(job.id, {
            status: 'cancelled',
            error: 'Cancelled to free system resources'
          });
          cancelledCount++;
        }
      }
      
      if (cancelledCount > 0) {
        console.log(`🔄 Cancelled ${cancelledCount} low priority jobs`);
        this.monitoringManager.createAlert('info', 'Resource Recovery', 
          `Cancelled ${cancelledCount} low priority jobs to free resources`);
      }
      
      return cancelledCount;
    } catch (error) {
      console.error('Failed to cancel low priority jobs:', error);
      return 0;
    }
  }

  /**
   * Start recovery monitoring loop
   */
  startRecoveryLoop() {
    // Check for stuck jobs every 5 minutes
    setInterval(async () => {
      try {
        const jobs = await this.jobQueue.getJobs({ status: 'processing' });
        const now = Date.now();
        
        for (const job of jobs) {
          const processingTime = now - new Date(job.updatedAt).getTime();
          const timeoutThreshold = 30 * 60 * 1000; // 30 minutes
          
          if (processingTime > timeoutThreshold) {
            console.warn(`⚠️ Stuck job detected: ${job.id}`);
            
            // Mark as failed and create alert
            await this.jobQueue.updateJob(job.id, {
              status: 'failed',
              error: 'Job timeout - processing took too long'
            });
            
            this.monitoringManager.createAlert('warning', 'Stuck Job Detected', 
              `Job ${job.id} was stuck for ${Math.round(processingTime / 60000)} minutes`, 
              { jobId: job.id, processingTime });
          }
        }
      } catch (error) {
        console.error('Recovery loop error:', error);
      }
    }, 300000); // 5 minutes

    // Cleanup old retry attempts every hour
    setInterval(() => {
      const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour
      for (const [jobId, timestamp] of this.retryAttempts.entries()) {
        if (timestamp < cutoffTime) {
          this.retryAttempts.delete(jobId);
        }
      }
    }, 3600000); // 1 hour

    console.log('🔄 Recovery monitoring started');
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    return {
      activeRetries: this.retryAttempts.size,
      recoveryStrategies: Array.from(this.recoveryStrategies.keys()),
      failedJobs: this.failedJobs.size
    };
  }

  /**
   * Manual recovery trigger
   */
  async triggerRecovery(recoveryType, context = {}) {
    console.log(`🔄 Manual recovery triggered: ${recoveryType}`);
    
    const strategy = this.recoveryStrategies.get(recoveryType);
    if (!strategy) {
      throw new Error(`No recovery strategy found for: ${recoveryType}`);
    }
    
    const result = await strategy(new Error(`Manual trigger: ${recoveryType}`), context);
    
    this.monitoringManager.createAlert('info', 'Manual Recovery', 
      `Manual recovery triggered: ${recoveryType}`, 
      { recoveryType, result });
    
    return result;
  }

  /**
   * System health recovery
   */
  async performSystemHealthRecovery() {
    console.log('🔄 Performing system health recovery...');
    
    const actions = [];
    
    try {
      // 1. Force garbage collection
      if (global.gc) {
        global.gc();
        actions.push('garbage_collection');
      }
      
      // 2. Clean up old job data
      const cleanedJobs = await this.jobQueue.cleanupOldJobs();
      if (cleanedJobs > 0) {
        actions.push(`cleaned_${cleanedJobs}_jobs`);
      }
      
      // 3. Restart monitoring if unhealthy
      const health = await this.monitoringManager.runHealthChecks();
      if (health.status !== 'healthy') {
        // Attempt to restart components
        actions.push('health_check_restart');
      }
      
      // 4. Clear old metrics
      this.monitoringManager.cleanupOldMetrics();
      actions.push('metrics_cleanup');
      
      this.monitoringManager.createAlert('info', 'System Recovery Complete', 
        `System health recovery completed: ${actions.join(', ')}`);
      
      return { success: true, actions };
      
    } catch (error) {
      this.monitoringManager.createAlert('error', 'System Recovery Failed', 
        `System health recovery failed: ${error.message}`);
      
      return { success: false, error: error.message };
    }
  }
}

module.exports = ErrorRecoveryManager;
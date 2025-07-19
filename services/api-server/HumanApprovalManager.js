/**
 * Human Approval Manager - Manages human-in-the-loop decisions
 */

class HumanApprovalManager {
  constructor(jobQueue, wsManager) {
    this.jobQueue = jobQueue;
    this.wsManager = wsManager;
    this.pendingApprovals = new Map();
    this.approvalTimeouts = new Map();
    
    console.log('👤 Human Approval Manager initialized');
  }

  /**
   * Request human approval for a decision
   */
  async requestApproval(jobId, approvalRequest) {
    const approvalId = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const approval = {
      id: approvalId,
      jobId,
      type: approvalRequest.type,
      title: approvalRequest.title,
      description: approvalRequest.description,
      options: approvalRequest.options || ['approve', 'reject', 'modify'],
      data: approvalRequest.data,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      timeout: approvalRequest.timeout || 300000 // 5 minutes default
    };

    this.pendingApprovals.set(approvalId, approval);

    // Set timeout for auto-rejection
    const timeoutId = setTimeout(() => {
      this.handleTimeout(approvalId);
    }, approval.timeout);
    
    this.approvalTimeouts.set(approvalId, timeoutId);

    // Update job status
    await this.jobQueue.updateJob(jobId, {
      status: 'awaiting_approval',
      currentStep: `Waiting for human approval: ${approval.title}`,
      pendingApproval: approvalId
    });

    // Notify via WebSocket
    this.wsManager.emit(jobId, 'approval:requested', {
      approvalId,
      type: approval.type,
      title: approval.title,
      description: approval.description,
      options: approval.options,
      data: approval.data,
      expiresAt: new Date(Date.now() + approval.timeout).toISOString()
    });

    // Also broadcast to general approval listeners
    this.wsManager.emitToApp('approval:new', {
      approvalId,
      jobId,
      type: approval.type,
      title: approval.title,
      description: approval.description,
      urgency: this.calculateUrgency(approval.type)
    });

    console.log(`👤 Requested approval ${approvalId} for job ${jobId}: ${approval.title}`);

    return approvalId;
  }

  /**
   * Process human response to approval request
   */
  async processApproval(approvalId, response) {
    const approval = this.pendingApprovals.get(approvalId);
    
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval ${approvalId} already processed (status: ${approval.status})`);
    }

    // Clear timeout
    const timeoutId = this.approvalTimeouts.get(approvalId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.approvalTimeouts.delete(approvalId);
    }

    // Update approval
    approval.status = response.decision;
    approval.response = response;
    approval.respondedAt = new Date().toISOString();
    approval.responseTime = Date.now() - new Date(approval.requestedAt).getTime();

    // Update job
    await this.jobQueue.updateJob(approval.jobId, {
      status: 'processing',
      currentStep: `Human approval: ${response.decision}`,
      pendingApproval: null
    });

    // Notify via WebSocket
    this.wsManager.emit(approval.jobId, 'approval:responded', {
      approvalId,
      decision: response.decision,
      comment: response.comment,
      responseTime: approval.responseTime
    });

    this.wsManager.emitToApp('approval:completed', {
      approvalId,
      jobId: approval.jobId,
      decision: response.decision,
      responseTime: approval.responseTime
    });

    console.log(`👤 Approval ${approvalId} processed: ${response.decision}`);

    return approval;
  }

  /**
   * Get approval details
   */
  async getApproval(approvalId) {
    return this.pendingApprovals.get(approvalId);
  }

  /**
   * Get all pending approvals
   */
  async getPendingApprovals() {
    return Array.from(this.pendingApprovals.values())
      .filter(approval => approval.status === 'pending');
  }

  /**
   * Get approvals for a specific job
   */
  async getJobApprovals(jobId) {
    return Array.from(this.pendingApprovals.values())
      .filter(approval => approval.jobId === jobId);
  }

  /**
   * Handle approval timeout
   */
  async handleTimeout(approvalId) {
    const approval = this.pendingApprovals.get(approvalId);
    
    if (!approval || approval.status !== 'pending') {
      return;
    }

    approval.status = 'timeout';
    approval.respondedAt = new Date().toISOString();

    // Update job to failed due to timeout
    await this.jobQueue.updateJob(approval.jobId, {
      status: 'failed',
      error: `Human approval timeout: ${approval.title}`,
      pendingApproval: null
    });

    // Notify via WebSocket
    this.wsManager.emit(approval.jobId, 'approval:timeout', {
      approvalId,
      title: approval.title
    });

    this.wsManager.emitToApp('approval:timeout', {
      approvalId,
      jobId: approval.jobId,
      title: approval.title
    });

    console.log(`👤 Approval ${approvalId} timed out`);
  }

  /**
   * Cancel a pending approval
   */
  async cancelApproval(approvalId, reason = 'Cancelled by system') {
    const approval = this.pendingApprovals.get(approvalId);
    
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Cannot cancel approval ${approvalId} - status: ${approval.status}`);
    }

    // Clear timeout
    const timeoutId = this.approvalTimeouts.get(approvalId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.approvalTimeouts.delete(approvalId);
    }

    approval.status = 'cancelled';
    approval.cancelReason = reason;
    approval.respondedAt = new Date().toISOString();

    // Notify via WebSocket
    this.wsManager.emit(approval.jobId, 'approval:cancelled', {
      approvalId,
      reason
    });

    console.log(`👤 Approval ${approvalId} cancelled: ${reason}`);
  }

  /**
   * Create common approval types
   */
  createRequirementApproval(jobId, requirements) {
    return this.requestApproval(jobId, {
      type: 'requirements_review',
      title: 'Review Extracted Requirements',
      description: 'Please review the requirements extracted from your document',
      options: ['approve', 'modify', 'reject'],
      data: {
        features: requirements.features,
        userStories: requirements.userStories,
        technicalRequirements: requirements.technicalRequirements,
        constraints: requirements.constraints
      },
      timeout: 600000 // 10 minutes for requirements review
    });
  }

  createArchitectureApproval(jobId, architecture) {
    return this.requestApproval(jobId, {
      type: 'architecture_review',
      title: 'Review System Architecture',
      description: 'Please review the proposed system architecture',
      options: ['approve', 'modify_tech_stack', 'change_architecture', 'reject'],
      data: {
        type: architecture.type,
        technology: architecture.technology,
        components: architecture.components,
        database: architecture.database,
        deployment: architecture.deployment
      },
      timeout: 600000 // 10 minutes for architecture review
    });
  }

  createCodeReviewApproval(jobId, codeStructure) {
    return this.requestApproval(jobId, {
      type: 'code_review',
      title: 'Review Generated Code Structure',
      description: 'Please review the code structure before generation',
      options: ['approve', 'modify_structure', 'change_framework', 'reject'],
      data: {
        projectStructure: codeStructure.projectStructure,
        fileCount: Object.keys(codeStructure.files || {}).length,
        dependencies: codeStructure.dependencies,
        buildCommands: codeStructure.buildCommands
      },
      timeout: 900000 // 15 minutes for code review
    });
  }

  /**
   * Calculate urgency level for approval
   */
  calculateUrgency(approvalType) {
    const urgencyLevels = {
      'requirements_review': 'medium',
      'architecture_review': 'high',
      'code_review': 'high',
      'deployment_review': 'medium',
      'security_review': 'critical'
    };

    return urgencyLevels[approvalType] || 'low';
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats() {
    const allApprovals = Array.from(this.pendingApprovals.values());
    
    const stats = {
      total: allApprovals.length,
      pending: allApprovals.filter(a => a.status === 'pending').length,
      approved: allApprovals.filter(a => a.status === 'approve').length,
      rejected: allApprovals.filter(a => a.status === 'reject').length,
      modified: allApprovals.filter(a => a.status === 'modify').length,
      timeout: allApprovals.filter(a => a.status === 'timeout').length,
      cancelled: allApprovals.filter(a => a.status === 'cancelled').length
    };

    // Calculate average response time
    const completedApprovals = allApprovals.filter(a => a.responseTime);
    stats.avgResponseTime = completedApprovals.length > 0
      ? completedApprovals.reduce((sum, a) => sum + a.responseTime, 0) / completedApprovals.length
      : 0;

    return stats;
  }

  /**
   * Clean up old approvals
   */
  async cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoffDate = new Date(Date.now() - maxAge);
    let cleanedCount = 0;

    for (const [approvalId, approval] of this.pendingApprovals.entries()) {
      const approvalDate = new Date(approval.requestedAt);
      
      if (approvalDate < cutoffDate && approval.status !== 'pending') {
        this.pendingApprovals.delete(approvalId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`👤 Cleaned up ${cleanedCount} old approvals`);
    }

    return cleanedCount;
  }
}

module.exports = HumanApprovalManager;
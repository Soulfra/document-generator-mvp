#!/usr/bin/env node

/**
 * HUMAN APPROVAL SYSTEM
 * Human-in-the-loop flags for critical decisions
 * Because we need humans to approve before production
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class HumanApprovalSystem {
  constructor() {
    this.approvalRequests = new Map();
    this.approvalHistory = [];
    this.requiresApproval = {
      // Testing phase
      'unit-tests-failed': { priority: 'high', autoReject: true },
      'e2e-tests-failed': { priority: 'high', autoReject: true },
      'security-tests-failed': { priority: 'critical', autoReject: true },
      
      // Deployment phase
      'shadow-deploy': { priority: 'medium', timeout: 3600 }, // 1 hour
      'staging-deploy': { priority: 'high', timeout: 7200 }, // 2 hours
      'production-deploy': { priority: 'critical', timeout: 86400 }, // 24 hours
      
      // System changes
      'database-migration': { priority: 'critical', timeout: 43200 }, // 12 hours
      'config-change': { priority: 'medium', timeout: 1800 }, // 30 min
      'api-breaking-change': { priority: 'critical', timeout: 86400 },
      
      // Emergency
      'rollback-production': { priority: 'emergency', timeout: 300 }, // 5 min
      'emergency-patch': { priority: 'emergency', timeout: 600 }, // 10 min
      
      // Gaming & Drop verification
      'rare-drop-verification': { priority: 'medium', timeout: 1800 }, // 30 min
      'ultra-rare-drop': { priority: 'high', timeout: 3600 }, // 1 hour
      'suspicious-drop-pattern': { priority: 'critical', timeout: 7200 }, // 2 hours
      'new-account-rare-drop': { priority: 'high', timeout: 1800 } // 30 min
    };
    
    this.approvers = {
      'matthew': { level: 'admin', email: 'matthew@example.com' },
      'system': { level: 'automated', email: null },
      'emergency': { level: 'emergency', email: 'emergency@example.com' }
    };
    
    console.log('👤 HUMAN APPROVAL SYSTEM INITIALIZED');
    this.loadApprovalHistory();
  }

  /**
   * Request human approval for an action
   */
  async requestApproval(actionType, context = {}) {
    const requestId = this.generateRequestId();
    const config = this.requiresApproval[actionType];
    
    if (!config) {
      console.log(`⚠️  No approval config for: ${actionType}, auto-approving`);
      return { approved: true, reason: 'no-config-required' };
    }
    
    const request = {
      id: requestId,
      actionType,
      context,
      priority: config.priority,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (config.timeout || 3600) * 1000).toISOString(),
      status: 'pending',
      approver: null,
      reason: null
    };
    
    // Auto-reject if configured
    if (config.autoReject && this.shouldAutoReject(context)) {
      request.status = 'rejected';
      request.reason = 'auto-rejected-due-to-failure';
      request.approver = 'system';
      
      this.approvalRequests.set(requestId, request);
      this.logApproval(request);
      
      console.log(`❌ AUTO-REJECTED: ${actionType} (${request.reason})`);
      return { approved: false, reason: request.reason, requestId };
    }
    
    this.approvalRequests.set(requestId, request);
    
    console.log('\n' + '='.repeat(50));
    console.log('👤 HUMAN APPROVAL REQUIRED');
    console.log('='.repeat(50));
    console.log(`🎯 Action: ${actionType}`);
    console.log(`⚡ Priority: ${config.priority.toUpperCase()}`);
    console.log(`⏰ Expires: ${new Date(request.expiresAt).toLocaleString()}`);
    console.log(`🆔 Request ID: ${requestId}`);
    
    if (context.testResults) {
      console.log('\n📊 Test Results:');
      console.log(`  Unit Tests: ${context.testResults.unit?.passed || 0}/${(context.testResults.unit?.passed || 0) + (context.testResults.unit?.failed || 0)}`);
      console.log(`  E2E Tests: ${context.testResults.e2e?.passed || 0}/${(context.testResults.e2e?.passed || 0) + (context.testResults.e2e?.failed || 0)}`);
    }
    
    if (context.deploymentUrl) {
      console.log(`🌐 Review at: ${context.deploymentUrl}`);
    }
    
    if (context.errorCount) {
      console.log(`❌ Errors found: ${context.errorCount}`);
    }
    
    console.log('\n📋 To approve/reject, run:');
    console.log(`  node human-approval-system.js approve ${requestId} "reason"`);
    console.log(`  node human-approval-system.js reject ${requestId} "reason"`);
    console.log('='.repeat(50));
    
    // In real system, would wait for external approval
    // For demo, simulate human decision based on context
    return await this.simulateHumanDecision(request, context);
  }

  /**
   * Process approval/rejection
   */
  async processApproval(requestId, decision, reason, approver = 'matthew') {
    const request = this.approvalRequests.get(requestId);
    
    if (!request) {
      throw new Error(`Approval request ${requestId} not found`);
    }
    
    if (request.status !== 'pending') {
      throw new Error(`Request ${requestId} already ${request.status}`);
    }
    
    // Check if expired
    if (new Date() > new Date(request.expiresAt)) {
      request.status = 'expired';
      request.reason = 'timeout-expired';
      this.logApproval(request);
      throw new Error(`Request ${requestId} expired`);
    }
    
    // Check approver permissions
    if (!this.canApprove(approver, request.priority)) {
      throw new Error(`${approver} cannot approve ${request.priority} priority requests`);
    }
    
    request.status = decision;
    request.reason = reason;
    request.approver = approver;
    request.approvedAt = new Date().toISOString();
    
    this.logApproval(request);
    
    console.log(`${decision === 'approved' ? '✅' : '❌'} Request ${requestId} ${decision.toUpperCase()}`);
    console.log(`👤 Approver: ${approver}`);
    console.log(`💭 Reason: ${reason}`);
    
    return { approved: decision === 'approved', request };
  }

  /**
   * Check if user can approve at priority level
   */
  canApprove(approver, priority) {
    const approverConfig = this.approvers[approver];
    if (!approverConfig) return false;
    
    const levels = {
      'emergency': ['emergency'],
      'critical': ['admin', 'emergency'],
      'high': ['admin', 'emergency'],
      'medium': ['admin', 'emergency'],
      'low': ['admin', 'emergency', 'user']
    };
    
    return levels[priority]?.includes(approverConfig.level) || false;
  }

  /**
   * Auto-reject logic
   */
  shouldAutoReject(context) {
    // Auto-reject if too many test failures
    if (context.testResults) {
      const unitFailRate = context.testResults.unit?.failed / (context.testResults.unit?.passed + context.testResults.unit?.failed) || 0;
      const e2eFailRate = context.testResults.e2e?.failed / (context.testResults.e2e?.passed + context.testResults.e2e?.failed) || 0;
      
      if (unitFailRate > 0.5 || e2eFailRate > 0.7) {
        return true;
      }
    }
    
    // Auto-reject if critical errors
    if (context.errorCount > 10) {
      return true;
    }
    
    return false;
  }

  /**
   * Simulate human decision (for demo)
   */
  async simulateHumanDecision(request, context) {
    console.log('\n🤖 Simulating human decision...');
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let approvalChance = 0.7; // Default 70% approval
    
    // Adjust based on context
    if (context.testResults) {
      const totalTests = (context.testResults.unit?.passed || 0) + (context.testResults.unit?.failed || 0) +
                        (context.testResults.e2e?.passed || 0) + (context.testResults.e2e?.failed || 0);
      const totalPassed = (context.testResults.unit?.passed || 0) + (context.testResults.e2e?.passed || 0);
      const passRate = totalPassed / totalTests;
      
      if (passRate > 0.8) approvalChance = 0.9;
      else if (passRate > 0.6) approvalChance = 0.7;
      else if (passRate > 0.4) approvalChance = 0.4;
      else approvalChance = 0.1;
    }
    
    // Priority adjustments
    if (request.priority === 'critical') approvalChance *= 0.8;
    if (request.priority === 'emergency') approvalChance *= 0.6;
    
    const approved = Math.random() < approvalChance;
    const reason = approved 
      ? 'Tests look good, proceeding with deployment'
      : 'Too many failures, needs investigation';
    
    await this.processApproval(request.id, approved ? 'approved' : 'rejected', reason, 'matthew');
    
    return { approved, reason, requestId: request.id };
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals() {
    const pending = Array.from(this.approvalRequests.values())
      .filter(req => req.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { emergency: 0, critical: 1, high: 2, medium: 3, low: 4 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    
    return pending;
  }

  /**
   * Generate dashboard
   */
  generateDashboard() {
    const pending = this.getPendingApprovals();
    const history = this.approvalHistory.slice(-10);
    
    console.log('\n' + '='.repeat(60));
    console.log('👤 HUMAN APPROVAL DASHBOARD');
    console.log('='.repeat(60));
    
    console.log(`\n📋 Pending Approvals (${pending.length}):`);
    if (pending.length === 0) {
      console.log('  No pending approvals');
    } else {
      pending.forEach(req => {
        const timeLeft = Math.round((new Date(req.expiresAt) - new Date()) / 1000 / 60);
        console.log(`  🆔 ${req.id}: ${req.actionType} (${req.priority}) - ${timeLeft}m left`);
      });
    }
    
    console.log(`\n📈 Recent History (${history.length}):`);
    history.forEach(req => {
      const emoji = req.status === 'approved' ? '✅' : req.status === 'rejected' ? '❌' : '⏰';
      console.log(`  ${emoji} ${req.actionType}: ${req.status} by ${req.approver}`);
    });
    
    console.log('\n💡 Commands:');
    console.log('  node human-approval-system.js dashboard');
    console.log('  node human-approval-system.js approve <id> "reason"');
    console.log('  node human-approval-system.js reject <id> "reason"');
  }

  // Helper methods
  generateRequestId() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  logApproval(request) {
    this.approvalHistory.push({
      ...request,
      loggedAt: new Date().toISOString()
    });
    
    // Save to file
    this.saveApprovalHistory();
  }

  loadApprovalHistory() {
    try {
      if (fs.existsSync('./approval-history.json')) {
        const data = JSON.parse(fs.readFileSync('./approval-history.json', 'utf8'));
        this.approvalHistory = data.history || [];
      }
    } catch (err) {
      console.log('No approval history found, starting fresh');
    }
  }

  saveApprovalHistory() {
    const data = {
      lastUpdated: new Date().toISOString(),
      history: this.approvalHistory
    };
    
    fs.writeFileSync('./approval-history.json', JSON.stringify(data, null, 2));
  }
}

// CLI interface
if (require.main === module) {
  const approvalSystem = new HumanApprovalSystem();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'dashboard') {
    approvalSystem.generateDashboard();
  } else if (args[0] === 'approve' && args[1] && args[2]) {
    approvalSystem.processApproval(args[1], 'approved', args[2])
      .then(() => console.log('✅ Approval processed'))
      .catch(err => console.error('❌ Error:', err.message));
  } else if (args[0] === 'reject' && args[1] && args[2]) {
    approvalSystem.processApproval(args[1], 'rejected', args[2])
      .then(() => console.log('❌ Rejection processed'))
      .catch(err => console.error('❌ Error:', err.message));
  } else {
    console.log('Usage:');
    console.log('  node human-approval-system.js dashboard');
    console.log('  node human-approval-system.js approve <id> "reason"');
    console.log('  node human-approval-system.js reject <id> "reason"');
  }
}

module.exports = HumanApprovalSystem;
/**
 * Event Types - Centralized event type definitions for Sovereign Agents
 */

const AGENT_EVENTS = {
  // Agent Lifecycle
  AGENT_CREATED: 'agent.created',
  AGENT_STARTED: 'agent.started',
  AGENT_STOPPED: 'agent.stopped',
  AGENT_DESTROYED: 'agent.destroyed',
  AGENT_ERROR: 'agent.error',
  
  // Agent State Changes
  AGENT_STATE_CHANGED: 'agent.state.changed',
  AGENT_MOOD_CHANGED: 'agent.mood.changed',
  AGENT_AUTONOMY_CHANGED: 'agent.autonomy.changed',
  
  // Agent Reasoning
  AGENT_THINKING_STARTED: 'agent.thinking.started',
  AGENT_THINKING_COMPLETED: 'agent.thinking.completed',
  AGENT_DECISION_MADE: 'agent.decision.made',
  AGENT_CONFIDENCE_UPDATED: 'agent.confidence.updated',
  
  // Agent Actions
  AGENT_ACTION_REQUESTED: 'agent.action.requested',
  AGENT_ACTION_APPROVED: 'agent.action.approved',
  AGENT_ACTION_REJECTED: 'agent.action.rejected',
  AGENT_ACTION_STARTED: 'agent.action.started',
  AGENT_ACTION_COMPLETED: 'agent.action.completed',
  AGENT_ACTION_FAILED: 'agent.action.failed',
  
  // Agent Communication
  AGENT_MESSAGE_SENT: 'agent.message.sent',
  AGENT_MESSAGE_RECEIVED: 'agent.message.received',
  AGENT_COLLABORATION_STARTED: 'agent.collaboration.started',
  AGENT_COLLABORATION_ENDED: 'agent.collaboration.ended'
};

const DOCUMENT_EVENTS = {
  // Document Processing
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_PARSING_STARTED: 'document.parsing.started',
  DOCUMENT_PARSING_COMPLETED: 'document.parsing.completed',
  DOCUMENT_PARSING_FAILED: 'document.parsing.failed',
  
  // Document Analysis
  DOCUMENT_ANALYSIS_STARTED: 'document.analysis.started',
  DOCUMENT_ANALYSIS_COMPLETED: 'document.analysis.completed',
  DOCUMENT_INSIGHTS_EXTRACTED: 'document.insights.extracted',
  DOCUMENT_REQUIREMENTS_IDENTIFIED: 'document.requirements.identified',
  
  // Template Matching
  TEMPLATE_MATCHING_STARTED: 'template.matching.started',
  TEMPLATE_SELECTED: 'template.selected',
  TEMPLATE_APPLIED: 'template.applied',
  TEMPLATE_CUSTOMIZED: 'template.customized',
  
  // Code Generation
  CODE_GENERATION_STARTED: 'code.generation.started',
  CODE_GENERATION_COMPLETED: 'code.generation.completed',
  CODE_VALIDATION_STARTED: 'code.validation.started',
  CODE_VALIDATION_COMPLETED: 'code.validation.completed'
};

const GIT_EVENTS = {
  // Repository Operations
  REPO_CREATED: 'git.repo.created',
  REPO_CLONED: 'git.repo.cloned',
  REPO_INITIALIZED: 'git.repo.initialized',
  
  // Branch Operations
  BRANCH_CREATED: 'git.branch.created',
  BRANCH_SWITCHED: 'git.branch.switched',
  BRANCH_MERGED: 'git.branch.merged',
  BRANCH_DELETED: 'git.branch.deleted',
  
  // Commit Operations
  COMMIT_CREATED: 'git.commit.created',
  COMMIT_PUSHED: 'git.commit.pushed',
  COMMIT_REVERTED: 'git.commit.reverted',
  
  // Worktree Operations
  WORKTREE_CREATED: 'git.worktree.created',
  WORKTREE_REMOVED: 'git.worktree.removed',
  WORKTREE_SYNCHRONIZED: 'git.worktree.synchronized',
  
  // Pull Request Operations
  PR_CREATED: 'git.pr.created',
  PR_UPDATED: 'git.pr.updated',
  PR_MERGED: 'git.pr.merged',
  PR_CLOSED: 'git.pr.closed'
};

const DEPLOYMENT_EVENTS = {
  // Deployment Lifecycle
  DEPLOYMENT_REQUESTED: 'deployment.requested',
  DEPLOYMENT_STARTED: 'deployment.started',
  DEPLOYMENT_COMPLETED: 'deployment.completed',
  DEPLOYMENT_FAILED: 'deployment.failed',
  DEPLOYMENT_ROLLED_BACK: 'deployment.rolled_back',
  
  // Environment Management
  ENVIRONMENT_CREATED: 'environment.created',
  ENVIRONMENT_UPDATED: 'environment.updated',
  ENVIRONMENT_DESTROYED: 'environment.destroyed',
  
  // Service Management
  SERVICE_STARTED: 'service.started',
  SERVICE_STOPPED: 'service.stopped',
  SERVICE_SCALED: 'service.scaled',
  SERVICE_HEALTH_CHECK: 'service.health_check'
};

const SYSTEM_EVENTS = {
  // System Health
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_ERROR: 'system.error',
  SYSTEM_RECOVERY: 'system.recovery',
  
  // Performance Monitoring
  PERFORMANCE_METRIC: 'performance.metric',
  PERFORMANCE_ALERT: 'performance.alert',
  PERFORMANCE_THRESHOLD_EXCEEDED: 'performance.threshold.exceeded',
  
  // Resource Management
  RESOURCE_ALLOCATED: 'resource.allocated',
  RESOURCE_DEALLOCATED: 'resource.deallocated',
  RESOURCE_EXHAUSTED: 'resource.exhausted',
  
  // Security Events
  SECURITY_ALERT: 'security.alert',
  SECURITY_BREACH_DETECTED: 'security.breach.detected',
  SECURITY_ACCESS_GRANTED: 'security.access.granted',
  SECURITY_ACCESS_DENIED: 'security.access.denied'
};

const HUMAN_EVENTS = {
  // Human Interaction
  HUMAN_APPROVAL_REQUESTED: 'human.approval.requested',
  HUMAN_APPROVAL_GRANTED: 'human.approval.granted',
  HUMAN_APPROVAL_DENIED: 'human.approval.denied',
  HUMAN_FEEDBACK_RECEIVED: 'human.feedback.received',
  
  // Human Override
  HUMAN_OVERRIDE_REQUESTED: 'human.override.requested',
  HUMAN_OVERRIDE_EXECUTED: 'human.override.executed',
  HUMAN_INTERVENTION_REQUIRED: 'human.intervention.required',
  
  // Human Guidance
  HUMAN_GUIDANCE_PROVIDED: 'human.guidance.provided',
  HUMAN_PREFERENCES_UPDATED: 'human.preferences.updated'
};

// Event Schema Definitions
const EVENT_SCHEMAS = {
  [AGENT_EVENTS.AGENT_CREATED]: {
    required: ['agentId', 'name', 'personality'],
    optional: ['autonomyLevel', 'capabilities']
  },
  
  [AGENT_EVENTS.AGENT_DECISION_MADE]: {
    required: ['agentId', 'decision', 'confidence', 'reasoning'],
    optional: ['alternatives', 'dependencies']
  },
  
  [DOCUMENT_EVENTS.DOCUMENT_UPLOADED]: {
    required: ['documentId', 'filename', 'size', 'format'],
    optional: ['metadata', 'tags']
  },
  
  [GIT_EVENTS.COMMIT_CREATED]: {
    required: ['repositoryId', 'commitHash', 'message', 'author'],
    optional: ['files', 'parentCommits']
  },
  
  [DEPLOYMENT_EVENTS.DEPLOYMENT_STARTED]: {
    required: ['deploymentId', 'environment', 'version'],
    optional: ['strategy', 'rollbackPlan']
  },
  
  [HUMAN_EVENTS.HUMAN_APPROVAL_REQUESTED]: {
    required: ['requestId', 'action', 'reason', 'agentId'],
    optional: ['urgency', 'alternatives', 'deadline']
  }
};

// Event Priority Levels
const EVENT_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
};

// Event Categories for filtering and routing
const EVENT_CATEGORIES = {
  AGENT: 'agent',
  DOCUMENT: 'document',
  GIT: 'git',
  DEPLOYMENT: 'deployment',
  SYSTEM: 'system',
  HUMAN: 'human'
};

/**
 * Get event category from event type
 */
function getEventCategory(eventType) {
  if (Object.values(AGENT_EVENTS).includes(eventType)) return EVENT_CATEGORIES.AGENT;
  if (Object.values(DOCUMENT_EVENTS).includes(eventType)) return EVENT_CATEGORIES.DOCUMENT;
  if (Object.values(GIT_EVENTS).includes(eventType)) return EVENT_CATEGORIES.GIT;
  if (Object.values(DEPLOYMENT_EVENTS).includes(eventType)) return EVENT_CATEGORIES.DEPLOYMENT;
  if (Object.values(SYSTEM_EVENTS).includes(eventType)) return EVENT_CATEGORIES.SYSTEM;
  if (Object.values(HUMAN_EVENTS).includes(eventType)) return EVENT_CATEGORIES.HUMAN;
  return 'unknown';
}

/**
 * Get event priority based on type
 */
function getEventPriority(eventType) {
  const criticalEvents = [
    SYSTEM_EVENTS.SYSTEM_ERROR,
    SECURITY_EVENTS.SECURITY_BREACH_DETECTED,
    AGENT_EVENTS.AGENT_ERROR,
    DEPLOYMENT_EVENTS.DEPLOYMENT_FAILED
  ];
  
  const highPriorityEvents = [
    HUMAN_EVENTS.HUMAN_INTERVENTION_REQUIRED,
    SYSTEM_EVENTS.SYSTEM_SHUTDOWN,
    DEPLOYMENT_EVENTS.DEPLOYMENT_STARTED
  ];
  
  if (criticalEvents.includes(eventType)) return EVENT_PRIORITIES.CRITICAL;
  if (highPriorityEvents.includes(eventType)) return EVENT_PRIORITIES.HIGH;
  return EVENT_PRIORITIES.NORMAL;
}

/**
 * Validate event data against schema
 */
function validateEventData(eventType, data) {
  const schema = EVENT_SCHEMAS[eventType];
  if (!schema) return { valid: true, errors: [] };
  
  const errors = [];
  
  // Check required fields
  for (const field of schema.required) {
    if (!data.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  AGENT_EVENTS,
  DOCUMENT_EVENTS,
  GIT_EVENTS,
  DEPLOYMENT_EVENTS,
  SYSTEM_EVENTS,
  HUMAN_EVENTS,
  EVENT_SCHEMAS,
  EVENT_PRIORITIES,
  EVENT_CATEGORIES,
  getEventCategory,
  getEventPriority,
  validateEventData
};
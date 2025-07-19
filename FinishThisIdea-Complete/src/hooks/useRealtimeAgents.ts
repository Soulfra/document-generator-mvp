import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

export interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'working' | 'error' | 'paused';
  currentTask?: {
    id: string;
    type: string;
    progress: number;
    startedAt: Date;
    estimatedCompletion?: Date;
  };
  performance: {
    tasksCompleted: number;
    avgCompletionTime: number;
    successRate: number;
    lastActive: Date;
  };
  capabilities: string[];
  queueLength: number;
  healthScore: number;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  type: 'status' | 'task_update' | 'error' | 'completion' | 'collaboration';
  content: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AgentTeamStats {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  avgResponseTime: number;
  systemHealth: number;
  collaborationEvents: number;
}

export interface UseRealtimeAgentsReturn {
  agents: AgentStatus[];
  teamStats: AgentTeamStats;
  messages: AgentMessage[];
  isConnected: boolean;
  error: string | null;
  getAgent: (id: string) => AgentStatus | undefined;
  getAgentsByType: (type: string) => AgentStatus[];
  getActiveAgents: () => AgentStatus[];
  sendTaskToAgent: (agentId: string, task: any) => void;
  pauseAgent: (agentId: string) => void;
  resumeAgent: (agentId: string) => void;
  restartAgent: (agentId: string) => void;
  subscribeToAgent: (agentId: string, callback: (update: any) => void) => () => void;
  clearMessages: () => void;
}

export const useRealtimeAgents = (): UseRealtimeAgentsReturn => {
  const { isConnected, error, send, subscribe } = useWebSocket({
    autoConnect: true,
    debug: true
  });

  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [teamStats, setTeamStats] = useState<AgentTeamStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalTasks: 0,
    completedTasks: 0,
    avgResponseTime: 0,
    systemHealth: 100,
    collaborationEvents: 0
  });
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  // Subscribe to agent updates
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Agent status updates
    unsubscribers.push(
      subscribe('agent:status', (data) => {
        setAgents(prev => {
          const updated = [...prev];
          const index = updated.findIndex(agent => agent.id === data.id);
          
          if (index >= 0) {
            updated[index] = { ...updated[index], ...data };
          } else {
            updated.push(data);
          }
          
          return updated;
        });
      })
    );

    // Agent registration (new agents coming online)
    unsubscribers.push(
      subscribe('agent:registered', (data) => {
        setAgents(prev => {
          if (!prev.find(agent => agent.id === data.id)) {
            return [...prev, data];
          }
          return prev;
        });
      })
    );

    // Agent deregistration (agents going offline)
    unsubscribers.push(
      subscribe('agent:deregistered', (data) => {
        setAgents(prev => prev.filter(agent => agent.id !== data.id));
      })
    );

    // Task updates
    unsubscribers.push(
      subscribe('agent:task_update', (data) => {
        const message: AgentMessage = {
          id: Math.random().toString(36).substr(2, 9),
          agentId: data.agentId,
          type: 'task_update',
          content: data,
          timestamp: new Date(),
          priority: data.priority || 'medium'
        };
        
        setMessages(prev => [message, ...prev.slice(0, 99)]); // Keep last 100 messages
        
        // Update agent's current task
        setAgents(prev => prev.map(agent => 
          agent.id === data.agentId 
            ? { ...agent, currentTask: data.task }
            : agent
        ));
      })
    );

    // Task completions
    unsubscribers.push(
      subscribe('agent:task_completed', (data) => {
        const message: AgentMessage = {
          id: Math.random().toString(36).substr(2, 9),
          agentId: data.agentId,
          type: 'completion',
          content: data,
          timestamp: new Date(),
          priority: 'medium'
        };
        
        setMessages(prev => [message, ...prev.slice(0, 99)]);
        
        // Update agent performance and clear current task
        setAgents(prev => prev.map(agent => 
          agent.id === data.agentId 
            ? { 
                ...agent, 
                currentTask: undefined,
                status: 'idle',
                performance: {
                  ...agent.performance,
                  tasksCompleted: agent.performance.tasksCompleted + 1,
                  lastActive: new Date()
                }
              }
            : agent
        ));
      })
    );

    // Agent errors
    unsubscribers.push(
      subscribe('agent:error', (data) => {
        const message: AgentMessage = {
          id: Math.random().toString(36).substr(2, 9),
          agentId: data.agentId,
          type: 'error',
          content: data,
          timestamp: new Date(),
          priority: 'high'
        };
        
        setMessages(prev => [message, ...prev.slice(0, 99)]);
        
        // Update agent status
        setAgents(prev => prev.map(agent => 
          agent.id === data.agentId 
            ? { ...agent, status: 'error' as const }
            : agent
        ));
      })
    );

    // Team statistics updates
    unsubscribers.push(
      subscribe('team:stats', (data) => {
        setTeamStats(data);
      })
    );

    // Agent collaboration events
    unsubscribers.push(
      subscribe('agent:collaboration', (data) => {
        const message: AgentMessage = {
          id: Math.random().toString(36).substr(2, 9),
          agentId: data.agentId,
          type: 'collaboration',
          content: data,
          timestamp: new Date(),
          priority: 'medium'
        };
        
        setMessages(prev => [message, ...prev.slice(0, 99)]);
        
        setTeamStats(prev => ({
          ...prev,
          collaborationEvents: prev.collaborationEvents + 1
        }));
      })
    );

    // Request initial data when connected
    if (isConnected) {
      send('agent:list_request', {});
      send('team:stats_request', {});
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, send, isConnected]);

  // Helper functions
  const getAgent = useCallback((id: string): AgentStatus | undefined => {
    return agents.find(agent => agent.id === id);
  }, [agents]);

  const getAgentsByType = useCallback((type: string): AgentStatus[] => {
    return agents.filter(agent => agent.type === type);
  }, [agents]);

  const getActiveAgents = useCallback((): AgentStatus[] => {
    return agents.filter(agent => agent.status === 'working' || agent.status === 'idle');
  }, [agents]);

  const sendTaskToAgent = useCallback((agentId: string, task: any) => {
    send('agent:assign_task', {
      agentId,
      task: {
        ...task,
        id: task.id || Math.random().toString(36).substr(2, 9),
        assignedAt: new Date()
      }
    });
  }, [send]);

  const pauseAgent = useCallback((agentId: string) => {
    send('agent:pause', { agentId });
  }, [send]);

  const resumeAgent = useCallback((agentId: string) => {
    send('agent:resume', { agentId });
  }, [send]);

  const restartAgent = useCallback((agentId: string) => {
    send('agent:restart', { agentId });
  }, [send]);

  const subscribeToAgent = useCallback((agentId: string, callback: (update: any) => void) => {
    return subscribe(`agent:${agentId}:updates`, callback);
  }, [subscribe]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    agents,
    teamStats,
    messages,
    isConnected,
    error,
    getAgent,
    getAgentsByType,
    getActiveAgents,
    sendTaskToAgent,
    pauseAgent,
    resumeAgent,
    restartAgent,
    subscribeToAgent,
    clearMessages
  };
};

export default useRealtimeAgents;
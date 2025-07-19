"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRealtimeAgents = void 0;
const react_1 = require("react");
const useWebSocket_1 = require("./useWebSocket");
const useRealtimeAgents = () => {
    const { isConnected, error, send, subscribe } = (0, useWebSocket_1.useWebSocket)({
        autoConnect: true,
        debug: true
    });
    const [agents, setAgents] = (0, react_1.useState)([]);
    const [teamStats, setTeamStats] = (0, react_1.useState)({
        totalAgents: 0,
        activeAgents: 0,
        totalTasks: 0,
        completedTasks: 0,
        avgResponseTime: 0,
        systemHealth: 100,
        collaborationEvents: 0
    });
    const [messages, setMessages] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const unsubscribers = [];
        unsubscribers.push(subscribe('agent:status', (data) => {
            setAgents(prev => {
                const updated = [...prev];
                const index = updated.findIndex(agent => agent.id === data.id);
                if (index >= 0) {
                    updated[index] = { ...updated[index], ...data };
                }
                else {
                    updated.push(data);
                }
                return updated;
            });
        }));
        unsubscribers.push(subscribe('agent:registered', (data) => {
            setAgents(prev => {
                if (!prev.find(agent => agent.id === data.id)) {
                    return [...prev, data];
                }
                return prev;
            });
        }));
        unsubscribers.push(subscribe('agent:deregistered', (data) => {
            setAgents(prev => prev.filter(agent => agent.id !== data.id));
        }));
        unsubscribers.push(subscribe('agent:task_update', (data) => {
            const message = {
                id: Math.random().toString(36).substr(2, 9),
                agentId: data.agentId,
                type: 'task_update',
                content: data,
                timestamp: new Date(),
                priority: data.priority || 'medium'
            };
            setMessages(prev => [message, ...prev.slice(0, 99)]);
            setAgents(prev => prev.map(agent => agent.id === data.agentId
                ? { ...agent, currentTask: data.task }
                : agent));
        }));
        unsubscribers.push(subscribe('agent:task_completed', (data) => {
            const message = {
                id: Math.random().toString(36).substr(2, 9),
                agentId: data.agentId,
                type: 'completion',
                content: data,
                timestamp: new Date(),
                priority: 'medium'
            };
            setMessages(prev => [message, ...prev.slice(0, 99)]);
            setAgents(prev => prev.map(agent => agent.id === data.agentId
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
                : agent));
        }));
        unsubscribers.push(subscribe('agent:error', (data) => {
            const message = {
                id: Math.random().toString(36).substr(2, 9),
                agentId: data.agentId,
                type: 'error',
                content: data,
                timestamp: new Date(),
                priority: 'high'
            };
            setMessages(prev => [message, ...prev.slice(0, 99)]);
            setAgents(prev => prev.map(agent => agent.id === data.agentId
                ? { ...agent, status: 'error' }
                : agent));
        }));
        unsubscribers.push(subscribe('team:stats', (data) => {
            setTeamStats(data);
        }));
        unsubscribers.push(subscribe('agent:collaboration', (data) => {
            const message = {
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
        }));
        if (isConnected) {
            send('agent:list_request', {});
            send('team:stats_request', {});
        }
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [subscribe, send, isConnected]);
    const getAgent = (0, react_1.useCallback)((id) => {
        return agents.find(agent => agent.id === id);
    }, [agents]);
    const getAgentsByType = (0, react_1.useCallback)((type) => {
        return agents.filter(agent => agent.type === type);
    }, [agents]);
    const getActiveAgents = (0, react_1.useCallback)(() => {
        return agents.filter(agent => agent.status === 'working' || agent.status === 'idle');
    }, [agents]);
    const sendTaskToAgent = (0, react_1.useCallback)((agentId, task) => {
        send('agent:assign_task', {
            agentId,
            task: {
                ...task,
                id: task.id || Math.random().toString(36).substr(2, 9),
                assignedAt: new Date()
            }
        });
    }, [send]);
    const pauseAgent = (0, react_1.useCallback)((agentId) => {
        send('agent:pause', { agentId });
    }, [send]);
    const resumeAgent = (0, react_1.useCallback)((agentId) => {
        send('agent:resume', { agentId });
    }, [send]);
    const restartAgent = (0, react_1.useCallback)((agentId) => {
        send('agent:restart', { agentId });
    }, [send]);
    const subscribeToAgent = (0, react_1.useCallback)((agentId, callback) => {
        return subscribe(`agent:${agentId}:updates`, callback);
    }, [subscribe]);
    const clearMessages = (0, react_1.useCallback)(() => {
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
exports.useRealtimeAgents = useRealtimeAgents;
exports.default = exports.useRealtimeAgents;
//# sourceMappingURL=useRealtimeAgents.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDashboard = void 0;
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const useRealtimeAgents_1 = require("../../hooks/useRealtimeAgents");
const date_fns_1 = require("date-fns");
const TaskAssignmentDialog = ({ open, onClose, agentId, onAssign }) => {
    const [taskType, setTaskType] = (0, react_1.useState)('');
    const [taskData, setTaskData] = (0, react_1.useState)('');
    const [priority, setPriority] = (0, react_1.useState)('medium');
    const [timeout, setTimeout] = (0, react_1.useState)(30);
    const handleAssign = () => {
        try {
            const payload = taskData ? JSON.parse(taskData) : {};
            onAssign(agentId, {
                type: taskType,
                payload,
                priority,
                timeoutMinutes: timeout
            });
            onClose();
        }
        catch (error) {
            alert('Invalid JSON in task data');
        }
    };
    return (<material_1.Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <material_1.DialogTitle>Assign Task to Agent</material_1.DialogTitle>
      <material_1.DialogContent>
        <material_1.Grid container spacing={2} sx={{ mt: 1 }}>
          <material_1.Grid item xs={12}>
            <material_1.TextField fullWidth label="Task Type" value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="e.g., code_analysis, file_cleanup, data_processing"/>
          </material_1.Grid>
          <material_1.Grid item xs={8}>
            <material_1.FormControl fullWidth>
              <material_1.InputLabel>Priority</material_1.InputLabel>
              <material_1.Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                <material_1.MenuItem value="low">Low</material_1.MenuItem>
                <material_1.MenuItem value="medium">Medium</material_1.MenuItem>
                <material_1.MenuItem value="high">High</material_1.MenuItem>
                <material_1.MenuItem value="urgent">Urgent</material_1.MenuItem>
              </material_1.Select>
            </material_1.FormControl>
          </material_1.Grid>
          <material_1.Grid item xs={4}>
            <material_1.TextField fullWidth type="number" label="Timeout (minutes)" value={timeout} onChange={(e) => setTimeout(Number(e.target.value))}/>
          </material_1.Grid>
          <material_1.Grid item xs={12}>
            <material_1.TextField fullWidth multiline rows={4} label="Task Data (JSON)" value={taskData} onChange={(e) => setTaskData(e.target.value)} placeholder='{"inputFile": "example.js", "options": {"removeComments": true}}'/>
          </material_1.Grid>
        </material_1.Grid>
      </material_1.DialogContent>
      <material_1.DialogActions>
        <material_1.Button onClick={onClose}>Cancel</material_1.Button>
        <material_1.Button onClick={handleAssign} variant="contained" disabled={!taskType}>
          Assign Task
        </material_1.Button>
      </material_1.DialogActions>
    </material_1.Dialog>);
};
const AgentCard = ({ agent, onPause, onResume, onRestart, onAssignTask }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'working': return 'primary';
            case 'idle': return 'success';
            case 'error': return 'error';
            case 'paused': return 'warning';
            default: return 'default';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'working': return <material_1.CircularProgress size={16}/>;
            case 'idle': return <icons_material_1.CheckCircle />;
            case 'error': return <icons_material_1.Error />;
            case 'paused': return <icons_material_1.Pause />;
            default: return null;
        }
    };
    return (<material_1.Card sx={{ height: '100%' }}>
      <material_1.CardContent>
        <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <material_1.Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            <icons_material_1.AutoAwesome />
          </material_1.Avatar>
          <material_1.Box sx={{ flexGrow: 1 }}>
            <material_1.Typography variant="h6" component="div">
              {agent.name}
            </material_1.Typography>
            <material_1.Typography variant="body2" color="text.secondary">
              {agent.type}
            </material_1.Typography>
          </material_1.Box>
          <material_1.Chip label={agent.status} color={getStatusColor(agent.status)} size="small" icon={getStatusIcon(agent.status)}/>
        </material_1.Box>

        {agent.currentTask && (<material_1.Box sx={{ mb: 2 }}>
            <material_1.Typography variant="subtitle2" gutterBottom>
              Current Task: {agent.currentTask.type}
            </material_1.Typography>
            <material_1.LinearProgress variant="determinate" value={agent.currentTask.progress} sx={{ mb: 1 }}/>
            <material_1.Typography variant="caption" color="text.secondary">
              Started {(0, date_fns_1.formatDistanceToNow)(new Date(agent.currentTask.startedAt))} ago
            </material_1.Typography>
          </material_1.Box>)}

        <material_1.Grid container spacing={1} sx={{ mb: 2 }}>
          <material_1.Grid item xs={6}>
            <material_1.Typography variant="caption" color="text.secondary">
              Tasks Completed
            </material_1.Typography>
            <material_1.Typography variant="h6">
              {agent.performance.tasksCompleted}
            </material_1.Typography>
          </material_1.Grid>
          <material_1.Grid item xs={6}>
            <material_1.Typography variant="caption" color="text.secondary">
              Success Rate
            </material_1.Typography>
            <material_1.Typography variant="h6">
              {(agent.performance.successRate * 100).toFixed(1)}%
            </material_1.Typography>
          </material_1.Grid>
          <material_1.Grid item xs={6}>
            <material_1.Typography variant="caption" color="text.secondary">
              Queue Length
            </material_1.Typography>
            <material_1.Typography variant="h6">
              {agent.queueLength}
            </material_1.Typography>
          </material_1.Grid>
          <material_1.Grid item xs={6}>
            <material_1.Typography variant="caption" color="text.secondary">
              Health Score
            </material_1.Typography>
            <material_1.Typography variant="h6">
              {agent.healthScore}%
            </material_1.Typography>
          </material_1.Grid>
        </material_1.Grid>

        <material_1.Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {agent.capabilities.slice(0, 3).map((capability) => (<material_1.Chip key={capability} label={capability} size="small" variant="outlined"/>))}
          {agent.capabilities.length > 3 && (<material_1.Chip label={`+${agent.capabilities.length - 3} more`} size="small" variant="outlined"/>)}
        </material_1.Box>

        <material_1.Box sx={{ display: 'flex', gap: 1 }}>
          <material_1.Tooltip title="Assign Task">
            <material_1.IconButton size="small" onClick={() => onAssignTask(agent.id)}>
              <icons_material_1.Assignment />
            </material_1.IconButton>
          </material_1.Tooltip>
          
          {agent.status === 'working' || agent.status === 'idle' ? (<material_1.Tooltip title="Pause Agent">
              <material_1.IconButton size="small" onClick={() => onPause(agent.id)}>
                <icons_material_1.Pause />
              </material_1.IconButton>
            </material_1.Tooltip>) : (<material_1.Tooltip title="Resume Agent">
              <material_1.IconButton size="small" onClick={() => onResume(agent.id)}>
                <icons_material_1.PlayArrow />
              </material_1.IconButton>
            </material_1.Tooltip>)}
          
          <material_1.Tooltip title="Restart Agent">
            <material_1.IconButton size="small" onClick={() => onRestart(agent.id)}>
              <icons_material_1.Refresh />
            </material_1.IconButton>
          </material_1.Tooltip>
        </material_1.Box>
      </material_1.CardContent>
    </material_1.Card>);
};
const AgentDashboard = () => {
    const { agents, teamStats, messages, isConnected, error, getActiveAgents, sendTaskToAgent, pauseAgent, resumeAgent, restartAgent, clearMessages } = (0, useRealtimeAgents_1.useRealtimeAgents)();
    const [taskDialogOpen, setTaskDialogOpen] = (0, react_1.useState)(false);
    const [selectedAgentId, setSelectedAgentId] = (0, react_1.useState)('');
    const [showMessages, setShowMessages] = (0, react_1.useState)(false);
    const handleAssignTask = (agentId) => {
        setSelectedAgentId(agentId);
        setTaskDialogOpen(true);
    };
    const handleTaskAssignment = (agentId, task) => {
        sendTaskToAgent(agentId, task);
    };
    if (!isConnected) {
        return (<material_1.Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <material_1.CircularProgress />
        <material_1.Typography variant="h6" sx={{ ml: 2 }}>
          Connecting to AI Team...
        </material_1.Typography>
      </material_1.Box>);
    }
    if (error) {
        return (<material_1.Alert severity="error" sx={{ m: 2 }}>
        Connection Error: {error}
      </material_1.Alert>);
    }
    return (<material_1.Box sx={{ p: 3 }}>
      
      <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <material_1.Typography variant="h4" component="h1">
          AI Team Dashboard
        </material_1.Typography>
        <material_1.Box sx={{ display: 'flex', gap: 2 }}>
          <material_1.Badge badgeContent={messages.length} color="primary">
            <material_1.Button variant={showMessages ? "contained" : "outlined"} startIcon={<icons_material_1.Message />} onClick={() => setShowMessages(!showMessages)}>
              Messages
            </material_1.Button>
          </material_1.Badge>
          <material_1.Button variant="outlined" startIcon={<icons_material_1.Visibility />} onClick={clearMessages}>
            Clear Messages
          </material_1.Button>
        </material_1.Box>
      </material_1.Box>

      
      <material_1.Grid container spacing={3} sx={{ mb: 3 }}>
        <material_1.Grid item xs={12} sm={6} md={2}>
          <material_1.Card>
            <material_1.CardContent sx={{ textAlign: 'center' }}>
              <icons_material_1.Group color="primary" sx={{ fontSize: 40, mb: 1 }}/>
              <material_1.Typography variant="h4">{teamStats.totalAgents}</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Total Agents
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        
        <material_1.Grid item xs={12} sm={6} md={2}>
          <material_1.Card>
            <material_1.CardContent sx={{ textAlign: 'center' }}>
              <icons_material_1.TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }}/>
              <material_1.Typography variant="h4">{teamStats.activeAgents}</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Active Agents
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        
        <material_1.Grid item xs={12} sm={6} md={2}>
          <material_1.Card>
            <material_1.CardContent sx={{ textAlign: 'center' }}>
              <icons_material_1.Assignment color="info" sx={{ fontSize: 40, mb: 1 }}/>
              <material_1.Typography variant="h4">{teamStats.totalTasks}</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Total Tasks
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        
        <material_1.Grid item xs={12} sm={6} md={2}>
          <material_1.Card>
            <material_1.CardContent sx={{ textAlign: 'center' }}>
              <icons_material_1.CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }}/>
              <material_1.Typography variant="h4">{teamStats.completedTasks}</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Completed
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        
        <material_1.Grid item xs={12} sm={6} md={2}>
          <material_1.Card>
            <material_1.CardContent sx={{ textAlign: 'center' }}>
              <icons_material_1.Speed color="warning" sx={{ fontSize: 40, mb: 1 }}/>
              <material_1.Typography variant="h4">{teamStats.avgResponseTime}s</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Avg Response
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
        
        <material_1.Grid item xs={12} sm={6} md={2}>
          <material_1.Card>
            <material_1.CardContent sx={{ textAlign: 'center' }}>
              <icons_material_1.Timeline color="primary" sx={{ fontSize: 40, mb: 1 }}/>
              <material_1.Typography variant="h4">{teamStats.systemHealth}%</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                System Health
              </material_1.Typography>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>
      </material_1.Grid>

      
      {showMessages && (<material_1.Card sx={{ mb: 3 }}>
          <material_1.CardContent>
            <material_1.Typography variant="h6" gutterBottom>
              Recent Agent Messages
            </material_1.Typography>
            <material_1.List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {messages.map((message) => (<react_1.default.Fragment key={message.id}>
                  <material_1.ListItem>
                    <material_1.ListItemAvatar>
                      <material_1.Avatar sx={{ bgcolor: message.priority === 'high' ? 'error.main' : 'primary.main' }}>
                        {message.type === 'error' ? <icons_material_1.Error /> : <icons_material_1.AutoAwesome />}
                      </material_1.Avatar>
                    </material_1.ListItemAvatar>
                    <material_1.ListItemText primary={`Agent ${message.agentId}: ${message.type}`} secondary={<material_1.Box>
                          <material_1.Typography variant="body2">
                            {JSON.stringify(message.content, null, 2)}
                          </material_1.Typography>
                          <material_1.Typography variant="caption" color="text.secondary">
                            {(0, date_fns_1.format)(message.timestamp, 'HH:mm:ss')}
                          </material_1.Typography>
                        </material_1.Box>}/>
                    <material_1.ListItemSecondaryAction>
                      <material_1.Chip label={message.priority} size="small" color={message.priority === 'high' ? 'error' : 'default'}/>
                    </material_1.ListItemSecondaryAction>
                  </material_1.ListItem>
                  <material_1.Divider />
                </react_1.default.Fragment>))}
              {messages.length === 0 && (<material_1.ListItem>
                  <material_1.ListItemText primary="No messages" secondary="Agent messages will appear here"/>
                </material_1.ListItem>)}
            </material_1.List>
          </material_1.CardContent>
        </material_1.Card>)}

      
      <material_1.Typography variant="h5" gutterBottom>
        Active Agents
      </material_1.Typography>
      
      <material_1.Grid container spacing={3}>
        {agents.map((agent) => (<material_1.Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
            <AgentCard agent={agent} onPause={pauseAgent} onResume={resumeAgent} onRestart={restartAgent} onAssignTask={handleAssignTask}/>
          </material_1.Grid>))}
        
        {agents.length === 0 && (<material_1.Grid item xs={12}>
            <material_1.Card>
              <material_1.CardContent sx={{ textAlign: 'center', py: 4 }}>
                <icons_material_1.AutoAwesome sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}/>
                <material_1.Typography variant="h6" color="text.secondary">
                  No agents available
                </material_1.Typography>
                <material_1.Typography variant="body2" color="text.secondary">
                  Agents will appear here when they come online
                </material_1.Typography>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>)}
      </material_1.Grid>

      
      <TaskAssignmentDialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} agentId={selectedAgentId} onAssign={handleTaskAssignment}/>
    </material_1.Box>);
};
exports.AgentDashboard = AgentDashboard;
exports.default = exports.AgentDashboard;
//# sourceMappingURL=AgentDashboard.js.map
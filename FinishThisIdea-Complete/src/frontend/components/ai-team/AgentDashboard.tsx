import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  Assignment,
  Speed,
  TrendingUp,
  Error,
  CheckCircle,
  Group,
  Timeline,
  Visibility,
  Settings,
  Message,
  AutoAwesome
} from '@mui/icons-material';
import { useRealtimeAgents } from '../../hooks/useRealtimeAgents';
import { formatDistanceToNow, format } from 'date-fns';

interface TaskAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  onAssign: (agentId: string, task: any) => void;
}

const TaskAssignmentDialog: React.FC<TaskAssignmentDialogProps> = ({
  open,
  onClose,
  agentId,
  onAssign
}) => {
  const [taskType, setTaskType] = useState('');
  const [taskData, setTaskData] = useState('');
  const [priority, setPriority] = useState('medium');
  const [timeout, setTimeout] = useState(30);

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
    } catch (error) {
      alert('Invalid JSON in task data');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Assign Task to Agent</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Type"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              placeholder="e.g., code_analysis, file_cleanup, data_processing"
            />
          </Grid>
          <Grid item xs={8}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              type="number"
              label="Timeout (minutes)"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Task Data (JSON)"
              value={taskData}
              onChange={(e) => setTaskData(e.target.value)}
              placeholder='{"inputFile": "example.js", "options": {"removeComments": true}}'
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleAssign} 
          variant="contained"
          disabled={!taskType}
        >
          Assign Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AgentCard: React.FC<{
  agent: any;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRestart: (id: string) => void;
  onAssignTask: (id: string) => void;
}> = ({ agent, onPause, onResume, onRestart, onAssignTask }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'primary';
      case 'idle': return 'success';
      case 'error': return 'error';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <CircularProgress size={16} />;
      case 'idle': return <CheckCircle />;
      case 'error': return <Error />;
      case 'paused': return <Pause />;
      default: return null;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            <AutoAwesome />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {agent.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {agent.type}
            </Typography>
          </Box>
          <Chip
            label={agent.status}
            color={getStatusColor(agent.status)}
            size="small"
            icon={getStatusIcon(agent.status)}
          />
        </Box>

        {agent.currentTask && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Task: {agent.currentTask.type}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={agent.currentTask.progress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Started {formatDistanceToNow(new Date(agent.currentTask.startedAt))} ago
            </Typography>
          </Box>
        )}

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Tasks Completed
            </Typography>
            <Typography variant="h6">
              {agent.performance.tasksCompleted}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Success Rate
            </Typography>
            <Typography variant="h6">
              {(agent.performance.successRate * 100).toFixed(1)}%
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Queue Length
            </Typography>
            <Typography variant="h6">
              {agent.queueLength}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Health Score
            </Typography>
            <Typography variant="h6">
              {agent.healthScore}%
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {agent.capabilities.slice(0, 3).map((capability: string) => (
            <Chip
              key={capability}
              label={capability}
              size="small"
              variant="outlined"
            />
          ))}
          {agent.capabilities.length > 3 && (
            <Chip
              label={`+${agent.capabilities.length - 3} more`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Assign Task">
            <IconButton size="small" onClick={() => onAssignTask(agent.id)}>
              <Assignment />
            </IconButton>
          </Tooltip>
          
          {agent.status === 'working' || agent.status === 'idle' ? (
            <Tooltip title="Pause Agent">
              <IconButton size="small" onClick={() => onPause(agent.id)}>
                <Pause />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Resume Agent">
              <IconButton size="small" onClick={() => onResume(agent.id)}>
                <PlayArrow />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Restart Agent">
            <IconButton size="small" onClick={() => onRestart(agent.id)}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export const AgentDashboard: React.FC = () => {
  const {
    agents,
    teamStats,
    messages,
    isConnected,
    error,
    getActiveAgents,
    sendTaskToAgent,
    pauseAgent,
    resumeAgent,
    restartAgent,
    clearMessages
  } = useRealtimeAgents();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [showMessages, setShowMessages] = useState(false);

  const handleAssignTask = (agentId: string) => {
    setSelectedAgentId(agentId);
    setTaskDialogOpen(true);
  };

  const handleTaskAssignment = (agentId: string, task: any) => {
    sendTaskToAgent(agentId, task);
  };

  if (!isConnected) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Connecting to AI Team...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Connection Error: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          AI Team Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Badge badgeContent={messages.length} color="primary">
            <Button
              variant={showMessages ? "contained" : "outlined"}
              startIcon={<Message />}
              onClick={() => setShowMessages(!showMessages)}
            >
              Messages
            </Button>
          </Badge>
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            onClick={clearMessages}
          >
            Clear Messages
          </Button>
        </Box>
      </Box>

      {/* Team Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Group color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{teamStats.totalAgents}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{teamStats.activeAgents}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{teamStats.totalTasks}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{teamStats.completedTasks}</Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Speed color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{teamStats.avgResponseTime}s</Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Response
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Timeline color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{teamStats.systemHealth}%</Typography>
              <Typography variant="body2" color="text.secondary">
                System Health
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Messages Panel */}
      {showMessages && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Agent Messages
            </Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {messages.map((message) => (
                <React.Fragment key={message.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: message.priority === 'high' ? 'error.main' : 'primary.main' }}>
                        {message.type === 'error' ? <Error /> : <AutoAwesome />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`Agent ${message.agentId}: ${message.type}`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {JSON.stringify(message.content, null, 2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(message.timestamp, 'HH:mm:ss')}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={message.priority}
                        size="small"
                        color={message.priority === 'high' ? 'error' : 'default'}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {messages.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No messages"
                    secondary="Agent messages will appear here"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Agent Grid */}
      <Typography variant="h5" gutterBottom>
        Active Agents
      </Typography>
      
      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
            <AgentCard
              agent={agent}
              onPause={pauseAgent}
              onResume={resumeAgent}
              onRestart={restartAgent}
              onAssignTask={handleAssignTask}
            />
          </Grid>
        ))}
        
        {agents.length === 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <AutoAwesome sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No agents available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agents will appear here when they come online
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Task Assignment Dialog */}
      <TaskAssignmentDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        agentId={selectedAgentId}
        onAssign={handleTaskAssignment}
      />
    </Box>
  );
};

export default AgentDashboard;
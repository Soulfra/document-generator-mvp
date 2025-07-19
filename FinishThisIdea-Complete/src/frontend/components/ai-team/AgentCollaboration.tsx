import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  CircularProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Send,
  ThumbUp,
  ThumbDown,
  Refresh,
  SwapHoriz,
  Compare,
  Timeline,
  AutoAwesome,
  Group,
  Chat,
  Assignment,
  Science,
  Feedback,
  TrendingUp,
  Speed
} from '@mui/icons-material';
import { useRealtimeAgents } from '../../hooks/useRealtimeAgents';
import { formatDistanceToNow } from 'date-fns';

interface AgentOutput {
  id: string;
  agentId: string;
  agentName: string;
  taskType: string;
  content: string;
  confidence: number;
  timestamp: Date;
  feedback?: {
    rating: number;
    comments: string;
  };
  version: number;
  parentId?: string;
}

interface CollaborationSession {
  id: string;
  name: string;
  participants: string[];
  outputs: AgentOutput[];
  currentRound: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`collaboration-tabpanel-${index}`}
    aria-labelledby={`collaboration-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const AgentOutputCard: React.FC<{
  output: AgentOutput;
  onFeedback: (outputId: string, rating: number, comments: string) => void;
  onRefine: (outputId: string) => void;
  canInteract: boolean;
}> = ({ output, onFeedback, onRefine, canInteract }) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(3);
  const [comments, setComments] = useState('');

  const handleSubmitFeedback = () => {
    onFeedback(output.id, rating, comments);
    setFeedbackOpen(false);
    setComments('');
    setRating(3);
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <AutoAwesome />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                {output.agentName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {output.taskType} • v{output.version} • {formatDistanceToNow(output.timestamp)} ago
              </Typography>
            </Box>
            <Chip
              label={`${(output.confidence * 100).toFixed(1)}% confident`}
              size="small"
              color={output.confidence > 0.8 ? 'success' : output.confidence > 0.6 ? 'warning' : 'error'}
            />
          </Box>

          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {output.content}
            </Typography>
          </Paper>

          {output.feedback && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Community Feedback
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${output.feedback.rating}/5 stars`}
                  size="small"
                  color={output.feedback.rating >= 4 ? 'success' : output.feedback.rating >= 3 ? 'warning' : 'error'}
                />
                <Typography variant="body2" color="text.secondary">
                  {output.feedback.comments}
                </Typography>
              </Box>
            </Box>
          )}

          {canInteract && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<Feedback />}
                onClick={() => setFeedbackOpen(true)}
              >
                Feedback
              </Button>
              <Button
                size="small"
                startIcon={<Refresh />}
                onClick={() => onRefine(output.id)}
              >
                Request Refinement
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Provide Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>
              Rate this output (1-5 stars):
            </Typography>
            <Slider
              value={rating}
              onChange={(_, value) => setRating(value as number)}
              min={1}
              max={5}
              step={1}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What did you like or dislike about this output?"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitFeedback} variant="contained">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ComparisonView: React.FC<{
  outputs: AgentOutput[];
  onSelectBest: (outputId: string) => void;
}> = ({ outputs, onSelectBest }) => {
  if (outputs.length < 2) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Need at least 2 outputs to compare
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {outputs.map((output) => (
        <Grid item xs={12} md={6} key={output.id}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                  <AutoAwesome />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    {output.agentName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Confidence: {(output.confidence * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ThumbUp />}
                  onClick={() => onSelectBest(output.id)}
                >
                  Select Best
                </Button>
              </Box>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50', minHeight: 200 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {output.content}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export const AgentCollaboration: React.FC = () => {
  const { agents, isConnected, sendTaskToAgent } = useRealtimeAgents();
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [taskDescription, setTaskDescription] = useState('');
  const [collaborationMode, setCollaborationMode] = useState<'sequential' | 'parallel' | 'debate'>('parallel');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions]);

  const handleCreateSession = () => {
    if (!sessionName || selectedAgents.length < 2 || !taskDescription) {
      return;
    }

    const newSession: CollaborationSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: sessionName,
      participants: selectedAgents,
      outputs: [],
      currentRound: 1,
      status: 'active',
      createdAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession.id);
    
    // Start collaboration by sending task to all selected agents
    selectedAgents.forEach(agentId => {
      sendTaskToAgent(agentId, {
        type: 'collaborative_task',
        payload: {
          sessionId: newSession.id,
          description: taskDescription,
          mode: collaborationMode,
          round: 1
        },
        priority: 'medium'
      });
    });

    // Reset form
    setNewSessionOpen(false);
    setSessionName('');
    setSelectedAgents([]);
    setTaskDescription('');
  };

  const handleFeedback = (outputId: string, rating: number, comments: string) => {
    setSessions(prev => prev.map(session => ({
      ...session,
      outputs: session.outputs.map(output => 
        output.id === outputId 
          ? { ...output, feedback: { rating, comments } }
          : output
      )
    })));
  };

  const handleRefine = (outputId: string) => {
    const session = sessions.find(s => s.id === selectedSession);
    const output = session?.outputs.find(o => o.id === outputId);
    
    if (output) {
      sendTaskToAgent(output.agentId, {
        type: 'refine_output',
        payload: {
          originalOutputId: outputId,
          refinementRequest: 'Please improve this output based on feedback'
        },
        priority: 'high'
      });
    }
  };

  const handleSelectBest = (outputId: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === selectedSession) {
        const bestOutput = session.outputs.find(o => o.id === outputId);
        if (bestOutput) {
          // Start next round with the best output as context
          session.participants.forEach(agentId => {
            sendTaskToAgent(agentId, {
              type: 'collaborative_task',
              payload: {
                sessionId: session.id,
                previousBest: bestOutput,
                round: session.currentRound + 1
              },
              priority: 'medium'
            });
          });
          
          return {
            ...session,
            currentRound: session.currentRound + 1
          };
        }
      }
      return session;
    }));
  };

  const currentSession = sessions.find(s => s.id === selectedSession);
  const currentOutputs = currentSession?.outputs || [];
  const latestRoundOutputs = currentOutputs.filter(o => o.version === currentSession?.currentRound);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          AI Team Collaboration
        </Typography>
        <Button
          variant="contained"
          startIcon={<Group />}
          onClick={() => setNewSessionOpen(true)}
          disabled={!isConnected || agents.length < 2}
        >
          New Collaboration
        </Button>
      </Box>

      {/* Session Selector */}
      {sessions.length > 0 && (
        <FormControl sx={{ mb: 3, minWidth: 200 }}>
          <InputLabel>Active Session</InputLabel>
          <Select
            value={selectedSession}
            label="Active Session"
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.name} ({session.participants.length} agents)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab
            label={
              <Badge badgeContent={currentOutputs.length} color="primary">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chat />
                  Timeline
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Compare />
                Compare
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                Analytics
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {currentSession ? (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {currentSession.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip label={`Round ${currentSession.currentRound}`} />
                  <Chip 
                    label={currentSession.status} 
                    color={currentSession.status === 'active' ? 'success' : 'default'} 
                  />
                  <Chip 
                    label={`${currentSession.participants.length} participants`} 
                    variant="outlined" 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Started {formatDistanceToNow(currentSession.createdAt)} ago
                </Typography>
              </CardContent>
            </Card>

            {currentOutputs.length > 0 ? (
              <Box>
                {currentOutputs.map((output) => (
                  <AgentOutputCard
                    key={output.id}
                    output={output}
                    onFeedback={handleFeedback}
                    onRefine={handleRefine}
                    canInteract={true}
                  />
                ))}
                <div ref={messagesEndRef} />
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AutoAwesome sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Waiting for agent responses...
                </Typography>
                <CircularProgress sx={{ mt: 2 }} />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Group sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No active collaboration session
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new session to start collaborating with AI agents
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ComparisonView
          outputs={latestRoundOutputs}
          onSelectBest={handleSelectBest}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Performance
                </Typography>
                {/* Add analytics charts here */}
                <Typography variant="body2" color="text.secondary">
                  Analytics coming soon...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Agent Contributions
                </Typography>
                {/* Add contribution metrics here */}
                <Typography variant="body2" color="text.secondary">
                  Contribution metrics coming soon...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* New Session Dialog */}
      <Dialog open={newSessionOpen} onClose={() => setNewSessionOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Collaboration Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Session Name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Code Review Session, Creative Brainstorm"
              />
            </Grid>
            
            <Grid item xs={8}>
              <FormControl fullWidth>
                <InputLabel>Collaboration Mode</InputLabel>
                <Select
                  value={collaborationMode}
                  label="Collaboration Mode"
                  onChange={(e) => setCollaborationMode(e.target.value as any)}
                >
                  <MenuItem value="parallel">Parallel (All agents work simultaneously)</MenuItem>
                  <MenuItem value="sequential">Sequential (Agents build on each other)</MenuItem>
                  <MenuItem value="debate">Debate (Agents critique each other)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={4}>
              <Typography variant="subtitle2" gutterBottom>
                Select Agents ({selectedAgents.length} selected)
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {agents.map((agent) => (
                  <Chip
                    key={agent.id}
                    label={agent.name}
                    clickable
                    color={selectedAgents.includes(agent.id) ? 'primary' : 'default'}
                    onClick={() => {
                      setSelectedAgents(prev => 
                        prev.includes(agent.id)
                          ? prev.filter(id => id !== agent.id)
                          : [...prev, agent.id]
                      );
                    }}
                    avatar={<Avatar><AutoAwesome /></Avatar>}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Task Description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe what you want the agents to collaborate on..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSessionOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={!sessionName || selectedAgents.length < 2 || !taskDescription}
          >
            Start Collaboration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentCollaboration;
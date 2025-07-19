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
exports.AgentCollaboration = void 0;
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const useRealtimeAgents_1 = require("../../hooks/useRealtimeAgents");
const date_fns_1 = require("date-fns");
const TabPanel = ({ children, value, index, ...other }) => (<div role="tabpanel" hidden={value !== index} id={`collaboration-tabpanel-${index}`} aria-labelledby={`collaboration-tab-${index}`} {...other}>
    {value === index && (<material_1.Box sx={{ p: 3 }}>
        {children}
      </material_1.Box>)}
  </div>);
const AgentOutputCard = ({ output, onFeedback, onRefine, canInteract }) => {
    const [feedbackOpen, setFeedbackOpen] = (0, react_1.useState)(false);
    const [rating, setRating] = (0, react_1.useState)(3);
    const [comments, setComments] = (0, react_1.useState)('');
    const handleSubmitFeedback = () => {
        onFeedback(output.id, rating, comments);
        setFeedbackOpen(false);
        setComments('');
        setRating(3);
    };
    return (<>
      <material_1.Card sx={{ mb: 2 }}>
        <material_1.CardContent>
          <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <material_1.Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <icons_material_1.AutoAwesome />
            </material_1.Avatar>
            <material_1.Box sx={{ flexGrow: 1 }}>
              <material_1.Typography variant="h6">
                {output.agentName}
              </material_1.Typography>
              <material_1.Typography variant="caption" color="text.secondary">
                {output.taskType} • v{output.version} • {(0, date_fns_1.formatDistanceToNow)(output.timestamp)} ago
              </material_1.Typography>
            </material_1.Box>
            <material_1.Chip label={`${(output.confidence * 100).toFixed(1)}% confident`} size="small" color={output.confidence > 0.8 ? 'success' : output.confidence > 0.6 ? 'warning' : 'error'}/>
          </material_1.Box>

          <material_1.Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <material_1.Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {output.content}
            </material_1.Typography>
          </material_1.Paper>

          {output.feedback && (<material_1.Box sx={{ mb: 2 }}>
              <material_1.Typography variant="subtitle2" gutterBottom>
                Community Feedback
              </material_1.Typography>
              <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <material_1.Chip label={`${output.feedback.rating}/5 stars`} size="small" color={output.feedback.rating >= 4 ? 'success' : output.feedback.rating >= 3 ? 'warning' : 'error'}/>
                <material_1.Typography variant="body2" color="text.secondary">
                  {output.feedback.comments}
                </material_1.Typography>
              </material_1.Box>
            </material_1.Box>)}

          {canInteract && (<material_1.Box sx={{ display: 'flex', gap: 1 }}>
              <material_1.Button size="small" startIcon={<icons_material_1.Feedback />} onClick={() => setFeedbackOpen(true)}>
                Feedback
              </material_1.Button>
              <material_1.Button size="small" startIcon={<icons_material_1.Refresh />} onClick={() => onRefine(output.id)}>
                Request Refinement
              </material_1.Button>
            </material_1.Box>)}
        </material_1.CardContent>
      </material_1.Card>

      <material_1.Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="sm" fullWidth>
        <material_1.DialogTitle>Provide Feedback</material_1.DialogTitle>
        <material_1.DialogContent>
          <material_1.Box sx={{ pt: 2 }}>
            <material_1.Typography gutterBottom>
              Rate this output (1-5 stars):
            </material_1.Typography>
            <material_1.Slider value={rating} onChange={(_, value) => setRating(value)} min={1} max={5} step={1} marks valueLabelDisplay="auto" sx={{ mb: 3 }}/>
            <material_1.TextField fullWidth multiline rows={3} label="Comments (optional)" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="What did you like or dislike about this output?"/>
          </material_1.Box>
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={() => setFeedbackOpen(false)}>Cancel</material_1.Button>
          <material_1.Button onClick={handleSubmitFeedback} variant="contained">
            Submit Feedback
          </material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
    </>);
};
const ComparisonView = ({ outputs, onSelectBest }) => {
    if (outputs.length < 2) {
        return (<material_1.Box sx={{ textAlign: 'center', py: 4 }}>
        <material_1.Typography variant="h6" color="text.secondary">
          Need at least 2 outputs to compare
        </material_1.Typography>
      </material_1.Box>);
    }
    return (<material_1.Grid container spacing={2}>
      {outputs.map((output) => (<material_1.Grid item xs={12} md={6} key={output.id}>
          <material_1.Card sx={{ height: '100%' }}>
            <material_1.CardContent>
              <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <material_1.Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                  <icons_material_1.AutoAwesome />
                </material_1.Avatar>
                <material_1.Box sx={{ flexGrow: 1 }}>
                  <material_1.Typography variant="h6">
                    {output.agentName}
                  </material_1.Typography>
                  <material_1.Typography variant="caption" color="text.secondary">
                    Confidence: {(output.confidence * 100).toFixed(1)}%
                  </material_1.Typography>
                </material_1.Box>
                <material_1.Button size="small" variant="outlined" startIcon={<icons_material_1.ThumbUp />} onClick={() => onSelectBest(output.id)}>
                  Select Best
                </material_1.Button>
              </material_1.Box>
              
              <material_1.Paper sx={{ p: 2, bgcolor: 'grey.50', minHeight: 200 }}>
                <material_1.Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {output.content}
                </material_1.Typography>
              </material_1.Paper>
            </material_1.CardContent>
          </material_1.Card>
        </material_1.Grid>))}
    </material_1.Grid>);
};
const AgentCollaboration = () => {
    const { agents, isConnected, sendTaskToAgent } = (0, useRealtimeAgents_1.useRealtimeAgents)();
    const [activeTab, setActiveTab] = (0, react_1.useState)(0);
    const [sessions, setSessions] = (0, react_1.useState)([]);
    const [selectedSession, setSelectedSession] = (0, react_1.useState)('');
    const [newSessionOpen, setNewSessionOpen] = (0, react_1.useState)(false);
    const [sessionName, setSessionName] = (0, react_1.useState)('');
    const [selectedAgents, setSelectedAgents] = (0, react_1.useState)([]);
    const [taskDescription, setTaskDescription] = (0, react_1.useState)('');
    const [collaborationMode, setCollaborationMode] = (0, react_1.useState)('parallel');
    const messagesEndRef = (0, react_1.useRef)(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [sessions]);
    const handleCreateSession = () => {
        if (!sessionName || selectedAgents.length < 2 || !taskDescription) {
            return;
        }
        const newSession = {
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
        setNewSessionOpen(false);
        setSessionName('');
        setSelectedAgents([]);
        setTaskDescription('');
    };
    const handleFeedback = (outputId, rating, comments) => {
        setSessions(prev => prev.map(session => ({
            ...session,
            outputs: session.outputs.map(output => output.id === outputId
                ? { ...output, feedback: { rating, comments } }
                : output)
        })));
    };
    const handleRefine = (outputId) => {
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
    const handleSelectBest = (outputId) => {
        setSessions(prev => prev.map(session => {
            if (session.id === selectedSession) {
                const bestOutput = session.outputs.find(o => o.id === outputId);
                if (bestOutput) {
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
    return (<material_1.Box sx={{ p: 3 }}>
      
      <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <material_1.Typography variant="h4" component="h1">
          AI Team Collaboration
        </material_1.Typography>
        <material_1.Button variant="contained" startIcon={<icons_material_1.Group />} onClick={() => setNewSessionOpen(true)} disabled={!isConnected || agents.length < 2}>
          New Collaboration
        </material_1.Button>
      </material_1.Box>

      
      {sessions.length > 0 && (<material_1.FormControl sx={{ mb: 3, minWidth: 200 }}>
          <material_1.InputLabel>Active Session</material_1.InputLabel>
          <material_1.Select value={selectedSession} label="Active Session" onChange={(e) => setSelectedSession(e.target.value)}>
            {sessions.map((session) => (<material_1.MenuItem key={session.id} value={session.id}>
                {session.name} ({session.participants.length} agents)
              </material_1.MenuItem>))}
          </material_1.Select>
        </material_1.FormControl>)}

      
      <material_1.Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <material_1.Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <material_1.Tab label={<material_1.Badge badgeContent={currentOutputs.length} color="primary">
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <icons_material_1.Chat />
                  Timeline
                </material_1.Box>
              </material_1.Badge>}/>
          <material_1.Tab label={<material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <icons_material_1.Compare />
                Compare
              </material_1.Box>}/>
          <material_1.Tab label={<material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <icons_material_1.TrendingUp />
                Analytics
              </material_1.Box>}/>
        </material_1.Tabs>
      </material_1.Box>

      
      <TabPanel value={activeTab} index={0}>
        {currentSession ? (<material_1.Box>
            <material_1.Card sx={{ mb: 3 }}>
              <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>
                  {currentSession.name}
                </material_1.Typography>
                <material_1.Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <material_1.Chip label={`Round ${currentSession.currentRound}`}/>
                  <material_1.Chip label={currentSession.status} color={currentSession.status === 'active' ? 'success' : 'default'}/>
                  <material_1.Chip label={`${currentSession.participants.length} participants`} variant="outlined"/>
                </material_1.Box>
                <material_1.Typography variant="body2" color="text.secondary">
                  Started {(0, date_fns_1.formatDistanceToNow)(currentSession.createdAt)} ago
                </material_1.Typography>
              </material_1.CardContent>
            </material_1.Card>

            {currentOutputs.length > 0 ? (<material_1.Box>
                {currentOutputs.map((output) => (<AgentOutputCard key={output.id} output={output} onFeedback={handleFeedback} onRefine={handleRefine} canInteract={true}/>))}
                <div ref={messagesEndRef}/>
              </material_1.Box>) : (<material_1.Box sx={{ textAlign: 'center', py: 4 }}>
                <icons_material_1.AutoAwesome sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}/>
                <material_1.Typography variant="h6" color="text.secondary">
                  Waiting for agent responses...
                </material_1.Typography>
                <material_1.CircularProgress sx={{ mt: 2 }}/>
              </material_1.Box>)}
          </material_1.Box>) : (<material_1.Box sx={{ textAlign: 'center', py: 4 }}>
            <icons_material_1.Group sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}/>
            <material_1.Typography variant="h6" color="text.secondary">
              No active collaboration session
            </material_1.Typography>
            <material_1.Typography variant="body2" color="text.secondary">
              Create a new session to start collaborating with AI agents
            </material_1.Typography>
          </material_1.Box>)}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ComparisonView outputs={latestRoundOutputs} onSelectBest={handleSelectBest}/>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <material_1.Grid container spacing={3}>
          <material_1.Grid item xs={12} md={6}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>
                  Session Performance
                </material_1.Typography>
                
                <material_1.Typography variant="body2" color="text.secondary">
                  Analytics coming soon...
                </material_1.Typography>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
          <material_1.Grid item xs={12} md={6}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>
                  Agent Contributions
                </material_1.Typography>
                
                <material_1.Typography variant="body2" color="text.secondary">
                  Contribution metrics coming soon...
                </material_1.Typography>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
        </material_1.Grid>
      </TabPanel>

      
      <material_1.Dialog open={newSessionOpen} onClose={() => setNewSessionOpen(false)} maxWidth="md" fullWidth>
        <material_1.DialogTitle>Create New Collaboration Session</material_1.DialogTitle>
        <material_1.DialogContent>
          <material_1.Grid container spacing={2} sx={{ mt: 1 }}>
            <material_1.Grid item xs={12}>
              <material_1.TextField fullWidth label="Session Name" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="e.g., Code Review Session, Creative Brainstorm"/>
            </material_1.Grid>
            
            <material_1.Grid item xs={8}>
              <material_1.FormControl fullWidth>
                <material_1.InputLabel>Collaboration Mode</material_1.InputLabel>
                <material_1.Select value={collaborationMode} label="Collaboration Mode" onChange={(e) => setCollaborationMode(e.target.value)}>
                  <material_1.MenuItem value="parallel">Parallel (All agents work simultaneously)</material_1.MenuItem>
                  <material_1.MenuItem value="sequential">Sequential (Agents build on each other)</material_1.MenuItem>
                  <material_1.MenuItem value="debate">Debate (Agents critique each other)</material_1.MenuItem>
                </material_1.Select>
              </material_1.FormControl>
            </material_1.Grid>
            
            <material_1.Grid item xs={4}>
              <material_1.Typography variant="subtitle2" gutterBottom>
                Select Agents ({selectedAgents.length} selected)
              </material_1.Typography>
            </material_1.Grid>
            
            <material_1.Grid item xs={12}>
              <material_1.Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {agents.map((agent) => (<material_1.Chip key={agent.id} label={agent.name} clickable color={selectedAgents.includes(agent.id) ? 'primary' : 'default'} onClick={() => {
                setSelectedAgents(prev => prev.includes(agent.id)
                    ? prev.filter(id => id !== agent.id)
                    : [...prev, agent.id]);
            }} avatar={<material_1.Avatar><icons_material_1.AutoAwesome /></material_1.Avatar>}/>))}
              </material_1.Box>
            </material_1.Grid>
            
            <material_1.Grid item xs={12}>
              <material_1.TextField fullWidth multiline rows={4} label="Task Description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Describe what you want the agents to collaborate on..."/>
            </material_1.Grid>
          </material_1.Grid>
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={() => setNewSessionOpen(false)}>Cancel</material_1.Button>
          <material_1.Button onClick={handleCreateSession} variant="contained" disabled={!sessionName || selectedAgents.length < 2 || !taskDescription}>
            Start Collaboration
          </material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
    </material_1.Box>);
};
exports.AgentCollaboration = AgentCollaboration;
exports.default = exports.AgentCollaboration;
//# sourceMappingURL=AgentCollaboration.js.map
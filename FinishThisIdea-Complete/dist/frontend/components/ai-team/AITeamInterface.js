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
exports.AITeamInterface = void 0;
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const AgentDashboard_1 = require("./AgentDashboard");
const AgentCollaboration_1 = require("./AgentCollaboration");
const useRealtimeAgents_1 = require("../../hooks/useRealtimeAgents");
const TabPanel = ({ children, value, index, ...other }) => (<div role="tabpanel" hidden={value !== index} id={`ai-team-tabpanel-${index}`} aria-labelledby={`ai-team-tab-${index}`} {...other}>
    {value === index && children}
  </div>);
const PerformanceMonitor = () => {
    const { teamStats, agents } = (0, useRealtimeAgents_1.useRealtimeAgents)();
    const [performanceAlerts, setPerformanceAlerts] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const alerts = [];
        if (teamStats.systemHealth < 80) {
            alerts.push(`System health is at ${teamStats.systemHealth}%`);
        }
        const overloadedAgents = agents.filter(agent => agent.queueLength > 10);
        if (overloadedAgents.length > 0) {
            alerts.push(`${overloadedAgents.length} agent(s) have high queue length`);
        }
        const errorAgents = agents.filter(agent => agent.status === 'error');
        if (errorAgents.length > 0) {
            alerts.push(`${errorAgents.length} agent(s) in error state`);
        }
        if (teamStats.avgResponseTime > 30) {
            alerts.push(`Average response time is ${teamStats.avgResponseTime}s`);
        }
        setPerformanceAlerts(alerts);
    }, [teamStats, agents]);
    return (<>
      {performanceAlerts.map((alert, index) => (<material_1.Alert key={index} severity="warning" sx={{ mb: 1 }} onClose={() => {
                setPerformanceAlerts(prev => prev.filter((_, i) => i !== index));
            }}>
          {alert}
        </material_1.Alert>))}
    </>);
};
const ConnectionStatus = ({ isConnected, error }) => {
    const [showStatus, setShowStatus] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!isConnected || error) {
            setShowStatus(true);
        }
        else {
            const timer = setTimeout(() => setShowStatus(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isConnected, error]);
    if (!showStatus)
        return null;
    return (<material_1.Snackbar open={showStatus} autoHideDuration={error ? null : 3000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <material_1.Alert severity={isConnected ? 'success' : 'error'} onClose={() => setShowStatus(false)}>
        {error
            ? `Connection Error: ${error}`
            : isConnected
                ? 'Connected to AI Team'
                : 'Connecting to AI Team...'}
      </material_1.Alert>
    </material_1.Snackbar>);
};
const AITeamInterface = () => {
    const theme = (0, material_1.useTheme)();
    const isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down('md'));
    const [activeTab, setActiveTab] = (0, react_1.useState)(0);
    const [showPerformanceMonitor, setShowPerformanceMonitor] = (0, react_1.useState)(false);
    const { agents, teamStats, messages, isConnected, error } = (0, useRealtimeAgents_1.useRealtimeAgents)();
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    const getTabBadgeContent = (tabIndex) => {
        switch (tabIndex) {
            case 0:
                return agents.filter(agent => agent.status === 'working').length;
            case 1:
                return teamStats.collaborationEvents;
            case 2:
                const issues = agents.filter(agent => agent.status === 'error' ||
                    agent.queueLength > 10 ||
                    agent.healthScore < 80).length;
                return issues > 0 ? issues : undefined;
            default:
                return undefined;
        }
    };
    const getTabColor = (tabIndex) => {
        if (tabIndex === 2) {
            const issues = getTabBadgeContent(2);
            return issues ? 'error' : 'default';
        }
        return 'primary';
    };
    return (<material_1.Container maxWidth="xl">
      
      <ConnectionStatus isConnected={isConnected} error={error}/>

      
      {showPerformanceMonitor && (<material_1.Box sx={{ mb: 2 }}>
          <PerformanceMonitor />
        </material_1.Box>)}

      
      <material_1.Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <material_1.Tabs value={activeTab} onChange={handleTabChange} variant={isMobile ? 'scrollable' : 'standard'} scrollButtons={isMobile ? 'auto' : false} allowScrollButtonsMobile>
          <material_1.Tab label={<material_1.Badge badgeContent={getTabBadgeContent(0)} color={getTabColor(0)} showZero={false}>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <icons_material_1.Dashboard />
                  {!isMobile && 'Dashboard'}
                </material_1.Box>
              </material_1.Badge>}/>
          <material_1.Tab label={<material_1.Badge badgeContent={getTabBadgeContent(1)} color={getTabColor(1)} showZero={false}>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <icons_material_1.Group />
                  {!isMobile && 'Collaboration'}
                </material_1.Box>
              </material_1.Badge>}/>
          <material_1.Tab label={<material_1.Badge badgeContent={getTabBadgeContent(2)} color={getTabColor(2)} showZero={false}>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <icons_material_1.Timeline />
                  {!isMobile && 'Performance'}
                </material_1.Box>
              </material_1.Badge>}/>
        </material_1.Tabs>
      </material_1.Box>

      
      <TabPanel value={activeTab} index={0}>
        <AgentDashboard_1.AgentDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <AgentCollaboration_1.AgentCollaboration />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <material_1.Box sx={{ p: 3 }}>
          <material_1.Alert severity="info" sx={{ mb: 3 }}>
            Performance monitoring dashboard coming soon. This will include detailed metrics,
            resource usage charts, and optimization recommendations.
          </material_1.Alert>
          
          
          <material_1.Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            
            <material_1.Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <icons_material_1.Speed sx={{ mr: 1 }}/>
                System Health
              </material_1.Box>
              <material_1.Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.systemHealth}%
              </material_1.Box>
            </material_1.Box>

            
            <material_1.Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <icons_material_1.Group sx={{ mr: 1 }}/>
                Agent Utilization
              </material_1.Box>
              <material_1.Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.totalAgents > 0
            ? Math.round((teamStats.activeAgents / teamStats.totalAgents) * 100)
            : 0}%
              </material_1.Box>
            </material_1.Box>

            
            <material_1.Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <icons_material_1.Timeline sx={{ mr: 1 }}/>
                Completion Rate
              </material_1.Box>
              <material_1.Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.totalTasks > 0
            ? Math.round((teamStats.completedTasks / teamStats.totalTasks) * 100)
            : 0}%
              </material_1.Box>
            </material_1.Box>

            
            <material_1.Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <icons_material_1.Speed sx={{ mr: 1 }}/>
                Avg Response Time
              </material_1.Box>
              <material_1.Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.avgResponseTime}s
              </material_1.Box>
            </material_1.Box>
          </material_1.Box>
        </material_1.Box>
      </TabPanel>

      
      <material_1.Zoom in={!showPerformanceMonitor}>
        <material_1.Fab color="secondary" aria-label="performance monitor" sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
        }} onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}>
          <icons_material_1.Notifications />
        </material_1.Fab>
      </material_1.Zoom>

      
      {isConnected && (<material_1.Box sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
                p: 1,
                display: 'flex',
                justifyContent: 'center',
                gap: 3,
                zIndex: theme.zIndex.appBar - 1
            }}>
          <material_1.Box sx={{ textAlign: 'center' }}>
            <material_1.Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {teamStats.activeAgents}
            </material_1.Box>
            <material_1.Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Active Agents
            </material_1.Box>
          </material_1.Box>
          
          <material_1.Box sx={{ textAlign: 'center' }}>
            <material_1.Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {teamStats.totalTasks}
            </material_1.Box>
            <material_1.Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Total Tasks
            </material_1.Box>
          </material_1.Box>
          
          <material_1.Box sx={{ textAlign: 'center' }}>
            <material_1.Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {teamStats.systemHealth}%
            </material_1.Box>
            <material_1.Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Health
            </material_1.Box>
          </material_1.Box>
          
          <material_1.Box sx={{ textAlign: 'center' }}>
            <material_1.Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {messages.length}
            </material_1.Box>
            <material_1.Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Messages
            </material_1.Box>
          </material_1.Box>
        </material_1.Box>)}
    </material_1.Container>);
};
exports.AITeamInterface = AITeamInterface;
exports.default = exports.AITeamInterface;
//# sourceMappingURL=AITeamInterface.js.map
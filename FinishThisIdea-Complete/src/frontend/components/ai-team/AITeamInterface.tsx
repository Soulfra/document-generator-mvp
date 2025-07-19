import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard,
  Group,
  Timeline,
  Settings,
  Notifications,
  Speed
} from '@mui/icons-material';
import { AgentDashboard } from './AgentDashboard';
import { AgentCollaboration } from './AgentCollaboration';
import { useRealtimeAgents } from '../../hooks/useRealtimeAgents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`ai-team-tabpanel-${index}`}
    aria-labelledby={`ai-team-tab-${index}`}
    {...other}
  >
    {value === index && children}
  </div>
);

const PerformanceMonitor: React.FC = () => {
  const { teamStats, agents } = useRealtimeAgents();
  const [performanceAlerts, setPerformanceAlerts] = useState<string[]>([]);

  useEffect(() => {
    const alerts: string[] = [];

    // Check system health
    if (teamStats.systemHealth < 80) {
      alerts.push(`System health is at ${teamStats.systemHealth}%`);
    }

    // Check for overloaded agents
    const overloadedAgents = agents.filter(agent => agent.queueLength > 10);
    if (overloadedAgents.length > 0) {
      alerts.push(`${overloadedAgents.length} agent(s) have high queue length`);
    }

    // Check for error states
    const errorAgents = agents.filter(agent => agent.status === 'error');
    if (errorAgents.length > 0) {
      alerts.push(`${errorAgents.length} agent(s) in error state`);
    }

    // Check response time
    if (teamStats.avgResponseTime > 30) {
      alerts.push(`Average response time is ${teamStats.avgResponseTime}s`);
    }

    setPerformanceAlerts(alerts);
  }, [teamStats, agents]);

  return (
    <>
      {performanceAlerts.map((alert, index) => (
        <Alert
          key={index}
          severity="warning"
          sx={{ mb: 1 }}
          onClose={() => {
            setPerformanceAlerts(prev => prev.filter((_, i) => i !== index));
          }}
        >
          {alert}
        </Alert>
      ))}
    </>
  );
};

const ConnectionStatus: React.FC<{ isConnected: boolean; error: string | null }> = ({
  isConnected,
  error
}) => {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!isConnected || error) {
      setShowStatus(true);
    } else {
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, error]);

  if (!showStatus) return null;

  return (
    <Snackbar
      open={showStatus}
      autoHideDuration={error ? null : 3000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={isConnected ? 'success' : 'error'}
        onClose={() => setShowStatus(false)}
      >
        {error
          ? `Connection Error: ${error}`
          : isConnected
          ? 'Connected to AI Team'
          : 'Connecting to AI Team...'
        }
      </Alert>
    </Snackbar>
  );
};

export const AITeamInterface: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  const {
    agents,
    teamStats,
    messages,
    isConnected,
    error
  } = useRealtimeAgents();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getTabBadgeContent = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Dashboard
        return agents.filter(agent => agent.status === 'working').length;
      case 1: // Collaboration
        return teamStats.collaborationEvents;
      case 2: // Performance
        const issues = agents.filter(agent => 
          agent.status === 'error' || 
          agent.queueLength > 10 || 
          agent.healthScore < 80
        ).length;
        return issues > 0 ? issues : undefined;
      default:
        return undefined;
    }
  };

  const getTabColor = (tabIndex: number) => {
    if (tabIndex === 2) {
      const issues = getTabBadgeContent(2);
      return issues ? 'error' : 'default';
    }
    return 'primary';
  };

  return (
    <Container maxWidth="xl">
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} error={error} />

      {/* Performance Alerts */}
      {showPerformanceMonitor && (
        <Box sx={{ mb: 2 }}>
          <PerformanceMonitor />
        </Box>
      )}

      {/* Main Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
        >
          <Tab
            label={
              <Badge
                badgeContent={getTabBadgeContent(0)}
                color={getTabColor(0)}
                showZero={false}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Dashboard />
                  {!isMobile && 'Dashboard'}
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={getTabBadgeContent(1)}
                color={getTabColor(1)}
                showZero={false}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group />
                  {!isMobile && 'Collaboration'}
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={getTabBadgeContent(2)}
                color={getTabColor(2)}
                showZero={false}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline />
                  {!isMobile && 'Performance'}
                </Box>
              </Badge>
            }
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <AgentDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <AgentCollaboration />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Performance monitoring dashboard coming soon. This will include detailed metrics,
            resource usage charts, and optimization recommendations.
          </Alert>
          
          {/* Performance Summary Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            {/* System Health */}
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ mr: 1 }} />
                System Health
              </Box>
              <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.systemHealth}%
              </Box>
            </Box>

            {/* Agent Utilization */}
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Group sx={{ mr: 1 }} />
                Agent Utilization
              </Box>
              <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.totalAgents > 0 
                  ? Math.round((teamStats.activeAgents / teamStats.totalAgents) * 100)
                  : 0}%
              </Box>
            </Box>

            {/* Task Completion Rate */}
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timeline sx={{ mr: 1 }} />
                Completion Rate
              </Box>
              <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.totalTasks > 0 
                  ? Math.round((teamStats.completedTasks / teamStats.totalTasks) * 100)
                  : 0}%
              </Box>
            </Box>

            {/* Average Response Time */}
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ mr: 1 }} />
                Avg Response Time
              </Box>
              <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {teamStats.avgResponseTime}s
              </Box>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Floating Action Button for Performance Monitor */}
      <Zoom in={!showPerformanceMonitor}>
        <Fab
          color="secondary"
          aria-label="performance monitor"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
        >
          <Notifications />
        </Fab>
      </Zoom>

      {/* Quick Stats Footer */}
      {isConnected && (
        <Box
          sx={{
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
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {teamStats.activeAgents}
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Active Agents
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {teamStats.totalTasks}
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Total Tasks
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {teamStats.systemHealth}%
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Health
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {messages.length}
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Messages
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AITeamInterface;
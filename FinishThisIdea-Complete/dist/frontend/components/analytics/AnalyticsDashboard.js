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
exports.AnalyticsDashboard = void 0;
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const recharts_1 = require("recharts");
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const AnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = (0, react_1.useState)('24h');
    const [data, setData] = (0, react_1.useState)(null);
    const [realtimeData, setRealtimeData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [autoRefresh, setAutoRefresh] = (0, react_1.useState)(true);
    const [refreshInterval, setRefreshInterval] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetchAnalyticsData();
        if (autoRefresh) {
            startAutoRefresh();
        }
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [timeRange, autoRefresh]);
    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const [analyticsResponse, realtimeResponse] = await Promise.all([
                fetch(`/api/analytics/dashboard/overview?timeRange=${timeRange}`),
                fetch('/api/analytics/realtime')
            ]);
            if (analyticsResponse.ok && realtimeResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                const realtimeData = await realtimeResponse.json();
                setData(analyticsData.data);
                setRealtimeData(realtimeData.data);
            }
        }
        catch (error) {
            console.error('Failed to fetch analytics data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const startAutoRefresh = () => {
        const interval = setInterval(() => {
            fetchAnalyticsData();
        }, 30000);
        setRefreshInterval(interval);
    };
    const stopAutoRefresh = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            setRefreshInterval(null);
        }
    };
    const handleAutoRefreshToggle = (event) => {
        const enabled = event.target.checked;
        setAutoRefresh(enabled);
        if (enabled) {
            startAutoRefresh();
        }
        else {
            stopAutoRefresh();
        }
    };
    const handleRefresh = () => {
        fetchAnalyticsData();
    };
    const handleExport = () => {
        console.log('Exporting analytics data...');
    };
    if (loading && !data) {
        return (<material_1.Box sx={{ width: '100%', mt: 2 }}>
        <material_1.LinearProgress />
        <material_1.Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Analytics Dashboard...
        </material_1.Typography>
      </material_1.Box>);
    }
    return (<material_1.Box sx={{ p: 3 }}>
      
      <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <material_1.Typography variant="h4" component="h1">
          Analytics Dashboard
        </material_1.Typography>
        <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <material_1.FormControl size="small" sx={{ minWidth: 120 }}>
            <material_1.InputLabel>Time Range</material_1.InputLabel>
            <material_1.Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
              <material_1.MenuItem value="1h">Last Hour</material_1.MenuItem>
              <material_1.MenuItem value="24h">Last 24 Hours</material_1.MenuItem>
              <material_1.MenuItem value="7d">Last 7 Days</material_1.MenuItem>
              <material_1.MenuItem value="30d">Last 30 Days</material_1.MenuItem>
              <material_1.MenuItem value="90d">Last 90 Days</material_1.MenuItem>
            </material_1.Select>
          </material_1.FormControl>
          <material_1.FormControlLabel control={<material_1.Switch checked={autoRefresh} onChange={handleAutoRefreshToggle} size="small"/>} label="Auto Refresh"/>
          <material_1.Tooltip title="Refresh Data">
            <material_1.IconButton onClick={handleRefresh} disabled={loading}>
              <icons_material_1.Refresh />
            </material_1.IconButton>
          </material_1.Tooltip>
          <material_1.Tooltip title="Export Data">
            <material_1.IconButton onClick={handleExport}>
              <icons_material_1.Download />
            </material_1.IconButton>
          </material_1.Tooltip>
        </material_1.Box>
      </material_1.Box>

      
      {realtimeData && (<material_1.Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
          <material_1.CardContent>
            <material_1.Typography variant="h6" gutterBottom>
              Real-time Activity
            </material_1.Typography>
            <material_1.Grid container spacing={2}>
              <material_1.Grid item xs={6} md={3}>
                <material_1.Box sx={{ textAlign: 'center' }}>
                  <material_1.Typography variant="h4" color="primary">
                    {realtimeData.activeUsers}
                  </material_1.Typography>
                  <material_1.Typography variant="body2" color="textSecondary">
                    Active Users
                  </material_1.Typography>
                </material_1.Box>
              </material_1.Grid>
              <material_1.Grid item xs={6} md={3}>
                <material_1.Box sx={{ textAlign: 'center' }}>
                  <material_1.Typography variant="h4" color="secondary">
                    {realtimeData.activeSessions}
                  </material_1.Typography>
                  <material_1.Typography variant="body2" color="textSecondary">
                    Active Sessions
                  </material_1.Typography>
                </material_1.Box>
              </material_1.Grid>
              <material_1.Grid item xs={12} md={6}>
                <material_1.Typography variant="subtitle2" gutterBottom>
                  Recent Events
                </material_1.Typography>
                <material_1.Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                  {realtimeData.recentEvents.slice(0, 5).map((event, index) => (<material_1.Typography key={index} variant="caption" display="block">
                      {new Date(event.timestamp).toLocaleTimeString()}: {event.event}
                    </material_1.Typography>))}
                </material_1.Box>
              </material_1.Grid>
            </material_1.Grid>
          </material_1.CardContent>
        </material_1.Card>)}

      
      {data && (<material_1.Grid container spacing={3} sx={{ mb: 3 }}>
          <material_1.Grid item xs={12} sm={6} md={3}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <material_1.Box>
                    <material_1.Typography color="textSecondary" gutterBottom>
                      Total Users
                    </material_1.Typography>
                    <material_1.Typography variant="h4">
                      {data.totalUsers.toLocaleString()}
                    </material_1.Typography>
                  </material_1.Box>
                  <icons_material_1.People color="primary" sx={{ fontSize: 40 }}/>
                </material_1.Box>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
          
          <material_1.Grid item xs={12} sm={6} md={3}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <material_1.Box>
                    <material_1.Typography color="textSecondary" gutterBottom>
                      Active Users
                    </material_1.Typography>
                    <material_1.Typography variant="h4">
                      {data.activeUsers.toLocaleString()}
                    </material_1.Typography>
                  </material_1.Box>
                  <icons_material_1.TrendingUp color="success" sx={{ fontSize: 40 }}/>
                </material_1.Box>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
          
          <material_1.Grid item xs={12} sm={6} md={3}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <material_1.Box>
                    <material_1.Typography color="textSecondary" gutterBottom>
                      Total Sessions
                    </material_1.Typography>
                    <material_1.Typography variant="h4">
                      {data.totalSessions.toLocaleString()}
                    </material_1.Typography>
                  </material_1.Box>
                  <icons_material_1.Visibility color="info" sx={{ fontSize: 40 }}/>
                </material_1.Box>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
          
          <material_1.Grid item xs={12} sm={6} md={3}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <material_1.Box>
                    <material_1.Typography color="textSecondary" gutterBottom>
                      Avg. Session Duration
                    </material_1.Typography>
                    <material_1.Typography variant="h4">
                      {Math.round(data.avgSessionDuration / 60)}m
                    </material_1.Typography>
                  </material_1.Box>
                  <icons_material_1.Timer color="warning" sx={{ fontSize: 40 }}/>
                </material_1.Box>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
        </material_1.Grid>)}

      
      {data && (<material_1.Grid container spacing={3} sx={{ mb: 3 }}>
          
          <material_1.Grid item xs={12} md={8}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>
                  User Growth
                </material_1.Typography>
                <recharts_1.ResponsiveContainer width="100%" height={300}>
                  <recharts_1.AreaChart data={data.userGrowth}>
                    <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                    <recharts_1.XAxis dataKey="date"/>
                    <recharts_1.YAxis />
                    <recharts_1.Tooltip />
                    <recharts_1.Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6}/>
                  </recharts_1.AreaChart>
                </recharts_1.ResponsiveContainer>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>

          
          <material_1.Grid item xs={12} md={4}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>
                  Top Events
                </material_1.Typography>
                <recharts_1.ResponsiveContainer width="100%" height={300}>
                  <recharts_1.PieChart>
                    <recharts_1.Pie data={data.topEvents} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="count">
                      {data.topEvents.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                    </recharts_1.Pie>
                    <recharts_1.Tooltip />
                  </recharts_1.PieChart>
                </recharts_1.ResponsiveContainer>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
        </material_1.Grid>)}

      
      {data && (<material_1.Grid container spacing={3}>
          
          <material_1.Grid item xs={12} md={6}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>
                  Top Pages
                </material_1.Typography>
                <material_1.TableContainer>
                  <material_1.Table size="small">
                    <material_1.TableHead>
                      <material_1.TableRow>
                        <material_1.TableCell>Page</material_1.TableCell>
                        <material_1.TableCell align="right">Views</material_1.TableCell>
                      </material_1.TableRow>
                    </material_1.TableHead>
                    <material_1.TableBody>
                      {data.topPages.map((page, index) => (<material_1.TableRow key={index}>
                          <material_1.TableCell component="th" scope="row">
                            {page.page}
                          </material_1.TableCell>
                          <material_1.TableCell align="right">
                            {page.views.toLocaleString()}
                          </material_1.TableCell>
                        </material_1.TableRow>))}
                    </material_1.TableBody>
                  </material_1.Table>
                </material_1.TableContainer>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>

          
          <material_1.Grid item xs={12} md={6}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>
                  Feature Usage
                </material_1.Typography>
                <recharts_1.ResponsiveContainer width="100%" height={250}>
                  <recharts_1.BarChart data={data.featureUsage} layout="horizontal">
                    <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                    <recharts_1.XAxis type="number"/>
                    <recharts_1.YAxis dataKey="feature" type="category" width={100}/>
                    <recharts_1.Tooltip />
                    <recharts_1.Bar dataKey="usage" fill="#8884d8"/>
                  </recharts_1.BarChart>
                </recharts_1.ResponsiveContainer>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>
        </material_1.Grid>)}

      {loading && (<material_1.Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <material_1.LinearProgress />
        </material_1.Box>)}
    </material_1.Box>);
};
exports.AnalyticsDashboard = AnalyticsDashboard;
exports.default = exports.AnalyticsDashboard;
//# sourceMappingURL=AnalyticsDashboard.js.map
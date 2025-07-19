#!/usr/bin/env node

/**
 * FINISHTHISIDEA ANALYTICS DASHBOARD
 * Real-time visualization of platform metrics, revenue, and user activity
 * Adapted from Soulfra AI Economy Dashboard
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { prisma } = require('../utils/database');
const { logger } = require('../utils/logger');

class AnalyticsDashboard {
    constructor(port = 8889) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIO(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.setupRoutes();
        this.setupWebSocket();
        this.startPeriodicUpdates();
    }
    
    async getLiveData() {
        try {
            // Platform statistics
            const [
                totalJobs,
                completedJobs,
                failedJobs,
                processingJobs,
                totalRevenue,
                todayRevenue,
                totalUploads,
                activeUsers
            ] = await Promise.all([
                prisma.job.count(),
                prisma.job.count({ where: { status: 'COMPLETED' } }),
                prisma.job.count({ where: { status: 'FAILED' } }),
                prisma.job.count({ where: { status: 'PROCESSING' } }),
                prisma.payment.aggregate({
                    where: { status: 'SUCCEEDED' },
                    _sum: { amount: true }
                }),
                prisma.payment.aggregate({
                    where: { 
                        status: 'SUCCEEDED',
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    },
                    _sum: { amount: true }
                }),
                prisma.job.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                // For now, count unique session-based users from total uploads
                prisma.job.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                })
            ]);

            // Recent jobs with details
            const recentJobs = await prisma.job.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    payment: true,
                    bundle: true
                }
            });

            // Service usage statistics - simplified
            const serviceStats = await prisma.job.findMany({
                select: {
                    type: true,
                    processingStartedAt: true,
                    processingEndedAt: true
                }
            }).then(jobs => {
                const stats = {};
                jobs.forEach(job => {
                    if (!stats[job.type]) {
                        stats[job.type] = { count: 0, totalTime: 0 };
                    }
                    stats[job.type].count++;
                    
                    // Calculate processing time if both timestamps exist
                    if (job.processingStartedAt && job.processingEndedAt) {
                        const processingTime = new Date(job.processingEndedAt) - new Date(job.processingStartedAt);
                        stats[job.type].totalTime += processingTime;
                    }
                });
                return Object.entries(stats).map(([type, data]) => ({
                    service: type,
                    count: data.count,
                    avgProcessingTime: data.count > 0 ? (data.totalTime / data.count / 1000) : 0 // Convert to seconds
                }));
            });

            // Revenue by service - simplified
            const revenueByService = [];

            // Hourly metrics for the last 24 hours
            const hourlyMetrics = await this.getHourlyMetrics();

            return {
                timestamp: new Date().toISOString(),
                platform: {
                    totalJobs,
                    completedJobs,
                    failedJobs,
                    processingJobs,
                    successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : 0,
                    totalRevenue: (totalRevenue._sum.amount || 0) / 100, // Convert from cents
                    todayRevenue: (todayRevenue._sum.amount || 0) / 100,
                    totalUploads,
                    activeUsers: activeUsers.length
                },
                recentJobs: recentJobs.map(job => ({
                    id: job.id,
                    type: job.type,
                    status: job.status,
                    fileName: job.originalFileName,
                    createdAt: job.createdAt,
                    processingTime: job.processingTime,
                    revenue: job.payment?.amount ? (job.payment.amount / 100) : 0,
                    bundleId: job.bundleId
                })),
                serviceStats: serviceStats.map(stat => ({
                    service: stat.type,
                    count: stat._count.type,
                    avgProcessingTime: stat._avg.processingTime || 0
                })),
                hourlyMetrics
            };
        } catch (error) {
            logger.error('Failed to get analytics data', { error });
            return {
                timestamp: new Date().toISOString(),
                error: 'Failed to load analytics data'
            };
        }
    }

    async getHourlyMetrics() {
        const hours = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
            const hourStart = new Date(now.getTime() - (i * 60 * 60 * 1000));
            hourStart.setMinutes(0, 0, 0);
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
            
            const [jobsCount, revenue] = await Promise.all([
                prisma.job.count({
                    where: {
                        createdAt: {
                            gte: hourStart,
                            lt: hourEnd
                        }
                    }
                }),
                prisma.payment.aggregate({
                    where: {
                        status: 'SUCCEEDED',
                        createdAt: {
                            gte: hourStart,
                            lt: hourEnd
                        }
                    },
                    _sum: { amount: true }
                })
            ]);
            
            hours.push({
                hour: hourStart.getHours(),
                timestamp: hourStart.toISOString(),
                jobs: jobsCount,
                revenue: (revenue._sum.amount || 0) / 100
            });
        }
        
        return hours;
    }

    setupRoutes() {
        // Serve static dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });

        // API endpoint for live data
        this.app.get('/api/analytics', async (req, res) => {
            const data = await this.getLiveData();
            res.json(data);
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            logger.info('Analytics dashboard client connected', { socketId: socket.id });
            
            // Send initial data
            this.getLiveData().then(data => {
                socket.emit('analytics-update', data);
            });

            socket.on('disconnect', () => {
                logger.info('Analytics dashboard client disconnected', { socketId: socket.id });
            });
        });
    }

    startPeriodicUpdates() {
        // Update every 10 seconds
        setInterval(async () => {
            const data = await this.getLiveData();
            this.io.emit('analytics-update', data);
        }, 10000);
    }

    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>FinishThisIdea Analytics Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0e1b;
            color: #e2e8f0;
            padding: 20px;
        }
        .dashboard { 
            max-width: 1400px; 
            margin: 0 auto;
            display: grid;
            gap: 20px;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .header {
            grid-column: 1 / -1;
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .card {
            background: #1e293b;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #334155;
        }
        .card h2 {
            color: #f1f5f9;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #334155;
        }
        .metric:last-child { border-bottom: none; }
        .metric-value {
            font-weight: bold;
            font-size: 1.1rem;
        }
        .revenue { color: #10b981; }
        .jobs { color: #3b82f6; }
        .success { color: #059669; }
        .failed { color: #dc2626; }
        .processing { color: #f59e0b; }
        .chart-container {
            grid-column: 1 / -1;
            height: 400px;
            position: relative;
        }
        .recent-jobs {
            grid-column: 1 / -1;
            max-height: 500px;
            overflow-y: auto;
        }
        .job-item {
            display: grid;
            grid-template-columns: 1fr 100px 80px 100px;
            gap: 15px;
            padding: 10px;
            border-bottom: 1px solid #334155;
            align-items: center;
        }
        .job-item:last-child { border-bottom: none; }
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            text-align: center;
        }
        .status.completed { background: #059669; }
        .status.failed { background: #dc2626; }
        .status.processing { background: #f59e0b; }
        .status.pending { background: #6b7280; }
        .timestamp {
            position: fixed;
            top: 20px;
            right: 20px;
            color: #94a3b8;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="timestamp" id="timestamp">Loading...</div>
    <div class="dashboard">
        <div class="header">
            <h1>📊 FinishThisIdea Analytics</h1>
            <p>Real-time platform metrics and business intelligence</p>
        </div>
        
        <div class="card">
            <h2>Platform Overview</h2>
            <div class="metric">
                <span>Total Jobs</span>
                <span class="metric-value jobs" id="totalJobs">-</span>
            </div>
            <div class="metric">
                <span>Success Rate</span>
                <span class="metric-value success" id="successRate">-</span>
            </div>
            <div class="metric">
                <span>Processing</span>
                <span class="metric-value processing" id="processingJobs">-</span>
            </div>
            <div class="metric">
                <span>Active Users (24h)</span>
                <span class="metric-value" id="activeUsers">-</span>
            </div>
        </div>

        <div class="card">
            <h2>Revenue Metrics</h2>
            <div class="metric">
                <span>Total Revenue</span>
                <span class="metric-value revenue" id="totalRevenue">$-</span>
            </div>
            <div class="metric">
                <span>Today's Revenue</span>
                <span class="metric-value revenue" id="todayRevenue">$-</span>
            </div>
            <div class="metric">
                <span>Uploads (24h)</span>
                <span class="metric-value" id="totalUploads">-</span>
            </div>
        </div>

        <div class="card chart-container">
            <h2>Hourly Activity</h2>
            <canvas id="activityChart"></canvas>
        </div>

        <div class="card recent-jobs">
            <h2>Recent Jobs</h2>
            <div id="recentJobsList">Loading...</div>
        </div>
    </div>

    <script>
        const socket = io();
        let activityChart;

        socket.on('analytics-update', (data) => {
            updateDashboard(data);
        });

        function updateDashboard(data) {
            if (data.error) {
                console.error('Analytics error:', data.error);
                return;
            }

            document.getElementById('timestamp').textContent = 
                'Last update: ' + new Date(data.timestamp).toLocaleTimeString();
            
            // Platform metrics
            document.getElementById('totalJobs').textContent = data.platform.totalJobs;
            document.getElementById('successRate').textContent = data.platform.successRate + '%';
            document.getElementById('processingJobs').textContent = data.platform.processingJobs;
            document.getElementById('activeUsers').textContent = data.platform.activeUsers;
            
            // Revenue metrics
            document.getElementById('totalRevenue').textContent = '$' + data.platform.totalRevenue.toFixed(2);
            document.getElementById('todayRevenue').textContent = '$' + data.platform.todayRevenue.toFixed(2);
            document.getElementById('totalUploads').textContent = data.platform.totalUploads;

            // Update chart
            updateActivityChart(data.hourlyMetrics);

            // Update recent jobs
            updateRecentJobs(data.recentJobs);
        }

        function updateActivityChart(hourlyData) {
            const ctx = document.getElementById('activityChart').getContext('2d');
            
            if (activityChart) {
                activityChart.destroy();
            }

            activityChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: hourlyData.map(h => h.hour + ':00'),
                    datasets: [{
                        label: 'Jobs',
                        data: hourlyData.map(h => h.jobs),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        yAxisID: 'y'
                    }, {
                        label: 'Revenue ($)',
                        data: hourlyData.map(h => h.revenue),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    }
                }
            });
        }

        function updateRecentJobs(jobs) {
            const container = document.getElementById('recentJobsList');
            container.innerHTML = jobs.map(job => 
                '<div class="job-item">' +
                    '<div>' +
                        '<strong>' + (job.fileName || 'Unknown') + '</strong><br>' +
                        '<small>' + job.type + '</small>' +
                    '</div>' +
                    '<div class="status ' + job.status.toLowerCase() + '">' + job.status + '</div>' +
                    '<div>$' + job.revenue.toFixed(2) + '</div>' +
                    '<div><small>' + new Date(job.createdAt).toLocaleTimeString() + '</small></div>' +
                '</div>'
            ).join('');
        }

        // Initialize
        fetch('/api/analytics')
            .then(r => r.json())
            .then(updateDashboard)
            .catch(e => console.error('Failed to load initial data:', e));
    </script>
</body>
</html>`;
    }

    start() {
        this.server.listen(this.port, () => {
            logger.info(`📊 Analytics Dashboard running on http://localhost:${this.port}`);
        });
    }
}

module.exports = { AnalyticsDashboard };

// Start dashboard if run directly
if (require.main === module) {
    const dashboard = new AnalyticsDashboard();
    dashboard.start();
}
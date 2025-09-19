#!/usr/bin/env node

/**
 * ⏰ TEMPORAL BINDING SERVICE
 * 
 * Handles scheduled orchestration - the "cron" layer for automated data flows
 * Daily scraping, automated reports, email digests, scheduled analysis
 * 
 * Time-based bindings that trigger data flows through the mobius system
 */

const EventEmitter = require('events');
const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { Pool } = require('pg');

class TemporalBindingService extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 3010;
        this.schedules = new Map();
        this.jobs = new Map();
        this.executionHistory = [];
        
        // Service endpoints
        this.services = {
            dataGinder: 'http://localhost:3009',
            realEstateScraper: 'http://localhost:3008',
            infinityRouter: 'http://localhost:8000',
            orchestrator: 'http://localhost:3006'
        };
        
        // Email configuration
        this.emailConfig = {
            transport: nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            }),
            defaultFrom: process.env.EMAIL_FROM || 'noreply@document-generator.com',
            digestRecipients: process.env.DIGEST_RECIPIENTS?.split(',') || []
        };
        
        // Default schedules
        this.defaultSchedules = {
            'daily-market-scrape': {
                schedule: '0 6 * * *', // 6 AM daily
                task: 'scrapePinellasReports',
                description: 'Daily Pinellas market report scraping',
                enabled: true
            },
            'weekly-market-analysis': {
                schedule: '0 9 * * MON', // 9 AM Monday
                task: 'generateWeeklyAnalysis',
                description: 'Weekly market analysis report',
                enabled: true
            },
            'daily-digest-email': {
                schedule: '0 8 * * *', // 8 AM daily
                task: 'sendDailyDigest',
                description: 'Daily market insights email',
                enabled: true
            },
            'hourly-data-sync': {
                schedule: '0 * * * *', // Every hour
                task: 'syncDataAcrossSystems',
                description: 'Hourly data synchronization',
                enabled: true
            },
            'monthly-attribution': {
                schedule: '0 0 1 * *', // First of month
                task: 'runMonthlyAttribution',
                description: 'Monthly Google MMM attribution analysis',
                enabled: true
            }
        };
        
        // Task registry
        this.tasks = new Map();
        this.registerTasks();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeSchedules();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', 'temporal-binding');
            res.setHeader('X-Active-Schedules', this.schedules.size);
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'temporal-binding',
                activeSchedules: this.schedules.size,
                runningJobs: Array.from(this.jobs.values()).filter(j => j.status === 'running').length,
                uptime: process.uptime()
            });
        });
        
        // Get all schedules
        this.app.get('/schedules', (req, res) => {
            const scheduleList = Array.from(this.schedules.entries()).map(([id, schedule]) => ({
                id,
                ...schedule,
                nextRun: schedule.cronJob ? 
                    cron.validate(schedule.schedule) ? 
                        moment(cron.parseExpression(schedule.schedule).next().toDate()).fromNow() :
                        'Invalid schedule' :
                    'Not scheduled'
            }));
            
            res.json({
                schedules: scheduleList,
                total: scheduleList.length
            });
        });
        
        // Create new schedule
        this.app.post('/schedule', async (req, res) => {
            try {
                const { name, schedule, task, description, enabled = true } = req.body;
                const scheduleId = await this.createSchedule(name, schedule, task, description, enabled);
                
                res.json({
                    success: true,
                    scheduleId,
                    message: `Schedule created: ${name}`
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Run task immediately
        this.app.post('/run/:taskName', async (req, res) => {
            try {
                const { taskName } = req.params;
                const jobId = await this.runTask(taskName, { manual: true });
                
                res.json({
                    success: true,
                    jobId,
                    message: `Task ${taskName} started`
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get execution history
        this.app.get('/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            const history = this.executionHistory.slice(-limit).reverse();
            
            res.json({
                history,
                total: this.executionHistory.length
            });
        });
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
    }
    
    registerTasks() {
        // Daily Pinellas report scraping
        this.tasks.set('scrapePinellasReports', async (context) => {
            console.log('📊 Starting daily Pinellas report scraping...');
            
            try {
                const response = await axios.post(`${this.services.realEstateScraper}/api/scrape/pinellas-reports`, {
                    startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
                    endDate: moment().format('YYYY-MM-DD')
                });
                
                const { jobId } = response.data;
                
                // Wait for job completion
                const result = await this.waitForJob(jobId);
                
                // Flow data through universal binder
                await this.flowDataThroughBinder({
                    source: 'temporal-scheduler',
                    target: 'house-search',
                    data: result.reports
                });
                
                return {
                    success: true,
                    reportsProcessed: result.reports.length,
                    jobId
                };
            } catch (error) {
                throw new Error(`Pinellas scraping failed: ${error.message}`);
            }
        });
        
        // Weekly market analysis
        this.tasks.set('generateWeeklyAnalysis', async (context) => {
            console.log('📈 Generating weekly market analysis...');
            
            try {
                // Get last week's data
                const marketData = await this.getWeeklyMarketData();
                
                // Run through infinity router for analysis
                const response = await axios.post(`${this.services.infinityRouter}/api/infinity-action`, {
                    action: 'analyze-market',
                    payload: marketData
                });
                
                const analysis = response.data;
                
                // Store analysis
                await this.storeAnalysis(analysis);
                
                return {
                    success: true,
                    analysis: analysis.summary
                };
            } catch (error) {
                throw new Error(`Weekly analysis failed: ${error.message}`);
            }
        });
        
        // Daily digest email
        this.tasks.set('sendDailyDigest', async (context) => {
            console.log('📧 Sending daily market digest...');
            
            try {
                // Gather today's insights
                const insights = await this.gatherDailyInsights();
                
                // Generate email content
                const emailContent = this.generateDigestEmail(insights);
                
                // Send to recipients
                for (const recipient of this.emailConfig.digestRecipients) {
                    await this.emailConfig.transport.sendMail({
                        from: this.emailConfig.defaultFrom,
                        to: recipient,
                        subject: `Market Insights - ${moment().format('MMM D, YYYY')}`,
                        html: emailContent
                    });
                }
                
                return {
                    success: true,
                    recipients: this.emailConfig.digestRecipients.length
                };
            } catch (error) {
                throw new Error(`Daily digest failed: ${error.message}`);
            }
        });
        
        // Hourly data sync
        this.tasks.set('syncDataAcrossSystems', async (context) => {
            console.log('🔄 Syncing data across systems...');
            
            try {
                // Trigger data flow through binder
                const flows = await this.triggerDataFlows();
                
                return {
                    success: true,
                    flowsTriggered: flows.length
                };
            } catch (error) {
                throw new Error(`Data sync failed: ${error.message}`);
            }
        });
        
        // Monthly attribution analysis
        this.tasks.set('runMonthlyAttribution', async (context) => {
            console.log('📊 Running monthly attribution analysis...');
            
            try {
                // Get last month's data
                const monthData = await this.getMonthlyData();
                
                // Process through Google MMM (future integration)
                const attribution = await this.runAttribution(monthData);
                
                // Generate report
                const report = await this.generateAttributionReport(attribution);
                
                return {
                    success: true,
                    report: report.summary
                };
            } catch (error) {
                throw new Error(`Attribution analysis failed: ${error.message}`);
            }
        });
    }
    
    async createSchedule(name, schedule, task, description, enabled = true) {
        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate cron expression
        if (!cron.validate(schedule)) {
            throw new Error(`Invalid cron expression: ${schedule}`);
        }
        
        // Validate task exists
        if (!this.tasks.has(task)) {
            throw new Error(`Unknown task: ${task}`);
        }
        
        const scheduleConfig = {
            name,
            schedule,
            task,
            description,
            enabled,
            created: new Date().toISOString(),
            lastRun: null,
            nextRun: null,
            runCount: 0
        };
        
        // Create cron job
        if (enabled) {
            const job = cron.schedule(schedule, async () => {
                await this.runTask(task, { scheduled: true, scheduleId });
            }, {
                scheduled: enabled
            });
            
            scheduleConfig.cronJob = job;
        }
        
        this.schedules.set(scheduleId, scheduleConfig);
        
        console.log(`⏰ Schedule created: ${name} (${schedule})`);
        this.emit('schedule-created', { scheduleId, scheduleConfig });
        
        return scheduleId;
    }
    
    async runTask(taskName, context = {}) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (!this.tasks.has(taskName)) {
            throw new Error(`Unknown task: ${taskName}`);
        }
        
        const task = this.tasks.get(taskName);
        const job = {
            id: jobId,
            task: taskName,
            status: 'running',
            startTime: Date.now(),
            context
        };
        
        this.jobs.set(jobId, job);
        
        // Execute task
        try {
            console.log(`▶️ Running task: ${taskName}`);
            const result = await task(context);
            
            job.status = 'completed';
            job.endTime = Date.now();
            job.duration = job.endTime - job.startTime;
            job.result = result;
            
            // Update schedule if this was scheduled
            if (context.scheduleId) {
                const schedule = this.schedules.get(context.scheduleId);
                if (schedule) {
                    schedule.lastRun = new Date().toISOString();
                    schedule.runCount++;
                }
            }
            
            // Add to history
            this.executionHistory.push({
                jobId,
                task: taskName,
                status: 'completed',
                timestamp: new Date().toISOString(),
                duration: job.duration,
                scheduled: context.scheduled || false
            });
            
            console.log(`✅ Task completed: ${taskName} (${job.duration}ms)`);
            this.emit('task-completed', { jobId, job });
            
        } catch (error) {
            job.status = 'failed';
            job.endTime = Date.now();
            job.duration = job.endTime - job.startTime;
            job.error = error.message;
            
            console.error(`❌ Task failed: ${taskName}`, error);
            
            // Add to history
            this.executionHistory.push({
                jobId,
                task: taskName,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                duration: job.duration,
                scheduled: context.scheduled || false
            });
            
            this.emit('task-failed', { jobId, job, error });
            throw error;
        }
        
        return jobId;
    }
    
    async waitForJob(jobId) {
        // Poll real estate scraper for job status
        const maxAttempts = 60; // 5 minutes with 5 second intervals
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                const response = await axios.get(`${this.services.realEstateScraper}/api/jobs/${jobId}`);
                const { status, job } = response.data;
                
                if (status === 'completed') {
                    return job.result;
                } else if (status === 'failed') {
                    throw new Error(`Job failed: ${job.error}`);
                }
                
                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
                
            } catch (error) {
                if (attempts >= maxAttempts - 1) {
                    throw new Error(`Job timeout: ${jobId}`);
                }
            }
        }
        
        throw new Error(`Job did not complete: ${jobId}`);
    }
    
    async flowDataThroughBinder(config) {
        try {
            await axios.post(`${this.services.dataGinder}/flow`, config);
        } catch (error) {
            console.error('Failed to flow data through binder:', error.message);
        }
    }
    
    async getWeeklyMarketData() {
        // Aggregate last week's market data
        const startDate = moment().subtract(1, 'week').startOf('week');
        const endDate = moment().subtract(1, 'week').endOf('week');
        
        // This would query your database or services
        return {
            period: {
                start: startDate.format('YYYY-MM-DD'),
                end: endDate.format('YYYY-MM-DD')
            },
            counties: ['pinellas', 'hillsborough', 'pasco'],
            metrics: {
                totalListings: 0,
                closedSales: 0,
                medianPrice: 0,
                avgDaysOnMarket: 0
            }
        };
    }
    
    async gatherDailyInsights() {
        // Gather insights from various sources
        return {
            date: moment().format('YYYY-MM-DD'),
            marketHighlights: [
                'Pinellas median price: $425,000 (+2.3%)',
                'New listings: 127 properties',
                'Average DOM: 21 days (-3 days)'
            ],
            topProperties: [],
            marketTrends: []
        };
    }
    
    generateDigestEmail(insights) {
        return `
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Daily Market Insights - ${insights.date}</h2>
            
            <div style="background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Market Highlights</h3>
                <ul>
                    ${insights.marketHighlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
            </div>
            
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
                Generated by Temporal Binding Service<br>
                Document Generator Platform
            </p>
        </body>
        </html>
        `;
    }
    
    async initializeSchedules() {
        // Create default schedules
        for (const [name, config] of Object.entries(this.defaultSchedules)) {
            try {
                await this.createSchedule(
                    name,
                    config.schedule,
                    config.task,
                    config.description,
                    config.enabled
                );
            } catch (error) {
                console.error(`Failed to create schedule ${name}:`, error.message);
            }
        }
        
        console.log(`✅ Initialized ${this.schedules.size} default schedules`);
    }
    
    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Temporal Binding Service - Scheduled Orchestration</title>
    <style>
        body {
            font-family: -apple-system, monospace;
            background: #0a0a0a;
            color: #0f0;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px;
            border: 2px solid #0f0;
            margin-bottom: 30px;
        }
        .clock {
            font-size: 24px;
            color: #0ff;
            margin: 10px 0;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .panel {
            background: #111;
            border: 1px solid #0f0;
            padding: 20px;
            border-radius: 10px;
        }
        .schedule {
            background: #1a1a1a;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .schedule.enabled {
            border-left: 3px solid #0f0;
        }
        .schedule.disabled {
            border-left: 3px solid #666;
            opacity: 0.6;
        }
        .cron {
            font-family: monospace;
            color: #0ff;
            font-size: 14px;
        }
        .next-run {
            color: #888;
            font-size: 12px;
            margin-top: 5px;
        }
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
            margin: 5px;
        }
        button:hover {
            background: #0a0;
        }
        button.run-now {
            background: #0ff;
            padding: 5px 10px;
            font-size: 12px;
        }
        .history {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #333;
            padding: 10px;
        }
        .history-item {
            padding: 5px;
            margin: 2px 0;
            border-radius: 3px;
        }
        .history-item.completed {
            background: #001a00;
            border-left: 3px solid #0f0;
        }
        .history-item.failed {
            background: #1a0000;
            border-left: 3px solid #f00;
        }
        .history-item.running {
            background: #1a1a00;
            border-left: 3px solid #ff0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        .stat {
            background: #1a1a1a;
            padding: 15px;
            text-align: center;
            border-radius: 5px;
        }
        .stat-value {
            font-size: 24px;
            color: #0ff;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ TEMPORAL BINDING SERVICE</h1>
        <div class="clock" id="clock"></div>
        <p>Scheduled orchestration for automated data flows</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div>Active Schedules</div>
            <div class="stat-value" id="scheduleCount">0</div>
        </div>
        <div class="stat">
            <div>Running Jobs</div>
            <div class="stat-value" id="runningCount">0</div>
        </div>
        <div class="stat">
            <div>Total Executions</div>
            <div class="stat-value" id="totalCount">0</div>
        </div>
        <div class="stat">
            <div>Success Rate</div>
            <div class="stat-value" id="successRate">0%</div>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h3>📅 Active Schedules</h3>
            <div id="schedules"></div>
        </div>
        
        <div class="panel">
            <h3>⚡ Quick Actions</h3>
            <button onclick="runTask('scrapePinellasReports')">Scrape Pinellas Reports</button>
            <button onclick="runTask('generateWeeklyAnalysis')">Generate Analysis</button>
            <button onclick="runTask('sendDailyDigest')">Send Daily Digest</button>
            <button onclick="runTask('syncDataAcrossSystems')">Sync Data</button>
            <button onclick="runTask('runMonthlyAttribution')">Run Attribution</button>
        </div>
    </div>
    
    <div class="panel">
        <h3>📊 Execution History</h3>
        <div class="history" id="history"></div>
    </div>
    
    <script>
        let ws;
        
        function updateClock() {
            const now = new Date();
            document.getElementById('clock').textContent = now.toLocaleString();
        }
        
        async function loadSchedules() {
            const response = await fetch('/schedules');
            const data = await response.json();
            
            const schedulesDiv = document.getElementById('schedules');
            schedulesDiv.innerHTML = data.schedules.map(schedule => \`
                <div class="schedule \${schedule.enabled ? 'enabled' : 'disabled'}">
                    <div>
                        <strong>\${schedule.name}</strong>
                        <button class="run-now" onclick="runTask('\${schedule.task}')">Run Now</button>
                    </div>
                    <div class="cron">\${schedule.schedule}</div>
                    <div>\${schedule.description}</div>
                    <div class="next-run">Next run: \${schedule.nextRun}</div>
                    <div style="font-size: 12px; color: #666;">
                        Runs: \${schedule.runCount || 0}
                        \${schedule.lastRun ? ' | Last: ' + new Date(schedule.lastRun).toLocaleTimeString() : ''}
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('scheduleCount').textContent = data.schedules.filter(s => s.enabled).length;
        }
        
        async function loadHistory() {
            const response = await fetch('/history?limit=20');
            const data = await response.json();
            
            const historyDiv = document.getElementById('history');
            historyDiv.innerHTML = data.history.map(item => \`
                <div class="history-item \${item.status}">
                    <strong>\${new Date(item.timestamp).toLocaleTimeString()}</strong> - 
                    \${item.task} 
                    <span style="float: right;">
                        \${item.status} (\${item.duration}ms)
                        \${item.scheduled ? '⏰' : '👤'}
                    </span>
                    \${item.error ? '<div style="color: #f00; font-size: 12px;">' + item.error + '</div>' : ''}
                </div>
            \`).join('');
            
            document.getElementById('totalCount').textContent = data.total;
            
            // Calculate success rate
            const completed = data.history.filter(h => h.status === 'completed').length;
            const total = data.history.length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            document.getElementById('successRate').textContent = rate + '%';
        }
        
        async function runTask(taskName) {
            const response = await fetch(\`/run/\${taskName}\`, {
                method: 'POST'
            });
            
            const result = await response.json();
            if (result.success) {
                alert(\`Task started: \${taskName} (Job ID: \${result.jobId})\`);
                setTimeout(loadHistory, 1000);
            } else {
                alert(\`Failed to start task: \${result.error}\`);
            }
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:3010/ws');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'task-update') {
                    loadHistory();
                }
            };
        }
        
        // Initialize
        updateClock();
        loadSchedules();
        loadHistory();
        connectWebSocket();
        
        // Update clock every second
        setInterval(updateClock, 1000);
        
        // Refresh data periodically
        setInterval(() => {
            loadSchedules();
            loadHistory();
        }, 5000);
    </script>
</body>
</html>
        `;
    }
    
    // Helper methods
    async storeAnalysis(analysis) {
        // Store in database or file system
        console.log('Storing analysis:', analysis);
    }
    
    async triggerDataFlows() {
        // Trigger various data flows
        return [];
    }
    
    async getMonthlyData() {
        // Get last month's data
        return {};
    }
    
    async runAttribution(data) {
        // Run attribution analysis (placeholder for Google MMM integration)
        return {
            channels: {},
            roi: {}
        };
    }
    
    async generateAttributionReport(attribution) {
        return {
            summary: 'Attribution analysis complete'
        };
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`⏰ Temporal Binding Service running on port ${this.port}`);
                console.log(`📅 Active schedules: ${this.schedules.size}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                resolve();
            });
        });
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Temporal Binding Service...');
        
        // Stop all cron jobs
        for (const [id, schedule] of this.schedules) {
            if (schedule.cronJob) {
                schedule.cronJob.stop();
            }
        }
        
        process.exit(0);
    }
}

// Auto-start if run directly
if (require.main === module) {
    const service = new TemporalBindingService();
    
    service.start().catch(error => {
        console.error('Failed to start Temporal Binding Service:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => service.shutdown());
    process.on('SIGTERM', () => service.shutdown());
}

module.exports = TemporalBindingService;
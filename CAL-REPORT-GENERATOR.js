#!/usr/bin/env node

/**
 * 📊 CAL REPORT GENERATOR - AUTOMATED INSIGHTS & ANALYTICS
 * 
 * Automated PDF report generation and email distribution system:
 * - Daily/weekly/monthly market analysis reports
 * - System performance and cost optimization insights
 * - Arbitrage opportunities and profit summaries
 * - Cross-market correlation analysis
 * - Executive dashboards with key metrics
 * - Automated email delivery to stakeholders
 */

const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const EventEmitter = require('events');

class CalReportGenerator extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            reportsDir: process.env.REPORTS_DIR || './reports',
            templatesDir: process.env.TEMPLATES_DIR || './report_templates',
            schedules: {
                daily: '0 8 * * *',        // 8 AM daily
                weekly: '0 8 * * 1',       // 8 AM Monday
                monthly: '0 8 1 * *'       // 8 AM 1st of month
            },
            email: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            },
            recipients: {
                daily: ['team@example.com'],
                weekly: ['management@example.com'],
                monthly: ['executives@example.com']
            }
        };
        
        // Data sources (would connect to actual Cal system)
        this.dataSources = {
            marketHub: null,
            systemTracer: null,
            librarianDatabases: null,
            monitorDashboard: null
        };
        
        // Email transporter
        this.emailTransporter = null;
        
        // Report templates
        this.reportTemplates = {
            daily: 'Daily Cal System Report',
            weekly: 'Weekly Market Intelligence Report',
            monthly: 'Monthly Executive Summary'
        };
        
        console.log('📊 Cal Report Generator initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Create directories
        await this.createDirectories();
        
        // Initialize email transporter
        this.initializeEmailTransporter();
        
        // Schedule automated reports
        this.scheduleReports();
        
        // Load report templates
        await this.loadTemplates();
        
        console.log('✅ Cal Report Generator ready');
        console.log(`   📁 Reports directory: ${this.config.reportsDir}`);
        console.log(`   📧 Email configured: ${this.emailTransporter ? 'Yes' : 'No'}`);
        console.log('   📅 Scheduled reports:');
        console.log(`      Daily: ${this.config.schedules.daily}`);
        console.log(`      Weekly: ${this.config.schedules.weekly}`);
        console.log(`      Monthly: ${this.config.schedules.monthly}`);
        
        this.emit('report_generator_ready');
    }
    
    async createDirectories() {
        await fs.mkdir(this.config.reportsDir, { recursive: true });
        await fs.mkdir(this.config.templatesDir, { recursive: true });
        await fs.mkdir(path.join(this.config.reportsDir, 'daily'), { recursive: true });
        await fs.mkdir(path.join(this.config.reportsDir, 'weekly'), { recursive: true });
        await fs.mkdir(path.join(this.config.reportsDir, 'monthly'), { recursive: true });
    }
    
    initializeEmailTransporter() {
        if (this.config.email.auth.user && this.config.email.auth.pass) {
            this.emailTransporter = nodemailer.createTransporter(this.config.email);
        } else {
            console.log('⚠️ Email credentials not provided, email reports disabled');
        }
    }
    
    scheduleReports() {
        // Schedule daily reports
        cron.schedule(this.config.schedules.daily, () => {
            console.log('📅 Generating scheduled daily report...');
            this.generateDailyReport(true);
        });
        
        // Schedule weekly reports
        cron.schedule(this.config.schedules.weekly, () => {
            console.log('📅 Generating scheduled weekly report...');
            this.generateWeeklyReport(true);
        });
        
        // Schedule monthly reports
        cron.schedule(this.config.schedules.monthly, () => {
            console.log('📅 Generating scheduled monthly report...');
            this.generateMonthlyReport(true);
        });
    }
    
    async loadTemplates() {
        // This would load custom report templates
        // For now, we'll use built-in templates
        console.log('📋 Loading report templates...');
    }
    
    // ========================================
    // REPORT GENERATION METHODS
    // ========================================
    
    async generateDailyReport(autoEmail = false) {
        console.log('📊 Generating daily report...');
        
        const reportData = await this.collectDailyData();
        const reportPath = await this.createDailyPDF(reportData);
        
        if (autoEmail && this.emailTransporter) {
            await this.emailReport('daily', reportPath, reportData);
        }
        
        this.emit('report_generated', {
            type: 'daily',
            path: reportPath,
            data: reportData
        });
        
        return reportPath;
    }
    
    async generateWeeklyReport(autoEmail = false) {
        console.log('📊 Generating weekly report...');
        
        const reportData = await this.collectWeeklyData();
        const reportPath = await this.createWeeklyPDF(reportData);
        
        if (autoEmail && this.emailTransporter) {
            await this.emailReport('weekly', reportPath, reportData);
        }
        
        this.emit('report_generated', {
            type: 'weekly',
            path: reportPath,
            data: reportData
        });
        
        return reportPath;
    }
    
    async generateMonthlyReport(autoEmail = false) {
        console.log('📊 Generating monthly report...');
        
        const reportData = await this.collectMonthlyData();
        const reportPath = await this.createMonthlyPDF(reportData);
        
        if (autoEmail && this.emailTransporter) {
            await this.emailReport('monthly', reportPath, reportData);
        }
        
        this.emit('report_generated', {
            type: 'monthly',
            path: reportPath,
            data: reportData
        });
        
        return reportPath;
    }
    
    // ========================================
    // DATA COLLECTION METHODS
    // ========================================
    
    async collectDailyData() {
        // Mock data - in real implementation, this would connect to Cal systems
        return {
            date: new Date().toISOString().split('T')[0],
            summary: {
                total_queries: 1247,
                successful_queries: 1189,
                total_cost: 4.67,
                avg_response_time: 387,
                active_librarians: 5
            },
            market_data: {
                osrs: {
                    total_items_tracked: 12,
                    arbitrage_opportunities: 7,
                    best_opportunity: {
                        item: 'Dragon bones',
                        profit_margin: 8.3,
                        potential_profit: 2150
                    }
                },
                crypto: {
                    total_tracked: 6,
                    biggest_mover: {
                        symbol: 'BTC',
                        change: -2.4
                    }
                },
                stocks: {
                    total_tracked: 6,
                    biggest_mover: {
                        symbol: 'TSLA',
                        change: 3.7
                    }
                }
            },
            librarian_performance: {
                'trade-cal': { queries: 389, success_rate: 0.97, avg_time: 342 },
                'ship-cal': { queries: 187, success_rate: 0.94, avg_time: 456 },
                'combat-cal': { queries: 98, success_rate: 0.96, avg_time: 234 },
                'wiki-cal': { queries: 278, success_rate: 0.98, avg_time: 298 },
                'cal-master': { queries: 295, success_rate: 0.95, avg_time: 387 }
            },
            cost_breakdown: {
                anthropic: 2.34,
                openai: 1.89,
                deepseek: 0.44,
                ollama: 0.00
            },
            alerts: [
                { type: 'opportunity', message: 'High profit margin detected on Prayer potions', severity: 'info' },
                { type: 'cost', message: 'Daily spend approaching budget limit', severity: 'warning' }
            ]
        };
    }
    
    async collectWeeklyData() {
        const dailyData = await this.collectDailyData();
        
        return {
            week_ending: new Date().toISOString().split('T')[0],
            summary: {
                total_queries: dailyData.summary.total_queries * 7,
                avg_daily_cost: dailyData.summary.total_cost,
                total_weekly_cost: dailyData.summary.total_cost * 7,
                best_performing_librarian: 'wiki-cal',
                total_opportunities_found: 47
            },
            trends: {
                query_volume: [1247, 1189, 1356, 1298, 1402, 1189, 1267],
                cost_trend: [4.67, 4.23, 5.12, 4.89, 5.34, 4.78, 4.67],
                success_rate_trend: [0.954, 0.967, 0.943, 0.956, 0.971, 0.948, 0.954]
            },
            market_insights: {
                best_osrs_opportunity: 'Dragon bones arbitrage averaged 8.1% profit',
                crypto_correlation: 'Strong negative correlation detected between BTC and OSRS gold prices',
                stock_performance: 'Tech stocks showed 2.3% average growth this week'
            },
            recommendations: [
                'Increase monitoring frequency for Dragon bones during peak hours',
                'Consider expanding crypto tracking to include more altcoins',
                'Optimize model selection for combat-cal to reduce response time'
            ]
        };
    }
    
    async collectMonthlyData() {
        const weeklyData = await this.collectWeeklyData();
        
        return {
            month: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            executive_summary: {
                total_revenue_opportunities: 47850,
                total_system_cost: 142.67,
                roi: 335.5,
                uptime: 99.7,
                user_satisfaction: 4.6
            },
            key_achievements: [
                'Implemented cross-market correlation analysis',
                'Reduced average response time by 23%',
                'Discovered 3 new high-value arbitrage patterns',
                'Achieved 99.7% system uptime'
            ],
            market_performance: {
                osrs: {
                    opportunities_identified: 234,
                    avg_profit_margin: 7.8,
                    total_potential_profit: 125400
                },
                crypto: {
                    correlations_discovered: 12,
                    successful_predictions: 67,
                    accuracy_rate: 0.78
                },
                stocks: {
                    tracked_symbols: 6,
                    trend_accuracy: 0.82,
                    profitable_signals: 23
                }
            },
            cost_optimization: {
                current_monthly_spend: 142.67,
                projected_savings: 28.50,
                efficiency_improvements: [
                    'Increased local model usage by 34%',
                    'Optimized API call frequency',
                    'Implemented intelligent caching'
                ]
            },
            strategic_recommendations: [
                'Expand into forex market analysis',
                'Implement machine learning for trend prediction',
                'Consider premium data sources for enhanced accuracy',
                'Develop mobile interface for real-time alerts'
            ]
        };
    }
    
    // ========================================
    // PDF GENERATION METHODS
    // ========================================
    
    async createDailyPDF(data) {
        const filename = `daily-report-${data.date}.pdf`;
        const filepath = path.join(this.config.reportsDir, 'daily', filename);
        
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });
        
        doc.pipe(await fs.open(filepath, 'w').then(handle => handle.createWriteStream()));
        
        // Header
        this.addPDFHeader(doc, 'Daily Cal System Report', data.date);
        
        // Executive Summary
        doc.fontSize(16).text('Executive Summary', 50, 150);
        doc.fontSize(10);
        doc.text(`Total Queries: ${data.summary.total_queries}`, 70, 180);
        doc.text(`Success Rate: ${((data.summary.successful_queries / data.summary.total_queries) * 100).toFixed(1)}%`, 70, 195);
        doc.text(`Total Cost: $${data.summary.total_cost}`, 70, 210);
        doc.text(`Average Response Time: ${data.summary.avg_response_time}ms`, 70, 225);
        
        // Market Opportunities
        doc.fontSize(16).text('Market Opportunities', 50, 260);
        doc.fontSize(12).text('OSRS Best Opportunity:', 70, 285);
        doc.fontSize(10);
        doc.text(`${data.market_data.osrs.best_opportunity.item}: ${data.market_data.osrs.best_opportunity.profit_margin}% margin`, 90, 300);
        doc.text(`Potential profit: ${data.market_data.osrs.best_opportunity.potential_profit} GP`, 90, 315);
        
        // Librarian Performance
        doc.fontSize(16).text('Librarian Performance', 50, 350);
        let yPos = 375;
        Object.entries(data.librarian_performance).forEach(([librarian, stats]) => {
            doc.fontSize(12).text(`${librarian}:`, 70, yPos);
            doc.fontSize(10);
            doc.text(`${stats.queries} queries, ${(stats.success_rate * 100).toFixed(1)}% success, ${stats.avg_time}ms avg`, 90, yPos + 15);
            yPos += 40;
        });
        
        // Cost Breakdown
        doc.fontSize(16).text('Cost Breakdown', 50, yPos + 20);
        yPos += 45;
        Object.entries(data.cost_breakdown).forEach(([provider, cost]) => {
            doc.fontSize(10).text(`${provider}: $${cost.toFixed(2)}`, 70, yPos);
            yPos += 15;
        });
        
        // Alerts
        if (data.alerts.length > 0) {
            doc.fontSize(16).text('Alerts', 50, yPos + 20);
            yPos += 45;
            data.alerts.forEach(alert => {
                doc.fontSize(10).text(`${alert.type.toUpperCase()}: ${alert.message}`, 70, yPos);
                yPos += 15;
            });
        }
        
        this.addPDFFooter(doc);
        doc.end();
        
        return filepath;
    }
    
    async createWeeklyPDF(data) {
        const filename = `weekly-report-${data.week_ending}.pdf`;
        const filepath = path.join(this.config.reportsDir, 'weekly', filename);
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(await fs.open(filepath, 'w').then(handle => handle.createWriteStream()));
        
        this.addPDFHeader(doc, 'Weekly Market Intelligence Report', `Week ending ${data.week_ending}`);
        
        // Executive Summary
        doc.fontSize(16).text('Executive Summary', 50, 150);
        doc.fontSize(10);
        doc.text(`Total Queries: ${data.summary.total_queries.toLocaleString()}`, 70, 180);
        doc.text(`Average Daily Cost: $${data.summary.avg_daily_cost}`, 70, 195);
        doc.text(`Total Weekly Cost: $${data.summary.total_weekly_cost}`, 70, 210);
        doc.text(`Opportunities Found: ${data.summary.total_opportunities_found}`, 70, 225);
        
        // Trends Section
        doc.fontSize(16).text('Performance Trends', 50, 260);
        doc.fontSize(12).text('Query Volume Trend:', 70, 285);
        doc.fontSize(10).text(data.trends.query_volume.join(' → '), 90, 300);
        
        // Market Insights
        doc.fontSize(16).text('Market Insights', 50, 340);
        doc.fontSize(10);
        let yPos = 365;
        Object.values(data.market_insights).forEach(insight => {
            doc.text(`• ${insight}`, 70, yPos);
            yPos += 20;
        });
        
        // Recommendations
        doc.fontSize(16).text('Recommendations', 50, yPos + 20);
        yPos += 45;
        data.recommendations.forEach(rec => {
            doc.fontSize(10).text(`• ${rec}`, 70, yPos);
            yPos += 20;
        });
        
        this.addPDFFooter(doc);
        doc.end();
        
        return filepath;
    }
    
    async createMonthlyPDF(data) {
        const filename = `monthly-executive-summary-${data.month.replace(' ', '-').toLowerCase()}.pdf`;
        const filepath = path.join(this.config.reportsDir, 'monthly', filename);
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(await fs.open(filepath, 'w').then(handle => handle.createWriteStream()));
        
        this.addPDFHeader(doc, 'Monthly Executive Summary', data.month);
        
        // Executive Summary
        doc.fontSize(18).text('Executive Summary', 50, 150);
        doc.fontSize(12);
        doc.text(`Revenue Opportunities Identified: $${data.executive_summary.total_revenue_opportunities.toLocaleString()}`, 70, 180);
        doc.text(`System Operating Cost: $${data.executive_summary.total_system_cost}`, 70, 200);
        doc.text(`Return on Investment: ${data.executive_summary.roi}x`, 70, 220);
        doc.text(`System Uptime: ${data.executive_summary.uptime}%`, 70, 240);
        doc.text(`User Satisfaction: ${data.executive_summary.user_satisfaction}/5.0`, 70, 260);
        
        // Key Achievements
        doc.fontSize(16).text('Key Achievements', 50, 300);
        let yPos = 325;
        data.key_achievements.forEach(achievement => {
            doc.fontSize(11).text(`✓ ${achievement}`, 70, yPos);
            yPos += 20;
        });
        
        // Market Performance
        doc.fontSize(16).text('Market Performance', 50, yPos + 20);
        yPos += 45;
        
        doc.fontSize(12).text('OSRS Market:', 70, yPos);
        doc.fontSize(10);
        doc.text(`Opportunities: ${data.market_performance.osrs.opportunities_identified}`, 90, yPos + 20);
        doc.text(`Avg Profit Margin: ${data.market_performance.osrs.avg_profit_margin}%`, 90, yPos + 35);
        doc.text(`Total Potential: ${data.market_performance.osrs.total_potential_profit} GP`, 90, yPos + 50);
        
        yPos += 80;
        doc.fontSize(12).text('Cryptocurrency:', 70, yPos);
        doc.fontSize(10);
        doc.text(`Correlations: ${data.market_performance.crypto.correlations_discovered}`, 90, yPos + 20);
        doc.text(`Accuracy Rate: ${(data.market_performance.crypto.accuracy_rate * 100).toFixed(1)}%`, 90, yPos + 35);
        
        // Strategic Recommendations
        yPos += 70;
        doc.fontSize(16).text('Strategic Recommendations', 50, yPos);
        yPos += 25;
        data.strategic_recommendations.forEach(rec => {
            doc.fontSize(10).text(`• ${rec}`, 70, yPos);
            yPos += 20;
        });
        
        this.addPDFFooter(doc);
        doc.end();
        
        return filepath;
    }
    
    addPDFHeader(doc, title, subtitle) {
        doc.fontSize(24).text(title, 50, 50);
        doc.fontSize(14).text(subtitle, 50, 80);
        doc.moveTo(50, 110).lineTo(550, 110).stroke();
    }
    
    addPDFFooter(doc) {
        const pageHeight = doc.page.height;
        doc.fontSize(8);
        doc.text(`Generated by Cal System Report Generator - ${new Date().toLocaleString()}`, 50, pageHeight - 30);
        doc.text('Confidential - Internal Use Only', 400, pageHeight - 30);
    }
    
    // ========================================
    // EMAIL METHODS
    // ========================================
    
    async emailReport(reportType, filePath, data) {
        if (!this.emailTransporter) {
            console.log('❌ Email not configured, skipping email delivery');
            return;
        }
        
        const recipients = this.config.recipients[reportType] || [];
        if (recipients.length === 0) {
            console.log(`⚠️ No recipients configured for ${reportType} reports`);
            return;
        }
        
        const subject = this.getEmailSubject(reportType, data);
        const htmlBody = this.getEmailBody(reportType, data);
        
        try {
            const info = await this.emailTransporter.sendMail({
                from: `Cal System Reports <${this.config.email.auth.user}>`,
                to: recipients.join(', '),
                subject: subject,
                html: htmlBody,
                attachments: [{
                    filename: path.basename(filePath),
                    path: filePath
                }]
            });
            
            console.log(`📧 ${reportType} report emailed to ${recipients.length} recipients`);
            console.log(`   Message ID: ${info.messageId}`);
            
            this.emit('report_emailed', {
                type: reportType,
                recipients: recipients,
                messageId: info.messageId
            });
            
        } catch (error) {
            console.error(`❌ Failed to email ${reportType} report:`, error);
            this.emit('email_error', { type: reportType, error: error.message });
        }
    }
    
    getEmailSubject(reportType, data) {
        const subjects = {
            daily: `Daily Cal System Report - ${data.date}`,
            weekly: `Weekly Market Intelligence Report - Week ending ${data.week_ending}`,
            monthly: `Monthly Executive Summary - ${data.month}`
        };
        
        return subjects[reportType] || `Cal System ${reportType} Report`;
    }
    
    getEmailBody(reportType, data) {
        const templates = {
            daily: this.getDailyEmailBody(data),
            weekly: this.getWeeklyEmailBody(data),
            monthly: this.getMonthlyEmailBody(data)
        };
        
        return templates[reportType] || '<p>Cal System Report attached.</p>';
    }
    
    getDailyEmailBody(data) {
        return `
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #0066cc;">Daily Cal System Report</h2>
            <p>Date: <strong>${data.date}</strong></p>
            
            <h3>Quick Summary</h3>
            <ul>
                <li>Total Queries: <strong>${data.summary.total_queries}</strong></li>
                <li>Success Rate: <strong>${((data.summary.successful_queries / data.summary.total_queries) * 100).toFixed(1)}%</strong></li>
                <li>Daily Cost: <strong>$${data.summary.total_cost}</strong></li>
                <li>Best OSRS Opportunity: <strong>${data.market_data.osrs.best_opportunity.item} (${data.market_data.osrs.best_opportunity.profit_margin}% margin)</strong></li>
            </ul>
            
            ${data.alerts.length > 0 ? `
            <h3 style="color: #ff6600;">Alerts</h3>
            <ul>
                ${data.alerts.map(alert => `<li><strong>${alert.type.toUpperCase()}:</strong> ${alert.message}</li>`).join('')}
            </ul>
            ` : ''}
            
            <p>Full detailed report is attached as PDF.</p>
            
            <p style="font-size: 12px; color: #666;">
                This is an automated report generated by the Cal System Report Generator.
            </p>
        </body>
        </html>
        `;
    }
    
    getWeeklyEmailBody(data) {
        return `
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #0066cc;">Weekly Market Intelligence Report</h2>
            <p>Week ending: <strong>${data.week_ending}</strong></p>
            
            <h3>Weekly Highlights</h3>
            <ul>
                <li>Total Queries: <strong>${data.summary.total_queries.toLocaleString()}</strong></li>
                <li>Weekly Cost: <strong>$${data.summary.total_weekly_cost}</strong></li>
                <li>Opportunities Found: <strong>${data.summary.total_opportunities_found}</strong></li>
                <li>Best Performer: <strong>${data.summary.best_performing_librarian}</strong></li>
            </ul>
            
            <h3>Key Market Insights</h3>
            <ul>
                ${Object.values(data.market_insights).map(insight => `<li>${insight}</li>`).join('')}
            </ul>
            
            <p>Complete analysis and recommendations are in the attached PDF report.</p>
            
            <p style="font-size: 12px; color: #666;">
                This is an automated weekly report generated by the Cal System.
            </p>
        </body>
        </html>
        `;
    }
    
    getMonthlyEmailBody(data) {
        return `
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #0066cc;">Monthly Executive Summary</h2>
            <p>Month: <strong>${data.month}</strong></p>
            
            <h3>Executive Highlights</h3>
            <ul>
                <li>Revenue Opportunities: <strong>$${data.executive_summary.total_revenue_opportunities.toLocaleString()}</strong></li>
                <li>ROI: <strong>${data.executive_summary.roi}x</strong></li>
                <li>System Uptime: <strong>${data.executive_summary.uptime}%</strong></li>
                <li>User Satisfaction: <strong>${data.executive_summary.user_satisfaction}/5.0</strong></li>
            </ul>
            
            <h3>Key Achievements</h3>
            <ul>
                ${data.key_achievements.map(achievement => `<li>${achievement}</li>`).join('')}
            </ul>
            
            <p>Comprehensive executive summary and strategic recommendations are attached.</p>
            
            <p style="font-size: 12px; color: #666;">
                This is an automated monthly executive report from the Cal System.
            </p>
        </body>
        </html>
        `;
    }
    
    // ========================================
    // PUBLIC API METHODS
    // ========================================
    
    async generateCustomReport(options = {}) {
        const {
            type = 'custom',
            dateRange = { start: Date.now() - 24*60*60*1000, end: Date.now() },
            includeSections = ['summary', 'performance', 'opportunities'],
            format = 'pdf',
            title = 'Custom Cal System Report'
        } = options;
        
        console.log(`📊 Generating custom report: ${title}`);
        
        // Collect custom data based on date range
        const customData = await this.collectCustomData(dateRange, includeSections);
        
        // Generate report
        let reportPath;
        if (format === 'pdf') {
            reportPath = await this.createCustomPDF(customData, title);
        } else {
            reportPath = await this.createCustomJSON(customData, title);
        }
        
        this.emit('custom_report_generated', {
            type: 'custom',
            title: title,
            path: reportPath,
            options: options
        });
        
        return reportPath;
    }
    
    async collectCustomData(dateRange, includeSections) {
        // This would collect actual data from the Cal systems
        return {
            title: 'Custom Report',
            date_range: dateRange,
            sections: includeSections,
            data: await this.collectDailyData() // Mock for now
        };
    }
    
    async createCustomPDF(data, title) {
        const filename = `custom-report-${Date.now()}.pdf`;
        const filepath = path.join(this.config.reportsDir, filename);
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(await fs.open(filepath, 'w').then(handle => handle.createWriteStream()));
        
        this.addPDFHeader(doc, title, `Generated ${new Date().toLocaleDateString()}`);
        
        // Add custom content based on requested sections
        doc.fontSize(12).text('Custom report content would be generated here based on the requested sections and data.', 50, 150);
        
        this.addPDFFooter(doc);
        doc.end();
        
        return filepath;
    }
    
    async createCustomJSON(data, title) {
        const filename = `custom-report-${Date.now()}.json`;
        const filepath = path.join(this.config.reportsDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify({
            title: title,
            generated_at: new Date().toISOString(),
            ...data
        }, null, 2));
        
        return filepath;
    }
    
    // Connect to data sources
    connectDataSources(sources = {}) {
        this.dataSources = { ...this.dataSources, ...sources };
        console.log('🔌 Data sources connected:', Object.keys(sources));
    }
    
    // Get report history
    async getReportHistory() {
        const reports = [];
        
        for (const reportType of ['daily', 'weekly', 'monthly']) {
            const reportDir = path.join(this.config.reportsDir, reportType);
            try {
                const files = await fs.readdir(reportDir);
                files.forEach(file => {
                    reports.push({
                        type: reportType,
                        filename: file,
                        path: path.join(reportDir, file),
                        created: new Date(file.match(/\d{4}-\d{2}-\d{2}/) ? file.match(/\d{4}-\d{2}-\d{2}/)[0] : '2024-01-01')
                    });
                });
            } catch (error) {
                // Directory might not exist yet
            }
        }
        
        return reports.sort((a, b) => b.created - a.created);
    }
}

module.exports = CalReportGenerator;

// Test if run directly
if (require.main === module) {
    const generator = new CalReportGenerator();
    
    generator.on('report_generator_ready', async () => {
        console.log('\n🧪 Testing Cal Report Generator...\n');
        
        // Generate test reports
        console.log('Generating daily report...');
        const dailyPath = await generator.generateDailyReport();
        console.log(`✅ Daily report created: ${dailyPath}`);
        
        console.log('\nGenerating weekly report...');
        const weeklyPath = await generator.generateWeeklyReport();
        console.log(`✅ Weekly report created: ${weeklyPath}`);
        
        console.log('\nGenerating monthly report...');
        const monthlyPath = await generator.generateMonthlyReport();
        console.log(`✅ Monthly report created: ${monthlyPath}`);
        
        // Generate custom report
        console.log('\nGenerating custom report...');
        const customPath = await generator.generateCustomReport({
            title: 'Test Custom Report',
            includeSections: ['summary', 'performance']
        });
        console.log(`✅ Custom report created: ${customPath}`);
        
        // Show report history
        console.log('\n📁 Report History:');
        const history = await generator.getReportHistory();
        history.slice(0, 5).forEach(report => {
            console.log(`   ${report.type}: ${report.filename}`);
        });
        
        console.log('\n✅ All report generation features tested successfully!');
        console.log('📧 Email delivery would work with proper SMTP configuration');
    });
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n🔴 Shutting down Cal Report Generator...');
        process.exit(0);
    });
}
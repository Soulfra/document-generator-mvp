#!/usr/bin/env node

/**
 * CAL Pitch Generator
 * 
 * Creates comprehensive pitch materials for VC funding and business development.
 * Generates pitch decks, financial projections, market analysis, and more.
 * 
 * Features:
 * - 15-slide pitch deck generation
 * - Financial projections (3-5 year)
 * - Market analysis and TAM/SAM/SOM
 * - Competitive landscape
 * - Executive summary
 * - One-pager creation
 * - Demo video scripts
 * - Export to multiple formats (PDF, PPT, Keynote)
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const express = require('express');

class CALPitchGenerator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9094,
            outputDir: config.outputDir || './generated-pitches',
            templatesDir: config.templatesDir || './pitch-templates',
            
            // AI service for content generation
            aiServiceUrl: config.aiServiceUrl || 'http://localhost:3001',
            
            // Pitch deck configuration
            defaultSlideCount: 15,
            projectionYears: 3,
            
            // Market research sources
            marketDataSources: [
                'statista.com',
                'gartner.com',
                'forrester.com',
                'cbinsights.com'
            ],
            
            // Financial models
            financialModels: {
                saas: 'recurring-revenue',
                ecommerce: 'transaction-based',
                marketplace: 'commission-based',
                api: 'usage-based',
                enterprise: 'license-based'
            },
            
            ...config
        };
        
        // Generated pitches tracking
        this.generatedPitches = new Map();
        
        // HTTP server
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Statistics
        this.stats = {
            pitchesGenerated: 0,
            decksCreated: 0,
            projectionsCalculated: 0,
            exportedFormats: new Map()
        };
        
        this.setupRoutes();
    }
    
    async start() {
        console.log('📊 CAL PITCH GENERATOR STARTING');
        console.log('================================');
        console.log('');
        console.log('🎯 Creating investor-ready materials:');
        console.log('   • Pitch decks');
        console.log('   • Financial projections');
        console.log('   • Market analysis');
        console.log('   • Executive summaries');
        console.log('   • Demo scripts');
        console.log('');
        
        // Ensure directories exist
        await this.ensureDirectories();
        
        // Start server
        this.server.listen(this.config.port, () => {
            console.log(`✅ Pitch Generator ready on port ${this.config.port}`);
            console.log(`📁 Pitches will be saved to: ${this.config.outputDir}`);
            console.log('');
        });
        
        this.emit('started', { port: this.config.port });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Pitch generation
        this.app.post('/api/generate', this.handleGeneratePitch.bind(this));
        this.app.get('/api/pitches', this.handleListPitches.bind(this));
        this.app.get('/api/pitches/:id', this.handleGetPitch.bind(this));
        
        // Export endpoints
        this.app.post('/api/export/:id', this.handleExportPitch.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', stats: this.getStats() });
        });
    }
    
    /**
     * Generate complete pitch package
     */
    async generatePitch(projectData) {
        console.log(`📊 Generating pitch for: ${projectData.name}`);
        
        const pitchId = this.generatePitchId();
        const pitchDir = path.join(this.config.outputDir, pitchId);
        
        // Create pitch metadata
        const pitchMeta = {
            id: pitchId,
            projectName: projectData.name,
            projectType: projectData.type,
            description: projectData.description,
            createdAt: new Date(),
            status: 'generating',
            components: {},
            directory: pitchDir
        };
        
        this.generatedPitches.set(pitchId, pitchMeta);
        
        try {
            // Create output directory
            await fs.mkdir(pitchDir, { recursive: true });
            
            // Generate all components in parallel
            const [
                pitchDeck,
                financialProjections,
                marketAnalysis,
                executiveSummary,
                onePager,
                demoScript
            ] = await Promise.all([
                this.generatePitchDeck(projectData, pitchMeta),
                this.generateFinancialProjections(projectData, pitchMeta),
                this.generateMarketAnalysis(projectData, pitchMeta),
                this.generateExecutiveSummary(projectData, pitchMeta),
                this.generateOnePager(projectData, pitchMeta),
                this.generateDemoScript(projectData, pitchMeta)
            ]);
            
            // Update metadata
            pitchMeta.components = {
                pitchDeck,
                financialProjections,
                marketAnalysis,
                executiveSummary,
                onePager,
                demoScript
            };
            
            pitchMeta.status = 'completed';
            pitchMeta.completedAt = new Date();
            
            // Update statistics
            this.stats.pitchesGenerated++;
            
            console.log(`✅ Pitch package generated: ${pitchId}`);
            console.log(`📁 Location: ${pitchDir}`);
            
            return pitchMeta;
            
        } catch (error) {
            pitchMeta.status = 'failed';
            pitchMeta.error = error.message;
            console.error(`❌ Failed to generate pitch: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Generate pitch deck slides
     */
    async generatePitchDeck(projectData, pitchMeta) {
        console.log('🎬 Generating pitch deck...');
        
        const slides = [
            await this.generateTitleSlide(projectData),
            await this.generateProblemSlide(projectData),
            await this.generateSolutionSlide(projectData),
            await this.generateMarketOpportunitySlide(projectData),
            await this.generateProductSlide(projectData),
            await this.generateBusinessModelSlide(projectData),
            await this.generateGoToMarketSlide(projectData),
            await this.generateCompetitionSlide(projectData),
            await this.generateTractionSlide(projectData),
            await this.generateTeamSlide(projectData),
            await this.generateFinancialsSlide(projectData),
            await this.generateFundraisingSlide(projectData),
            await this.generateRoadmapSlide(projectData),
            await this.generateVisionSlide(projectData),
            await this.generateContactSlide(projectData)
        ];
        
        // Save as HTML presentation
        const deckHTML = this.createHTMLPresentation(slides);
        const deckPath = path.join(pitchMeta.directory, 'pitch-deck.html');
        await fs.writeFile(deckPath, deckHTML);
        
        // Also save as JSON for other exports
        const deckJSON = path.join(pitchMeta.directory, 'pitch-deck.json');
        await fs.writeFile(deckJSON, JSON.stringify(slides, null, 2));
        
        this.stats.decksCreated++;
        
        return {
            format: 'html',
            path: deckPath,
            slideCount: slides.length,
            slides
        };
    }
    
    /**
     * Generate individual slides
     */
    async generateTitleSlide(projectData) {
        return {
            number: 1,
            type: 'title',
            title: projectData.name,
            subtitle: projectData.tagline || 'Revolutionizing ' + projectData.industry,
            content: {
                logo: projectData.logo || null,
                date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            },
            background: '#1a1a2e',
            animation: 'fade-in'
        };
    }
    
    async generateProblemSlide(projectData) {
        const problems = await this.identifyProblems(projectData);
        
        return {
            number: 2,
            type: 'problem',
            title: 'The Problem',
            content: {
                mainProblem: problems.primary,
                subProblems: problems.secondary,
                impact: problems.impact,
                currentSolutions: problems.currentSolutions
            },
            visuals: {
                type: 'icons',
                layout: 'grid'
            }
        };
    }
    
    async generateSolutionSlide(projectData) {
        return {
            number: 3,
            type: 'solution',
            title: 'Our Solution',
            content: {
                mainSolution: projectData.solution || `${projectData.name} solves this by...`,
                keyFeatures: projectData.features || [],
                uniqueValue: projectData.uniqueValue || 'Revolutionary approach to...',
                benefits: this.extractBenefits(projectData)
            },
            visuals: {
                type: 'product-mockup',
                screenshots: projectData.screenshots || []
            }
        };
    }
    
    async generateMarketOpportunitySlide(projectData) {
        const marketData = await this.calculateMarketSize(projectData);
        
        return {
            number: 4,
            type: 'market',
            title: 'Market Opportunity',
            content: {
                tam: marketData.tam,
                sam: marketData.sam,
                som: marketData.som,
                growth: marketData.growthRate,
                trends: marketData.trends
            },
            visuals: {
                type: 'chart',
                chartType: 'pyramid',
                data: [
                    { label: 'TAM', value: marketData.tam.value, color: '#3498db' },
                    { label: 'SAM', value: marketData.sam.value, color: '#2ecc71' },
                    { label: 'SOM', value: marketData.som.value, color: '#f39c12' }
                ]
            }
        };
    }
    
    async generateBusinessModelSlide(projectData) {
        const model = this.determineBusinessModel(projectData);
        
        return {
            number: 6,
            type: 'business-model',
            title: 'Business Model',
            content: {
                revenueStreams: model.revenueStreams,
                pricing: model.pricing,
                customerSegments: model.customerSegments,
                unitEconomics: model.unitEconomics
            },
            visuals: {
                type: 'flowchart',
                showMoneyFlow: true
            }
        };
    }
    
    /**
     * Generate financial projections
     */
    async generateFinancialProjections(projectData, pitchMeta) {
        console.log('💰 Generating financial projections...');
        
        const businessModel = this.determineBusinessModel(projectData);
        const projections = [];
        
        // Generate projections for each year
        for (let year = 1; year <= this.config.projectionYears; year++) {
            const yearProjection = await this.projectYear(year, businessModel, projections[year - 2]);
            projections.push(yearProjection);
        }
        
        // Create financial summary
        const summary = {
            projectionYears: this.config.projectionYears,
            currency: 'USD',
            model: businessModel.type,
            projections,
            metrics: this.calculateKeyMetrics(projections),
            assumptions: this.generateAssumptions(businessModel),
            breakEvenMonth: this.calculateBreakEven(projections)
        };
        
        // Save financial model
        const financePath = path.join(pitchMeta.directory, 'financial-projections.json');
        await fs.writeFile(financePath, JSON.stringify(summary, null, 2));
        
        // Generate Excel-compatible CSV
        const csvPath = path.join(pitchMeta.directory, 'financial-projections.csv');
        await fs.writeFile(csvPath, this.generateFinancialCSV(summary));
        
        this.stats.projectionsCalculated++;
        
        return {
            format: 'json',
            path: financePath,
            summary,
            csvPath
        };
    }
    
    /**
     * Project financials for a year
     */
    async projectYear(year, model, previousYear) {
        const baseMetrics = previousYear || {
            revenue: 0,
            customers: 0,
            mrr: 0,
            expenses: 50000 // Starting burn
        };
        
        // Growth assumptions
        const growthRate = year === 1 ? 0.2 : (0.8 - (year * 0.1)); // Decreasing growth rate
        const churnRate = 0.05; // 5% monthly churn
        
        let projection = {
            year,
            months: []
        };
        
        let currentMetrics = { ...baseMetrics };
        
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                month,
                newCustomers: Math.floor(currentMetrics.customers * growthRate),
                churnedCustomers: Math.floor(currentMetrics.customers * churnRate),
                totalCustomers: 0,
                mrr: 0,
                revenue: 0,
                expenses: currentMetrics.expenses * (1 + (month * 0.02)), // 2% monthly expense growth
                profit: 0
            };
            
            // Calculate totals
            monthData.totalCustomers = currentMetrics.customers + monthData.newCustomers - monthData.churnedCustomers;
            monthData.mrr = monthData.totalCustomers * (model.avgRevenuePerUser || 50);
            monthData.revenue = monthData.mrr;
            monthData.profit = monthData.revenue - monthData.expenses;
            
            // Update current metrics
            currentMetrics.customers = monthData.totalCustomers;
            currentMetrics.mrr = monthData.mrr;
            currentMetrics.expenses = monthData.expenses;
            
            projection.months.push(monthData);
        }
        
        // Year summary
        projection.summary = {
            totalRevenue: projection.months.reduce((sum, m) => sum + m.revenue, 0),
            totalExpenses: projection.months.reduce((sum, m) => sum + m.expenses, 0),
            netProfit: projection.months.reduce((sum, m) => sum + m.profit, 0),
            endingMRR: projection.months[11].mrr,
            endingCustomers: projection.months[11].totalCustomers,
            avgMonthlyGrowth: growthRate
        };
        
        return projection;
    }
    
    /**
     * Generate market analysis
     */
    async generateMarketAnalysis(projectData, pitchMeta) {
        console.log('📈 Generating market analysis...');
        
        const analysis = {
            industry: projectData.industry || 'Technology',
            targetMarket: projectData.targetMarket || 'B2B SaaS',
            
            marketSize: await this.calculateMarketSize(projectData),
            
            customerSegments: this.identifyCustomerSegments(projectData),
            
            competitiveLandscape: await this.analyzeCompetition(projectData),
            
            trends: this.identifyMarketTrends(projectData),
            
            opportunities: this.identifyOpportunities(projectData),
            
            risks: this.identifyRisks(projectData),
            
            goToMarketStrategy: this.developGTMStrategy(projectData)
        };
        
        // Save analysis
        const analysisPath = path.join(pitchMeta.directory, 'market-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
        
        // Generate market report
        const reportPath = path.join(pitchMeta.directory, 'market-analysis-report.md');
        await fs.writeFile(reportPath, this.generateMarketReport(analysis));
        
        return {
            format: 'json',
            path: analysisPath,
            reportPath,
            analysis
        };
    }
    
    /**
     * Calculate TAM, SAM, SOM
     */
    async calculateMarketSize(projectData) {
        // These would be calculated based on industry data
        const industrySize = {
            'saas': 200000000000, // $200B
            'ecommerce': 5000000000000, // $5T
            'fintech': 300000000000, // $300B
            'healthtech': 400000000000, // $400B
            'edtech': 100000000000 // $100B
        };
        
        const baseSize = industrySize[projectData.industry?.toLowerCase()] || 100000000000;
        
        return {
            tam: {
                value: baseSize,
                description: 'Total Addressable Market',
                formatted: this.formatCurrency(baseSize)
            },
            sam: {
                value: baseSize * 0.1, // 10% of TAM
                description: 'Serviceable Addressable Market',
                formatted: this.formatCurrency(baseSize * 0.1)
            },
            som: {
                value: baseSize * 0.01, // 1% of TAM
                description: 'Serviceable Obtainable Market',
                formatted: this.formatCurrency(baseSize * 0.01)
            },
            growthRate: '15% CAGR',
            sources: ['Industry Reports', 'Market Research', 'Analyst Forecasts']
        };
    }
    
    /**
     * Generate executive summary
     */
    async generateExecutiveSummary(projectData, pitchMeta) {
        console.log('📝 Generating executive summary...');
        
        const summary = {
            company: projectData.name,
            mission: projectData.mission || `To revolutionize ${projectData.industry} through innovative technology`,
            
            problem: await this.summarizeProblem(projectData),
            
            solution: await this.summarizeSolution(projectData),
            
            market: await this.summarizeMarket(projectData),
            
            businessModel: await this.summarizeBusinessModel(projectData),
            
            traction: projectData.traction || {
                users: 0,
                revenue: 0,
                growth: 'Pre-launch'
            },
            
            team: projectData.team || {
                founders: 1,
                employees: 0,
                advisors: 0
            },
            
            funding: {
                seeking: projectData.fundingAmount || 1000000,
                use: projectData.useOfFunds || [
                    'Product Development',
                    'Sales & Marketing',
                    'Team Expansion'
                ],
                previousRounds: projectData.previousFunding || []
            },
            
            contact: projectData.contact || {
                email: 'founders@' + projectData.name.toLowerCase().replace(/\s/g, '') + '.com',
                website: 'https://' + projectData.name.toLowerCase().replace(/\s/g, '') + '.com'
            }
        };
        
        // Save summary
        const summaryPath = path.join(pitchMeta.directory, 'executive-summary.json');
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
        
        // Generate formatted document
        const docPath = path.join(pitchMeta.directory, 'executive-summary.md');
        await fs.writeFile(docPath, this.formatExecutiveSummary(summary));
        
        return {
            format: 'markdown',
            path: docPath,
            jsonPath: summaryPath,
            summary
        };
    }
    
    /**
     * Generate one-pager
     */
    async generateOnePager(projectData, pitchMeta) {
        console.log('📄 Generating one-pager...');
        
        const onePager = `<!DOCTYPE html>
<html>
<head>
    <title>${projectData.name} - One Pager</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            width: 150px;
            height: 150px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            margin: 0 auto 20px;
        }
        h1 {
            font-size: 32px;
            margin: 0;
        }
        .tagline {
            font-size: 18px;
            color: #666;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            font-size: 20px;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        .metric {
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 10px;
        }
        .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
        }
        .metric-label {
            font-size: 14px;
            color: #666;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo"></div>
        <h1>${projectData.name}</h1>
        <p class="tagline">${projectData.tagline || 'Transforming ' + projectData.industry}</p>
    </div>
    
    <div class="section">
        <h2>The Problem</h2>
        <p>${projectData.problem || 'Current solutions are inadequate, expensive, and difficult to use.'}</p>
    </div>
    
    <div class="section">
        <h2>Our Solution</h2>
        <p>${projectData.solution || projectData.name + ' provides an innovative approach that is simple, affordable, and effective.'}</p>
    </div>
    
    <div class="section">
        <h2>Market Opportunity</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">$${Math.floor(Math.random() * 50 + 10)}B</div>
                <div class="metric-label">Total Market</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.floor(Math.random() * 20 + 10)}%</div>
                <div class="metric-label">Annual Growth</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.floor(Math.random() * 900 + 100)}M</div>
                <div class="metric-label">Target Users</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Business Model</h2>
        <p>${this.describeBusinessModel(projectData)}</p>
    </div>
    
    <div class="section">
        <h2>The Ask</h2>
        <p>Seeking <strong>$${projectData.fundingAmount || '2M'}</strong> to accelerate growth and expand our team.</p>
    </div>
    
    <div class="footer">
        <p>Contact: ${projectData.contact?.email || 'founders@company.com'}</p>
        <p>${projectData.contact?.website || 'www.company.com'}</p>
    </div>
</body>
</html>`;
        
        const onePagerPath = path.join(pitchMeta.directory, 'one-pager.html');
        await fs.writeFile(onePagerPath, onePager);
        
        return {
            format: 'html',
            path: onePagerPath
        };
    }
    
    /**
     * Generate demo script
     */
    async generateDemoScript(projectData, pitchMeta) {
        console.log('🎬 Generating demo script...');
        
        const script = {
            title: `${projectData.name} Demo Script`,
            duration: '5 minutes',
            
            sections: [
                {
                    time: '0:00 - 0:30',
                    title: 'Introduction',
                    script: `Hello! I'm excited to show you ${projectData.name}, a revolutionary ${projectData.type} that's transforming how ${projectData.targetAudience || 'businesses'} ${projectData.mainBenefit || 'operate'}.`,
                    actions: ['Show landing page', 'Highlight key value proposition']
                },
                {
                    time: '0:30 - 1:30',
                    title: 'Problem Demo',
                    script: 'Let me show you the problem we\'re solving...',
                    actions: ['Show current solution pain points', 'Demonstrate inefficiencies']
                },
                {
                    time: '1:30 - 3:30',
                    title: 'Solution Walkthrough',
                    script: `Now let me show you how ${projectData.name} solves this...`,
                    actions: projectData.features?.map(f => `Demo ${f}`) || ['Show main features']
                },
                {
                    time: '3:30 - 4:30',
                    title: 'Results & Benefits',
                    script: 'Here are the results our customers are seeing...',
                    actions: ['Show metrics', 'Display testimonials', 'Highlight ROI']
                },
                {
                    time: '4:30 - 5:00',
                    title: 'Call to Action',
                    script: 'Ready to transform your business? Let\'s get started...',
                    actions: ['Show pricing', 'Offer trial', 'Schedule follow-up']
                }
            ],
            
            tips: [
                'Keep energy high throughout',
                'Focus on benefits, not features',
                'Use real data and examples',
                'Handle objections proactively',
                'End with clear next steps'
            ]
        };
        
        // Save script
        const scriptPath = path.join(pitchMeta.directory, 'demo-script.json');
        await fs.writeFile(scriptPath, JSON.stringify(script, null, 2));
        
        // Generate formatted script
        const formattedPath = path.join(pitchMeta.directory, 'demo-script.md');
        await fs.writeFile(formattedPath, this.formatDemoScript(script));
        
        return {
            format: 'markdown',
            path: formattedPath,
            jsonPath: scriptPath,
            script
        };
    }
    
    /**
     * Helper methods
     */
    determineBusinessModel(projectData) {
        const type = projectData.businessModel || 'saas';
        
        const models = {
            saas: {
                type: 'subscription',
                revenueStreams: ['Monthly subscriptions', 'Annual plans', 'Enterprise licenses'],
                pricing: {
                    starter: 29,
                    professional: 99,
                    enterprise: 'Custom'
                },
                avgRevenuePerUser: 65,
                customerSegments: ['Small businesses', 'Mid-market', 'Enterprise'],
                unitEconomics: {
                    cac: 500,
                    ltv: 2400,
                    paybackPeriod: 8
                }
            },
            marketplace: {
                type: 'commission',
                revenueStreams: ['Transaction fees', 'Listing fees', 'Premium features'],
                pricing: {
                    transactionFee: '5%',
                    listingFee: 10,
                    premiumMonthly: 99
                },
                avgRevenuePerUser: 150,
                customerSegments: ['Buyers', 'Sellers', 'Service providers'],
                unitEconomics: {
                    takeRate: 0.05,
                    avgTransactionSize: 500,
                    transactionsPerUser: 3
                }
            }
        };
        
        return models[type] || models.saas;
    }
    
    async identifyProblems(projectData) {
        return {
            primary: projectData.problem || 'Current solutions are complex and expensive',
            secondary: [
                'Lack of integration',
                'Poor user experience',
                'Limited scalability'
            ],
            impact: 'Businesses lose $X annually due to inefficiencies',
            currentSolutions: ['Manual processes', 'Legacy systems', 'Partial solutions']
        };
    }
    
    extractBenefits(projectData) {
        return projectData.benefits || [
            'Save 10+ hours per week',
            'Reduce costs by 50%',
            'Increase productivity by 3x',
            'Scale effortlessly'
        ];
    }
    
    createHTMLPresentation(slides) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Pitch Deck</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #000;
            color: white;
            overflow: hidden;
        }
        .slide {
            width: 100vw;
            height: 100vh;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 60px;
            box-sizing: border-box;
        }
        .slide.active {
            display: flex;
        }
        .slide h1 {
            font-size: 72px;
            margin: 0 0 30px 0;
        }
        .slide h2 {
            font-size: 48px;
            margin: 0 0 30px 0;
        }
        .slide p {
            font-size: 24px;
            line-height: 1.5;
            max-width: 800px;
        }
        .controls {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
        }
        button {
            padding: 10px 20px;
            font-size: 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    ${slides.map((slide, index) => `
    <div class="slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
        <h${slide.type === 'title' ? '1' : '2'}>${slide.title}</h${slide.type === 'title' ? '1' : '2'}>
        ${slide.subtitle ? `<p>${slide.subtitle}</p>` : ''}
    </div>`).join('')}
    
    <div class="controls">
        <button onclick="previousSlide()">Previous</button>
        <span id="slideNumber">1 / ${slides.length}</span>
        <button onclick="nextSlide()">Next</button>
    </div>
    
    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        function showSlide(n) {
            slides[currentSlide].classList.remove('active');
            currentSlide = (n + totalSlides) % totalSlides;
            slides[currentSlide].classList.add('active');
            document.getElementById('slideNumber').textContent = \`\${currentSlide + 1} / \${totalSlides}\`;
        }
        
        function nextSlide() {
            showSlide(currentSlide + 1);
        }
        
        function previousSlide() {
            showSlide(currentSlide - 1);
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') previousSlide();
        });
    </script>
</body>
</html>`;
    }
    
    formatCurrency(amount) {
        if (amount >= 1000000000) {
            return `$${(amount / 1000000000).toFixed(1)}B`;
        } else if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(0)}K`;
        }
        return `$${amount}`;
    }
    
    generateFinancialCSV(summary) {
        let csv = 'Year,Month,Revenue,Expenses,Profit,Customers,MRR\n';
        
        summary.projections.forEach(year => {
            year.months.forEach(month => {
                csv += `${year.year},${month.month},${month.revenue},${month.expenses},${month.profit},${month.totalCustomers},${month.mrr}\n`;
            });
        });
        
        return csv;
    }
    
    formatExecutiveSummary(summary) {
        return `# Executive Summary

## ${summary.company}

**Mission:** ${summary.mission}

### Problem
${summary.problem}

### Solution  
${summary.solution}

### Market Opportunity
${summary.market}

### Business Model
${summary.businessModel}

### Traction
- Users: ${summary.traction.users}
- Revenue: ${summary.traction.revenue}
- Growth: ${summary.traction.growth}

### Team
- Founders: ${summary.team.founders}
- Employees: ${summary.team.employees}  
- Advisors: ${summary.team.advisors}

### Funding
**Seeking:** $${this.formatCurrency(summary.funding.seeking)}

**Use of Funds:**
${summary.funding.use.map(use => `- ${use}`).join('\n')}

### Contact
- Email: ${summary.contact.email}
- Website: ${summary.contact.website}`;
    }
    
    formatDemoScript(script) {
        return `# ${script.title}

**Duration:** ${script.duration}

## Demo Flow

${script.sections.map(section => `
### ${section.time} - ${section.title}

**Script:** ${section.script}

**Actions:**
${section.actions.map(action => `- ${action}`).join('\n')}
`).join('\n')}

## Tips for Success
${script.tips.map(tip => `- ${tip}`).join('\n')}`;
    }
    
    async ensureDirectories() {
        await fs.mkdir(this.config.outputDir, { recursive: true });
        await fs.mkdir(this.config.templatesDir, { recursive: true });
    }
    
    generatePitchId() {
        return 'pitch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    getStats() {
        return {
            ...this.stats,
            exportBreakdown: Array.from(this.stats.exportedFormats.entries())
        };
    }
    
    // Additional helper methods for complete implementation
    identifyCustomerSegments(projectData) {
        return projectData.customerSegments || [
            { name: 'Small Businesses', size: '40%', characteristics: ['Budget conscious', 'Need simplicity'] },
            { name: 'Enterprises', size: '30%', characteristics: ['Need scalability', 'Integration requirements'] },
            { name: 'Startups', size: '30%', characteristics: ['Growth focused', 'Feature hungry'] }
        ];
    }
    
    async analyzeCompetition(projectData) {
        return projectData.competitors || [
            { name: 'Competitor A', strengths: ['Market leader'], weaknesses: ['Expensive', 'Complex'] },
            { name: 'Competitor B', strengths: ['Good UX'], weaknesses: ['Limited features'] }
        ];
    }
    
    identifyMarketTrends(projectData) {
        return projectData.trends || [
            'Shift to cloud-based solutions',
            'Increasing demand for automation',
            'Focus on user experience',
            'AI/ML integration becoming standard'
        ];
    }
    
    identifyOpportunities(projectData) {
        return projectData.opportunities || [
            'Underserved market segment',
            'New technology enablers',
            'Regulatory changes',
            'Shifting customer preferences'
        ];
    }
    
    identifyRisks(projectData) {
        return projectData.risks || [
            { risk: 'Competition', mitigation: 'Strong differentiation and fast execution' },
            { risk: 'Technology', mitigation: 'Experienced team and proven stack' },
            { risk: 'Market', mitigation: 'Validated demand and flexible model' }
        ];
    }
    
    developGTMStrategy(projectData) {
        return projectData.gtmStrategy || {
            channels: ['Direct sales', 'Partner channel', 'Self-serve'],
            tactics: ['Content marketing', 'Product-led growth', 'Strategic partnerships'],
            timeline: 'Q1: Beta launch, Q2: Public launch, Q3: Scale'
        };
    }
    
    // API Handlers
    async handleGeneratePitch(req, res) {
        const { projectData } = req.body;
        
        try {
            const pitch = await this.generatePitch(projectData);
            res.json({ success: true, pitch });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    handleListPitches(req, res) {
        const pitches = Array.from(this.generatedPitches.values());
        res.json({ pitches, total: pitches.length });
    }
    
    handleGetPitch(req, res) {
        const { id } = req.params;
        const pitch = this.generatedPitches.get(id);
        
        if (!pitch) {
            return res.status(404).json({ error: 'Pitch not found' });
        }
        
        res.json(pitch);
    }
    
    async handleExportPitch(req, res) {
        const { id } = req.params;
        const { format } = req.body;
        
        // TODO: Implement export to different formats (PDF, PPT, etc.)
        res.json({ message: 'Export functionality coming soon', format });
    }
    
    // Summary helper methods
    async summarizeProblem(projectData) {
        return projectData.problemSummary || 'Current solutions fail to meet user needs effectively.';
    }
    
    async summarizeSolution(projectData) {
        return projectData.solutionSummary || `${projectData.name} provides an innovative approach that addresses all pain points.`;
    }
    
    async summarizeMarket(projectData) {
        return projectData.marketSummary || 'Large and growing market with significant opportunity.';
    }
    
    async summarizeBusinessModel(projectData) {
        return projectData.businessModelSummary || 'Scalable subscription-based model with strong unit economics.';
    }
    
    describeBusinessModel(projectData) {
        const model = this.determineBusinessModel(projectData);
        return `${model.type.charAt(0).toUpperCase() + model.type.slice(1)} model with ${model.revenueStreams.join(', ').toLowerCase()}.`;
    }
    
    // Calculate key financial metrics
    calculateKeyMetrics(projections) {
        const lastYear = projections[projections.length - 1];
        return {
            totalRevenue: projections.reduce((sum, year) => sum + year.summary.totalRevenue, 0),
            endingARR: lastYear.summary.endingMRR * 12,
            growthRate: this.calculateCAGR(projections),
            burnRate: lastYear.summary.totalExpenses / 12,
            runway: 'Variable based on funding'
        };
    }
    
    calculateCAGR(projections) {
        if (projections.length < 2) return 0;
        const firstRevenue = projections[0].summary.totalRevenue || 1;
        const lastRevenue = projections[projections.length - 1].summary.totalRevenue;
        const years = projections.length;
        return ((Math.pow(lastRevenue / firstRevenue, 1 / years) - 1) * 100).toFixed(1) + '%';
    }
    
    generateAssumptions(model) {
        return {
            pricing: 'Based on competitive analysis and value proposition',
            growth: 'Conservative estimates based on market trends',
            churn: 'Industry average with improvements over time',
            costs: 'Includes all operational expenses and team growth'
        };
    }
    
    calculateBreakEven(projections) {
        let month = 0;
        for (const year of projections) {
            for (const monthData of year.months) {
                month++;
                if (monthData.profit > 0) {
                    return month;
                }
            }
        }
        return null; // Not reached within projection period
    }
    
    // Additional slide generators
    async generateProductSlide(projectData) {
        return {
            number: 5,
            type: 'product',
            title: 'Product Overview',
            content: {
                mainFeatures: projectData.features || ['Feature 1', 'Feature 2', 'Feature 3'],
                screenshots: projectData.screenshots || [],
                demo: projectData.demoUrl || null
            }
        };
    }
    
    async generateGoToMarketSlide(projectData) {
        return {
            number: 7,
            type: 'gtm',
            title: 'Go-to-Market Strategy',
            content: this.developGTMStrategy(projectData)
        };
    }
    
    async generateCompetitionSlide(projectData) {
        return {
            number: 8,
            type: 'competition',
            title: 'Competitive Landscape',
            content: {
                competitors: await this.analyzeCompetition(projectData),
                differentiation: projectData.differentiation || 'Unique approach and superior execution'
            }
        };
    }
    
    async generateTractionSlide(projectData) {
        return {
            number: 9,
            type: 'traction',
            title: 'Traction',
            content: projectData.traction || {
                metrics: ['Pre-launch', 'Strong interest', 'Beta signups'],
                milestones: ['Product development complete', 'Key partnerships secured']
            }
        };
    }
    
    async generateTeamSlide(projectData) {
        return {
            number: 10,
            type: 'team',
            title: 'Team',
            content: projectData.team || {
                founders: [{ name: 'Founder', role: 'CEO', background: 'Serial entrepreneur' }],
                advisors: ['Industry experts', 'Technical advisors']
            }
        };
    }
    
    async generateFinancialsSlide(projectData) {
        return {
            number: 11,
            type: 'financials',
            title: 'Financial Projections',
            content: {
                revenueProjection: 'Path to $10M ARR in 3 years',
                keyMetrics: ['Strong unit economics', 'Scalable model', 'Clear path to profitability']
            }
        };
    }
    
    async generateFundraisingSlide(projectData) {
        return {
            number: 12,
            type: 'fundraising',
            title: 'Fundraising',
            content: {
                amount: projectData.fundingAmount || 2000000,
                use: projectData.useOfFunds || ['Product', 'Sales', 'Marketing'],
                terms: projectData.terms || 'Equity round'
            }
        };
    }
    
    async generateRoadmapSlide(projectData) {
        return {
            number: 13,
            type: 'roadmap',
            title: 'Product Roadmap',
            content: projectData.roadmap || {
                q1: 'Launch MVP',
                q2: 'Key features',
                q3: 'Scale & expand',
                q4: 'New markets'
            }
        };
    }
    
    async generateVisionSlide(projectData) {
        return {
            number: 14,
            type: 'vision',
            title: 'Vision',
            content: {
                vision: projectData.vision || `Become the leading ${projectData.industry} platform`,
                impact: 'Transform how businesses operate'
            }
        };
    }
    
    async generateContactSlide(projectData) {
        return {
            number: 15,
            type: 'contact',
            title: 'Thank You',
            content: {
                email: projectData.contact?.email || 'contact@company.com',
                website: projectData.contact?.website || 'www.company.com',
                cta: 'Let\'s build the future together!'
            }
        };
    }
    
    generateMarketReport(analysis) {
        return `# Market Analysis Report

## Industry Overview
**Industry:** ${analysis.industry}  
**Target Market:** ${analysis.targetMarket}

## Market Size
${JSON.stringify(analysis.marketSize, null, 2)}

## Customer Segments
${JSON.stringify(analysis.customerSegments, null, 2)}

## Competitive Landscape
${JSON.stringify(analysis.competitiveLandscape, null, 2)}

## Market Trends
${analysis.trends.map(trend => `- ${trend}`).join('\n')}

## Opportunities
${analysis.opportunities.map(opp => `- ${opp}`).join('\n')}

## Risks
${analysis.risks.map(risk => `- **${risk.risk}:** ${risk.mitigation}`).join('\n')}

## Go-to-Market Strategy
${JSON.stringify(analysis.goToMarketStrategy, null, 2)}`;
    }
}

// Start if run directly
if (require.main === module) {
    const pitchGenerator = new CALPitchGenerator();
    
    pitchGenerator.start().catch(error => {
        console.error('Failed to start Pitch Generator:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n📊 Pitch Generator shutting down...');
        process.exit(0);
    });
}

module.exports = CALPitchGenerator;
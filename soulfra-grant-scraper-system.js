#!/usr/bin/env node

/**
 * 💰🔍📝 SOULFRA GRANT SCRAPER & AUTO-FILL SYSTEM
 * ===============================================
 * Scrapes funding opportunities, matches to Soulfra capabilities,
 * auto-fills grant applications for bootstrap funding
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { URL } = require('url');

class SoulframGrantScraperSystem {
    constructor() {
        this.port = 2500;
        
        // Soulfra Company Profile
        this.soulframProfile = {
            company: 'Soulfra',
            industry: 'AI/Technology',
            stage: 'Early-stage startup',
            founded: '2024',
            employees: '1-5',
            location: 'United States',
            capabilities: [
                'AI Development',
                'Blockchain Technology', 
                'Web Applications',
                'Document Processing',
                'Knowledge Management',
                'Automation Systems',
                'Data Analytics',
                'Machine Learning',
                'Software Architecture',
                'System Integration'
            ],
            technologies: [
                'JavaScript/Node.js',
                'AI/ML frameworks',
                'Blockchain systems',
                'Web technologies',
                'Database systems',
                'Cloud platforms',
                'API development',
                'Automation tools'
            ],
            businessModel: [
                'SaaS platforms',
                'AI-powered tools',
                'Consulting services',
                'Custom development',
                'Technology licensing'
            ],
            fundingNeeds: {
                amount: '$50k-$500k',
                purpose: 'Product development, market validation, team expansion',
                timeline: '12-24 months',
                useOfFunds: [
                    'AI development (40%)',
                    'Platform development (30%)',
                    'Marketing/Sales (20%)',
                    'Operations (10%)'
                ]
            }
        };

        // Grant Database Sources
        this.grantSources = {
            federal: new Map(),
            state: new Map(),
            private: new Map(),
            accelerators: new Map()
        };

        // Grant Scraping System
        this.grantScraper = {
            activeScrapings: new Map(),
            scrapingQueue: [],
            discoveredGrants: new Map(),
            matchedGrants: new Map(),
            applications: new Map()
        };

        // Auto-Fill System
        this.autoFill = {
            templates: new Map(),
            generatedContent: new Map(),
            applicationHistory: new Map(),
            successPatterns: new Map()
        };

        this.setupGrantSources();
        this.setupAutoFillTemplates();
        this.setupSoulframContexts();
    }

    setupGrantSources() {
        // Federal grant sources
        this.grantSources.federal.set('grants.gov', {
            url: 'https://www.grants.gov',
            apiUrl: 'https://www.grants.gov/grantsws/rest',
            scrapingMethod: 'api_and_html',
            categories: ['technology', 'small-business', 'innovation', 'research'],
            rateLimit: 2000,
            active: true
        });

        this.grantSources.federal.set('sbir', {
            url: 'https://www.sbir.gov',
            scrapingMethod: 'html',
            categories: ['sbir', 'sttr', 'technology', 'innovation'],
            rateLimit: 3000,
            active: true
        });

        this.grantSources.federal.set('nsf', {
            url: 'https://www.nsf.gov/funding',
            scrapingMethod: 'html', 
            categories: ['computer-science', 'engineering', 'innovation'],
            rateLimit: 2500,
            active: true
        });

        // State and local sources
        this.grantSources.state.set('nist', {
            url: 'https://www.nist.gov/mep',
            scrapingMethod: 'html',
            categories: ['manufacturing', 'technology', 'small-business'],
            rateLimit: 2000,
            active: true
        });

        // Private foundations and accelerators
        this.grantSources.private.set('techstars', {
            url: 'https://www.techstars.com',
            scrapingMethod: 'html',
            categories: ['accelerator', 'startup-funding', 'technology'],
            rateLimit: 2000,
            active: true
        });

        this.grantSources.accelerators.set('ycombinator', {
            url: 'https://www.ycombinator.com',
            scrapingMethod: 'html',
            categories: ['accelerator', 'seed-funding', 'startup'],
            rateLimit: 2000,
            active: true
        });
    }

    setupAutoFillTemplates() {
        // Company overview template
        this.autoFill.templates.set('company-overview', {
            template: `
            Soulfra is an innovative technology company focused on AI-powered solutions 
            for knowledge management and automation. Founded in 2024, we develop cutting-edge 
            software that combines artificial intelligence, blockchain technology, and 
            modern web platforms to solve complex business problems.
            
            Our core competencies include:
            - AI development and machine learning
            - Blockchain and distributed systems
            - Web application development
            - Document processing and knowledge extraction
            - Automation and workflow optimization
            
            We are seeking funding to accelerate product development and market expansion.
            `,
            variables: ['funding_amount', 'timeline', 'specific_use']
        });

        this.autoFill.templates.set('technical-approach', {
            template: `
            Our technical approach leverages modern AI and blockchain technologies:
            
            1. AI/ML Framework: We utilize advanced machine learning algorithms for 
               knowledge extraction, pattern recognition, and automated decision making.
            
            2. Blockchain Integration: Our systems incorporate blockchain technology 
               for data integrity, verification, and distributed consensus.
            
            3. Web Architecture: Modern web technologies enable scalable, responsive 
               applications with real-time capabilities.
            
            4. System Integration: APIs and microservices architecture allow 
               seamless integration with existing business systems.
            `,
            variables: ['specific_technology', 'innovation_aspect', 'differentiation']
        });

        this.autoFill.templates.set('market-opportunity', {
            template: `
            The market opportunity for AI-powered automation and knowledge management 
            solutions is substantial and growing rapidly:
            
            - Market Size: The global AI market is projected to reach $1.8 trillion by 2030
            - Growth Rate: 38% CAGR in enterprise AI adoption
            - Pain Points: Organizations struggle with information overload and manual processes
            - Our Solution: Automated knowledge extraction and intelligent workflow management
            
            Target customers include enterprises seeking to digitize operations, 
            improve decision making, and reduce manual work through AI automation.
            `,
            variables: ['market_size', 'target_segment', 'competitive_advantage']
        });

        this.autoFill.templates.set('team-qualifications', {
            template: `
            The Soulfra team combines deep technical expertise with proven execution ability:
            
            Founder/CTO: Extensive experience in software development, AI/ML systems, 
            and blockchain technology. Track record of building complex technical systems 
            and bringing innovative products to market.
            
            Technical Approach: Our development methodology emphasizes rapid prototyping, 
            iterative improvement, and user-centered design. We leverage modern development 
            practices including automated testing, continuous integration, and scalable 
            cloud architecture.
            `,
            variables: ['specific_experience', 'previous_successes', 'technical_credentials']
        });
    }

    setupSoulframContexts() {
        // Define different contexts for Soulfra applications
        this.autoFill.templates.set('ai-focused-context', {
            emphasis: 'AI and machine learning capabilities',
            keywords: ['artificial intelligence', 'machine learning', 'automation', 'data processing'],
            strengths: ['AI algorithm development', 'knowledge extraction', 'pattern recognition'],
            applications: ['intelligent document processing', 'automated decision systems', 'predictive analytics']
        });

        this.autoFill.templates.set('blockchain-focused-context', {
            emphasis: 'Blockchain and distributed systems',
            keywords: ['blockchain', 'distributed systems', 'verification', 'security'],
            strengths: ['blockchain development', 'smart contracts', 'data integrity'],
            applications: ['supply chain verification', 'secure data sharing', 'decentralized applications']
        });

        this.autoFill.templates.set('small-business-context', {
            emphasis: 'Small business and entrepreneurship',
            keywords: ['small business', 'startup', 'innovation', 'growth'],
            strengths: ['rapid development', 'market agility', 'customer focus'],
            applications: ['business automation', 'workflow optimization', 'customer solutions']
        });
    }

    async startGrantScraperSystem() {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(this.port, () => {
            console.log(`💰🔍📝 Soulfra Grant Scraper running on port ${this.port}`);
            this.initializeGrantScraping();
        });
    }

    async initializeGrantScraping() {
        console.log('💰 Initializing Soulfra grant scraping system...');
        
        // Start grant discovery cycle
        this.startGrantDiscoveryCycle();
        
        // Begin scraping major grant sources
        this.queueInitialGrantScraping();
        
        console.log('✅ Grant scraper operational - seeking funding for Soulfra!');
    }

    startGrantDiscoveryCycle() {
        // Continuous grant discovery
        setInterval(() => {
            this.processGrantScrapingQueue();
        }, 10000); // Every 10 seconds

        // Match discovered grants to Soulfra
        setInterval(() => {
            this.matchGrantsToSoulfra();
        }, 15000); // Every 15 seconds

        // Generate applications for high-match grants
        setInterval(() => {
            this.generateApplicationsForMatches();
        }, 30000); // Every 30 seconds
    }

    queueInitialGrantScraping() {
        // Queue all active grant sources for scraping
        for (const [category, sources] of Object.entries(this.grantSources)) {
            for (const [sourceName, sourceConfig] of sources) {
                if (sourceConfig.active) {
                    this.queueGrantScraping(sourceName, sourceConfig, 'high');
                }
            }
        }
    }

    queueGrantScraping(sourceName, sourceConfig, priority = 'medium') {
        const scrapingTask = {
            id: crypto.randomUUID(),
            source: sourceName,
            config: sourceConfig,
            priority: priority,
            status: 'queued',
            attempts: 0,
            created: Date.now()
        };

        this.grantScraper.scrapingQueue.push(scrapingTask);
        console.log(`📋 Queued grant scraping: ${sourceName} (${priority} priority)`);
    }

    async processGrantScrapingQueue() {
        if (this.grantScraper.scrapingQueue.length === 0) return;

        // Sort by priority
        this.grantScraper.scrapingQueue.sort((a, b) => {
            const priorities = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorities[b.priority] - priorities[a.priority];
        });

        const task = this.grantScraper.scrapingQueue.shift();
        await this.executeGrantScraping(task);
    }

    async executeGrantScraping(task) {
        try {
            task.status = 'in-progress';
            task.attempts++;
            this.grantScraper.activeScrapings.set(task.id, task);

            console.log(`🔍 Scraping grants from: ${task.source}`);

            // Execute scraping based on method
            const grants = await this.scrapeGrantSource(task.source, task.config);
            
            // Process and store discovered grants
            for (const grant of grants) {
                await this.processDiscoveredGrant(grant, task.source);
            }

            task.status = 'completed';
            task.grantsFound = grants.length;
            task.completedAt = Date.now();

            console.log(`✅ ${task.source}: Found ${grants.length} grants`);

            // Respect rate limits
            await this.sleep(task.config.rateLimit);

        } catch (error) {
            console.error(`❌ Grant scraping failed for ${task.source}:`, error.message);
            task.status = 'failed';
            task.error = error.message;

            // Retry with exponential backoff
            if (task.attempts < 3) {
                setTimeout(() => {
                    task.status = 'queued';
                    this.grantScraper.scrapingQueue.push(task);
                }, task.attempts * 5000);
            }
        } finally {
            this.grantScraper.activeScrapings.delete(task.id);
        }
    }

    async scrapeGrantSource(sourceName, config) {
        // Simulate grant scraping for different sources
        switch (sourceName) {
            case 'grants.gov':
                return await this.scrapeGrantsGov();
            case 'sbir':
                return await this.scrapeSBIR();
            case 'nsf':
                return await this.scrapeNSF();
            default:
                return await this.scrapeGenericSource(sourceName, config);
        }
    }

    async scrapeGrantsGov() {
        // Simulate scraping grants.gov
        return [
            {
                title: 'Small Business Innovation Research (SBIR) - AI/ML Technologies',
                agency: 'NSF',
                amount: '$275,000',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
                categories: ['AI', 'machine learning', 'innovation'],
                description: 'Funding for small businesses developing AI and machine learning solutions',
                eligibility: 'Small businesses with <500 employees',
                phases: ['Phase I: $275k', 'Phase II: $1.75M'],
                matchScore: 0
            },
            {
                title: 'Technology Innovation Program - Blockchain Applications',
                agency: 'NIST',
                amount: '$150,000',
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                categories: ['blockchain', 'technology', 'innovation'],
                description: 'Support for blockchain technology development and commercialization',
                eligibility: 'Technology startups and small businesses',
                phases: ['Single Phase: $150k'],
                matchScore: 0
            }
        ];
    }

    async scrapeSBIR() {
        return [
            {
                title: 'SBIR Phase I - Advanced Computing and Data Analytics',
                agency: 'DoD',
                amount: '$250,000',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                categories: ['computing', 'data analytics', 'AI'],
                description: 'Development of advanced computing solutions for data processing',
                eligibility: 'Small businesses focused on technology innovation',
                phases: ['Phase I: $250k', 'Phase II: $1.5M'],
                matchScore: 0
            }
        ];
    }

    async scrapeNSF() {
        return [
            {
                title: 'Computer and Information Science and Engineering (CISE) - Core Programs',
                agency: 'NSF',
                amount: '$500,000',
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                categories: ['computer science', 'engineering', 'research'],
                description: 'Research funding for computer science and engineering innovations',
                eligibility: 'Universities and research institutions, small business partnerships',
                phases: ['3-year award: $500k'],
                matchScore: 0
            }
        ];
    }

    async scrapeGenericSource(sourceName, config) {
        // Generic scraping simulation
        return [
            {
                title: `Innovation Grant - ${sourceName}`,
                agency: sourceName,
                amount: '$100,000',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                categories: ['innovation', 'technology'],
                description: `Technology innovation funding from ${sourceName}`,
                eligibility: 'Technology companies and startups',
                matchScore: 0
            }
        ];
    }

    async processDiscoveredGrant(grant, source) {
        // Add metadata and process the grant
        grant.id = crypto.randomUUID();
        grant.source = source;
        grant.discovered = Date.now();
        grant.status = 'discovered';

        this.grantScraper.discoveredGrants.set(grant.id, grant);
        console.log(`📋 Discovered: ${grant.title} (${grant.amount})`);
    }

    async matchGrantsToSoulfra() {
        const unmatched = Array.from(this.grantScraper.discoveredGrants.values())
            .filter(grant => grant.matchScore === 0);

        for (const grant of unmatched) {
            const matchScore = this.calculateGrantMatch(grant);
            grant.matchScore = matchScore;

            if (matchScore >= 0.7) { // High match threshold
                this.grantScraper.matchedGrants.set(grant.id, grant);
                console.log(`🎯 High match (${(matchScore * 100).toFixed(1)}%): ${grant.title}`);
            } else if (matchScore >= 0.5) {
                console.log(`📊 Medium match (${(matchScore * 100).toFixed(1)}%): ${grant.title}`);
            }
        }
    }

    calculateGrantMatch(grant) {
        let score = 0;
        let factors = 0;

        // Category matching
        const soulframKeywords = [
            'ai', 'artificial intelligence', 'machine learning', 'blockchain', 
            'technology', 'innovation', 'software', 'automation', 'data',
            'small business', 'startup', 'computing'
        ];

        const grantText = (grant.title + ' ' + grant.description + ' ' + grant.categories.join(' ')).toLowerCase();
        
        const keywordMatches = soulframKeywords.filter(keyword => grantText.includes(keyword));
        score += (keywordMatches.length / soulframKeywords.length) * 0.4;
        factors += 0.4;

        // Funding amount appropriateness
        const amount = parseInt(grant.amount.replace(/[$,k]/g, '')) * (grant.amount.includes('k') ? 1000 : 1);
        if (amount >= 50000 && amount <= 1000000) { // Ideal range for Soulfra
            score += 0.3;
        } else if (amount >= 25000 && amount <= 2000000) { // Acceptable range
            score += 0.15;
        }
        factors += 0.3;

        // Timeline feasibility
        const daysUntilDeadline = (grant.deadline - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilDeadline >= 30) { // Enough time to prepare
            score += 0.2;
        } else if (daysUntilDeadline >= 14) { // Tight but possible
            score += 0.1;
        }
        factors += 0.2;

        // Eligibility match
        if (grant.eligibility.toLowerCase().includes('small business') || 
            grant.eligibility.toLowerCase().includes('startup')) {
            score += 0.1;
        }
        factors += 0.1;

        return factors > 0 ? score / factors : 0;
    }

    async generateApplicationsForMatches() {
        const highMatches = Array.from(this.grantScraper.matchedGrants.values())
            .filter(grant => grant.matchScore >= 0.7 && !this.autoFill.applications.has(grant.id))
            .slice(0, 3); // Limit to 3 at a time

        for (const grant of highMatches) {
            await this.generateGrantApplication(grant);
        }
    }

    async generateGrantApplication(grant) {
        console.log(`📝 Generating application for: ${grant.title}`);

        const application = {
            grantId: grant.id,
            grantTitle: grant.title,
            agency: grant.agency,
            amount: grant.amount,
            deadline: grant.deadline,
            status: 'draft',
            sections: {},
            context: this.selectBestContext(grant),
            generated: Date.now()
        };

        // Generate each section of the application
        application.sections.companyOverview = await this.generateCompanyOverview(grant);
        application.sections.technicalApproach = await this.generateTechnicalApproach(grant);
        application.sections.marketOpportunity = await this.generateMarketOpportunity(grant);
        application.sections.teamQualifications = await this.generateTeamQualifications(grant);
        application.sections.budgetJustification = await this.generateBudgetJustification(grant);
        application.sections.timeline = await this.generateProjectTimeline(grant);

        this.autoFill.applications.set(grant.id, application);
        console.log(`✅ Application generated for: ${grant.title}`);
    }

    selectBestContext(grant) {
        const grantText = (grant.title + ' ' + grant.description).toLowerCase();

        if (grantText.includes('ai') || grantText.includes('machine learning')) {
            return 'ai-focused-context';
        } else if (grantText.includes('blockchain')) {
            return 'blockchain-focused-context';
        } else {
            return 'small-business-context';
        }
    }

    async generateCompanyOverview(grant) {
        const context = this.autoFill.templates.get(this.selectBestContext(grant));
        const baseTemplate = this.autoFill.templates.get('company-overview');
        
        return this.customizeTemplate(baseTemplate.template, {
            funding_amount: grant.amount,
            timeline: this.calculateProjectTimeline(grant),
            specific_use: this.generateSpecificUse(grant),
            context_emphasis: context.emphasis
        });
    }

    async generateTechnicalApproach(grant) {
        const context = this.autoFill.templates.get(this.selectBestContext(grant));
        const baseTemplate = this.autoFill.templates.get('technical-approach');
        
        return this.customizeTemplate(baseTemplate.template, {
            specific_technology: context.strengths.join(', '),
            innovation_aspect: this.extractInnovationAspect(grant),
            differentiation: context.applications.join(', ')
        });
    }

    async generateMarketOpportunity(grant) {
        const baseTemplate = this.autoFill.templates.get('market-opportunity');
        
        return this.customizeTemplate(baseTemplate.template, {
            market_size: this.getRelevantMarketSize(grant),
            target_segment: this.identifyTargetSegment(grant),
            competitive_advantage: this.articulateCompetitiveAdvantage(grant)
        });
    }

    async generateTeamQualifications(grant) {
        const baseTemplate = this.autoFill.templates.get('team-qualifications');
        
        return this.customizeTemplate(baseTemplate.template, {
            specific_experience: this.highlightRelevantExperience(grant),
            previous_successes: 'Successful development of multiple AI and blockchain systems',
            technical_credentials: 'Deep expertise in modern software development and emerging technologies'
        });
    }

    async generateBudgetJustification(grant) {
        const amount = this.parseGrantAmount(grant.amount);
        const budget = this.createBudgetBreakdown(amount);
        
        return `
        Budget Justification for ${grant.title}:
        
        Total Request: ${grant.amount}
        
        Budget Breakdown:
        ${budget.map(item => `• ${item.category}: ${item.amount} (${item.percentage}) - ${item.justification}`).join('\n')}
        
        This budget allocation ensures efficient use of funds while maximizing project impact 
        and meeting all grant objectives within the specified timeline.
        `;
    }

    async generateProjectTimeline(grant) {
        const timelineMonths = this.calculateProjectTimeline(grant);
        
        return `
        Project Timeline (${timelineMonths} months):
        
        Months 1-3: Research and Planning Phase
        • Requirements analysis and system design
        • Technology stack selection and setup
        • Initial prototype development
        
        Months 4-8: Development Phase  
        • Core system implementation
        • AI/ML model development and training
        • Integration and testing
        
        Months 9-${timelineMonths}: Validation and Deployment
        • User testing and feedback integration
        • Performance optimization
        • Documentation and deliverable preparation
        • Market validation and pilot deployment
        `;
    }

    customizeTemplate(template, variables) {
        let customized = template;
        
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`;
            customized = customized.replace(new RegExp(placeholder, 'g'), value);
        }
        
        return customized;
    }

    calculateProjectTimeline(grant) {
        // Estimate project timeline based on grant amount
        const amount = this.parseGrantAmount(grant.amount);
        
        if (amount >= 500000) return 24; // 2 years for large grants
        if (amount >= 250000) return 18; // 1.5 years for medium grants
        return 12; // 1 year for smaller grants
    }

    parseGrantAmount(amountStr) {
        const amount = parseInt(amountStr.replace(/[$,k]/g, ''));
        return amountStr.includes('k') ? amount * 1000 : amount;
    }

    generateSpecificUse(grant) {
        const context = this.selectBestContext(grant);
        
        switch (context) {
            case 'ai-focused-context':
                return 'advancing our AI-powered knowledge management platform';
            case 'blockchain-focused-context':
                return 'developing secure blockchain-based verification systems';
            default:
                return 'accelerating our technology platform development and market entry';
        }
    }

    extractInnovationAspect(grant) {
        if (grant.title.toLowerCase().includes('ai')) {
            return 'novel AI algorithms for automated knowledge extraction and processing';
        } else if (grant.title.toLowerCase().includes('blockchain')) {
            return 'innovative blockchain integration for data integrity and verification';
        } else {
            return 'cutting-edge technology integration for business process automation';
        }
    }

    getRelevantMarketSize(grant) {
        if (grant.categories.includes('AI')) {
            return 'The global AI market is projected to reach $1.8 trillion by 2030';
        } else if (grant.categories.includes('blockchain')) {
            return 'The blockchain market is expected to grow to $163 billion by 2027';
        } else {
            return 'The business automation software market exceeds $250 billion globally';
        }
    }

    identifyTargetSegment(grant) {
        return 'Small to medium enterprises seeking to automate workflows and improve decision-making through AI technology';
    }

    articulateCompetitiveAdvantage(grant) {
        return 'Unique combination of AI, blockchain, and modern web technologies in an integrated platform designed for rapid deployment and scalability';
    }

    highlightRelevantExperience(grant) {
        const context = this.selectBestContext(grant);
        
        switch (context) {
            case 'ai-focused-context':
                return 'Extensive experience in AI/ML system development, natural language processing, and automated knowledge extraction';
            case 'blockchain-focused-context':
                return 'Deep expertise in blockchain development, smart contracts, and distributed system architecture';
            default:
                return 'Proven track record in full-stack development, system integration, and technology innovation';
        }
    }

    createBudgetBreakdown(totalAmount) {
        return [
            {
                category: 'Personnel',
                amount: `$${Math.floor(totalAmount * 0.6).toLocaleString()}`,
                percentage: '60%',
                justification: 'Development team salaries and contractor fees'
            },
            {
                category: 'Technology/Equipment',
                amount: `$${Math.floor(totalAmount * 0.15).toLocaleString()}`,
                percentage: '15%',
                justification: 'Cloud infrastructure, development tools, and software licenses'
            },
            {
                category: 'Research & Development',
                amount: `$${Math.floor(totalAmount * 0.15).toLocaleString()}`,
                percentage: '15%',
                justification: 'Prototyping, testing, and technology validation'
            },
            {
                category: 'Administrative',
                amount: `$${Math.floor(totalAmount * 0.1).toLocaleString()}`,
                percentage: '10%',
                justification: 'Project management, reporting, and administrative overhead'
            }
        ];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }
        
        if (url.pathname === '/') {
            res.setHeader('Content-Type', 'text/html');
            res.end(this.generateMainHTML());
        } else if (url.pathname.startsWith('/application/')) {
            const grantId = url.pathname.split('/')[2];
            res.setHeader('Content-Type', 'text/html');
            res.end(this.generateApplicationHTML(grantId));
        } else if (url.pathname === '/api/status') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(this.getSystemStatus()));
        } else if (url.pathname === '/api/search-grants' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const data = JSON.parse(body);
                this.handleGrantSearch(data, res);
            });
        } else {
            res.statusCode = 404;
            res.end('Not found');
        }
    }

    getSystemStatus() {
        const totalGrants = this.grantScraper.discoveredGrants.size;
        const matchedGrants = this.grantScraper.matchedGrants.size;
        const applications = this.autoFill.applications.size;

        return {
            company: this.soulframProfile.company,
            totalGrants: totalGrants,
            matchedGrants: matchedGrants,
            applications: applications,
            activeScraping: this.grantScraper.activeScrapings.size,
            queuedScraping: this.grantScraper.scrapingQueue.length,
            highMatchGrants: Array.from(this.grantScraper.matchedGrants.values())
                .filter(g => g.matchScore >= 0.8).length
        };
    }

    generateMainHTML() {
        const status = this.getSystemStatus();
        const topMatches = Array.from(this.grantScraper.matchedGrants.values())
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

        const recentApplications = Array.from(this.autoFill.applications.values())
            .sort((a, b) => b.generated - a.generated)
            .slice(0, 3);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💰🔍📝 Soulfra Grant Scraper</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ffffff; 
            min-height: 100vh;
        }
        
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #4CAF50; text-shadow: 0 0 10px #4CAF50; margin-bottom: 10px; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { 
            background: rgba(76, 175, 80, 0.1); 
            border: 1px solid #4CAF50; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center;
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .stat-label { color: #ccc; margin-top: 5px; }
        
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .panel { 
            background: rgba(255, 255, 255, 0.05); 
            border: 1px solid #4CAF50; 
            border-radius: 8px; 
            padding: 20px;
        }
        
        .grant-item { 
            margin: 15px 0; 
            padding: 15px; 
            background: rgba(0, 0, 0, 0.3); 
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }
        
        .match-score {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .match-high { background: #4CAF50; color: white; }
        .match-medium { background: #FF9800; color: white; }
        .match-low { background: #757575; color: white; }
        
        .btn { 
            background: #4CAF50; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover { background: #45a049; }
        
        .deadline-urgent { color: #ff4444; font-weight: bold; }
        .deadline-soon { color: #ffaa44; }
        .deadline-ok { color: #44ff44; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 SOULFRA GRANT SCRAPER & AUTO-FILL SYSTEM</h1>
            <div style="color: #ccc; font-size: 14px;">
                Automated Grant Discovery • Smart Matching • Auto-Generated Applications
            </div>
            <div style="color: #4CAF50; font-weight: bold; margin-top: 10px;">
                Finding funding opportunities for ${this.soulframProfile.company}
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${status.totalGrants}</div>
                <div class="stat-label">Total Grants Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${status.matchedGrants}</div>
                <div class="stat-label">Matched to Soulfra</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${status.applications}</div>
                <div class="stat-label">Applications Generated</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${status.highMatchGrants}</div>
                <div class="stat-label">High-Match Grants</div>
            </div>
        </div>
        
        <div class="grid">
            <div class="panel">
                <h3>🎯 Top Grant Matches for Soulfra</h3>
                ${topMatches.length === 0 ? 
                    '<div style="color: #888; text-align: center; padding: 20px;">Searching for grants...</div>' :
                    topMatches.map(grant => {
                        const daysLeft = Math.ceil((grant.deadline - Date.now()) / (1000 * 60 * 60 * 24));
                        const deadlineClass = daysLeft <= 14 ? 'deadline-urgent' : daysLeft <= 30 ? 'deadline-soon' : 'deadline-ok';
                        const matchClass = grant.matchScore >= 0.8 ? 'match-high' : grant.matchScore >= 0.6 ? 'match-medium' : 'match-low';
                        
                        return `
                            <div class="grant-item">
                                <strong>${grant.title}</strong>
                                <span class="match-score ${matchClass}">${(grant.matchScore * 100).toFixed(1)}% match</span><br>
                                <small><strong>Agency:</strong> ${grant.agency} | <strong>Amount:</strong> ${grant.amount}</small><br>
                                <small class="${deadlineClass}"><strong>Deadline:</strong> ${grant.deadline.toLocaleDateString()} (${daysLeft} days)</small><br>
                                <div style="margin-top: 10px;">
                                    ${this.autoFill.applications.has(grant.id) ? 
                                        `<a href="/application/${grant.id}" class="btn">📝 View Application</a>` :
                                        '<span style="color: #888;">Application pending...</span>'
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
            
            <div class="panel">
                <h3>📝 Recent Auto-Generated Applications</h3>
                ${recentApplications.length === 0 ? 
                    '<div style="color: #888; text-align: center; padding: 20px;">No applications generated yet</div>' :
                    recentApplications.map(app => `
                        <div class="grant-item">
                            <strong>${app.grantTitle}</strong><br>
                            <small><strong>Agency:</strong> ${app.agency} | <strong>Amount:</strong> ${app.amount}</small><br>
                            <small><strong>Generated:</strong> ${new Date(app.generated).toLocaleDateString()}</small><br>
                            <a href="/application/${app.grantId}" class="btn">📝 Review Application</a>
                        </div>
                    `).join('')
                }
            </div>
        </div>
        
        <div class="panel">
            <h3>🏢 Soulfra Company Profile</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>Core Capabilities:</h4>
                    <ul style="margin-left: 20px; color: #ccc;">
                        ${this.soulframProfile.capabilities.map(cap => `<li>${cap}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h4>Technologies:</h4>
                    <ul style="margin-left: 20px; color: #ccc;">
                        ${this.soulframProfile.technologies.map(tech => `<li>${tech}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <h4>Funding Needs:</h4>
                <p style="color: #ccc;">${this.soulframProfile.fundingNeeds.amount} for ${this.soulframProfile.fundingNeeds.purpose}</p>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
            window.location.reload();
        }, 30000);
        
        console.log('💰 Soulfra Grant Scraper active - seeking funding opportunities!');
    </script>
</body>
</html>`;
    }

    generateApplicationHTML(grantId) {
        const application = this.autoFill.applications.get(grantId);
        if (!application) {
            return '<html><body><h1>Application not found</h1></body></html>';
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📝 Grant Application - ${application.grantTitle}</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            line-height: 1.6; 
            background: #fff; 
            color: #333;
        }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .section h2 { color: #4CAF50; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .grant-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .btn { 
            background: #4CAF50; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer; 
            text-decoration: none;
            display: inline-block;
            margin: 10px 5px 0 0;
        }
        @media print {
            .btn { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Grant Application</h1>
        <h2>${application.grantTitle}</h2>
        <p><strong>Submitted by:</strong> Soulfra<br>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="grant-info">
        <strong>Grant Details:</strong><br>
        Agency: ${application.agency}<br>
        Funding Amount: ${application.amount}<br>
        Application Deadline: ${new Date(application.deadline).toLocaleDateString()}<br>
        Context: ${application.context}
    </div>
    
    <div class="section">
        <h2>Company Overview</h2>
        <div style="white-space: pre-line;">${application.sections.companyOverview}</div>
    </div>
    
    <div class="section">
        <h2>Technical Approach</h2>
        <div style="white-space: pre-line;">${application.sections.technicalApproach}</div>
    </div>
    
    <div class="section">
        <h2>Market Opportunity</h2>
        <div style="white-space: pre-line;">${application.sections.marketOpportunity}</div>
    </div>
    
    <div class="section">
        <h2>Team Qualifications</h2>
        <div style="white-space: pre-line;">${application.sections.teamQualifications}</div>
    </div>
    
    <div class="section">
        <h2>Budget Justification</h2>
        <div style="white-space: pre-line;">${application.sections.budgetJustification}</div>
    </div>
    
    <div class="section">
        <h2>Project Timeline</h2>
        <div style="white-space: pre-line;">${application.sections.timeline}</div>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
        <button onclick="window.print()" class="btn">🖨️ Print Application</button>
        <button onclick="window.history.back()" class="btn">← Back to Dashboard</button>
        <button onclick="downloadApplication()" class="btn">💾 Download</button>
    </div>
    
    <script>
        function downloadApplication() {
            const content = document.body.innerHTML;
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'soulfra-grant-application-${application.grantTitle.replace(/[^a-zA-Z0-9]/g, '-')}.html';
            a.click();
        }
    </script>
</body>
</html>`;
    }
}

// Start the Soulfra grant scraper system
if (require.main === module) {
    const scraper = new SoulframGrantScraperSystem();
    scraper.startGrantScraperSystem().catch(console.error);
}

module.exports = SoulframGrantScraperSystem;
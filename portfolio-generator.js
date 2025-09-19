/**
 * PORTFOLIO GENERATOR
 * 
 * Packages student project outputs into professional portfolios that demonstrate job readiness.
 * Creates GitHub-style, Behance-style, and LinkedIn-style portfolios from deliverables.
 * 
 * This is what makes students ACTUALLY job-ready - real portfolios with real work.
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class PortfolioGenerator extends EventEmitter {
    constructor() {
        super();
        
        this.port = 18000;
        this.wsPort = 18001;
        
        // Portfolio templates and styles
        this.portfolioTemplates = {
            'github-developer': {
                name: 'Developer Portfolio',
                description: 'GitHub-style portfolio for developers',
                template: 'github_template.html',
                style: 'developer.css',
                sections: ['projects', 'skills', 'experience', 'education', 'contact'],
                targetAudience: ['Tech Companies', 'Startups', 'Agencies']
            },
            'behance-creative': {
                name: 'Creative Portfolio',
                description: 'Behance-style portfolio for designers',
                template: 'behance_template.html',
                style: 'creative.css',
                sections: ['showcase', 'about', 'process', 'clients', 'contact'],
                targetAudience: ['Design Agencies', 'Marketing Companies', 'Freelance Clients']
            },
            'linkedin-business': {
                name: 'Business Portfolio',
                description: 'LinkedIn-style portfolio for business professionals',
                template: 'linkedin_template.html',
                style: 'business.css',
                sections: ['summary', 'experience', 'projects', 'skills', 'recommendations'],
                targetAudience: ['Corporations', 'Consulting Firms', 'Business Clients']
            },
            'academic-research': {
                name: 'Research Portfolio',
                description: 'Academic-style portfolio for researchers',
                template: 'academic_template.html',
                style: 'academic.css',
                sections: ['publications', 'research', 'presentations', 'grants', 'teaching'],
                targetAudience: ['Universities', 'Research Institutions', 'Think Tanks']
            }
        };
        
        // Character-to-portfolio mapping
        this.characterPortfolioMapping = {
            'cal': 'github-developer',
            'arty': 'behance-creative',
            'ralph': 'linkedin-business',
            'vera': 'academic-research',
            'paulo': 'linkedin-business',
            'nash': 'behance-creative'
        };
        
        // Active portfolio generations
        this.activeGenerations = new Map();
        this.generatedPortfolios = new Map();
        
        // Output directories
        this.portfolioOutputDir = './generated_portfolios';
        this.templateDir = './portfolio_templates';
        
        console.log('📁 Portfolio Generator initializing...');
        this.initializeTemplates();
    }
    
    async start() {
        console.log('🚀 Starting Portfolio Generator...');
        
        await this.createOutputDirectories();
        await this.startHTTPServer();
        await this.startWebSocketServer();
        await this.loadExistingPortfolios();
        
        console.log('✅ Portfolio Generator ready!');
        console.log(`📁 Portfolio Gallery: http://localhost:${this.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    async initializeTemplates() {
        // Create portfolio templates directory and files
        await this.createPortfolioTemplates();
    }
    
    async createOutputDirectories() {
        try {
            await fs.mkdir(this.portfolioOutputDir, { recursive: true });
            await fs.mkdir(this.templateDir, { recursive: true });
            await fs.mkdir(path.join(this.portfolioOutputDir, 'assets'), { recursive: true });
            await fs.mkdir(path.join(this.portfolioOutputDir, 'css'), { recursive: true });
            await fs.mkdir(path.join(this.portfolioOutputDir, 'js'), { recursive: true });
            console.log('📁 Portfolio directories created');
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }
    
    async startHTTPServer() {
        const http = require('http');
        
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.servePortfolioGallery(res);
            } else if (url === '/api/generate' && req.method === 'POST') {
                this.handleGeneratePortfolio(req, res);
            } else if (url === '/api/templates') {
                this.serveTemplateList(res);
            } else if (url.startsWith('/portfolio/')) {
                this.servePortfolio(req, res);
            } else if (url.startsWith('/api/portfolio/')) {
                this.handlePortfolioAPI(req, res);
            } else {
                res.writeHead(404);
                res.end('Portfolio endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`📁 Portfolio Gallery: http://localhost:${this.port}`);
        });
    }
    
    async startWebSocketServer() {
        const WebSocket = require('ws');
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws, req) => {
            const sessionId = this.generateSessionId();
            
            console.log(`📁 Portfolio session connected: ${sessionId}`);
            
            ws.send(JSON.stringify({
                type: 'session-welcome',
                sessionId: sessionId,
                message: 'Welcome to Portfolio Generator! Transform your projects into professional portfolios.',
                availableTemplates: Object.keys(this.portfolioTemplates),
                recentPortfolios: this.getRecentPortfolios()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handlePortfolioMessage(sessionId, data, ws);
                } catch (e) {
                    console.error('Invalid portfolio message:', e);
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 Portfolio session disconnected: ${sessionId}`);
            });
        });
        
        console.log(`📡 Portfolio WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    async handlePortfolioMessage(sessionId, data, ws) {
        console.log(`📨 Portfolio message from ${sessionId}:`, data.type);
        
        switch (data.type) {
            case 'generate-portfolio':
                await this.handleGenerateStudentPortfolio(sessionId, data, ws);
                break;
            case 'customize-template':
                await this.handleCustomizeTemplate(sessionId, data, ws);
                break;
            case 'add-project':
                await this.handleAddProject(sessionId, data, ws);
                break;
            case 'publish-portfolio':
                await this.handlePublishPortfolio(sessionId, data, ws);
                break;
            case 'preview-portfolio':
                await this.handlePreviewPortfolio(sessionId, data, ws);
                break;
        }
    }
    
    async handleGenerateStudentPortfolio(sessionId, data, ws) {
        const { studentId, character, projects, customization } = data;
        
        // Determine best template for character
        const templateType = customization?.template || this.characterPortfolioMapping[character];
        const template = this.portfolioTemplates[templateType];
        
        if (!template) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid template selected'
            }));
            return;
        }
        
        // Start generation process
        const generationId = `portfolio_${crypto.randomBytes(8).toString('hex')}`;
        
        const generation = {
            id: generationId,
            sessionId: sessionId,
            studentId: studentId,
            character: character,
            template: template,
            projects: projects,
            customization: customization,
            status: 'generating',
            startTime: Date.now()
        };
        
        this.activeGenerations.set(generationId, generation);
        
        ws.send(JSON.stringify({
            type: 'generation-started',
            generationId: generationId,
            template: template,
            message: `🚀 Generating your ${template.name}...`,
            estimatedTime: '2-3 minutes'
        }));
        
        // Generate portfolio asynchronously
        this.generatePortfolioAsync(generation, ws);
    }
    
    async generatePortfolioAsync(generation, ws) {
        try {
            // Step 1: Analyze projects and create structure
            ws.send(JSON.stringify({
                type: 'generation-progress',
                step: 'analyzing',
                message: 'Analyzing your projects and achievements...',
                progress: 20
            }));
            
            const portfolioStructure = await this.analyzeProjectsForPortfolio(generation.projects, generation.character);
            
            // Step 2: Generate content for each section
            ws.send(JSON.stringify({
                type: 'generation-progress',
                step: 'content',
                message: 'Creating portfolio content...',
                progress: 40
            }));
            
            const portfolioContent = await this.generatePortfolioContent(portfolioStructure, generation);
            
            // Step 3: Apply template and styling
            ws.send(JSON.stringify({
                type: 'generation-progress',
                step: 'styling',
                message: 'Applying professional styling...',
                progress: 60
            }));
            
            const styledPortfolio = await this.applyTemplateAndStyling(portfolioContent, generation.template);
            
            // Step 4: Generate supporting files
            ws.send(JSON.stringify({
                type: 'generation-progress',
                step: 'assets',
                message: 'Creating supporting assets...',
                progress: 80
            }));
            
            const assets = await this.generateSupportingAssets(generation);
            
            // Step 5: Package and finalize
            ws.send(JSON.stringify({
                type: 'generation-progress',
                step: 'finalizing',
                message: 'Finalizing your portfolio...',
                progress: 95
            }));
            
            const finalPortfolio = await this.finalizePortfolio(styledPortfolio, assets, generation);
            
            // Mark as completed
            generation.status = 'completed';
            generation.completedAt = Date.now();
            generation.result = finalPortfolio;
            
            this.generatedPortfolios.set(generation.id, generation);
            
            ws.send(JSON.stringify({
                type: 'generation-complete',
                generationId: generation.id,
                portfolio: finalPortfolio,
                message: '🎉 Portfolio generated successfully!',
                nextSteps: [
                    'Preview your portfolio',
                    'Customize if needed',
                    'Publish and share',
                    'Apply for jobs'
                ]
            }));
            
        } catch (error) {
            console.error('Portfolio generation failed:', error);
            
            generation.status = 'failed';
            generation.error = error.message;
            
            ws.send(JSON.stringify({
                type: 'generation-failed',
                generationId: generation.id,
                error: error.message,
                message: '❌ Portfolio generation failed. Please try again.'
            }));
        }
    }
    
    async analyzeProjectsForPortfolio(projects, character) {
        const structure = {
            overview: {
                totalProjects: projects.length,
                skillsProven: new Set(),
                marketValue: [],
                deliverables: []
            },
            sections: {},
            highlights: [],
            jobReadiness: {}
        };
        
        // Analyze each project
        projects.forEach(project => {
            // Collect skills
            if (project.skillsProven) {
                project.skillsProven.forEach(skill => structure.overview.skillsProven.add(skill));
            }
            
            // Collect market values
            if (project.marketValue) {
                structure.overview.marketValue.push(project.marketValue);
            }
            
            // Collect deliverables
            if (project.deliverables) {
                structure.overview.deliverables.push(...project.deliverables);
            }
            
            // Identify highlights
            if (project.grade && project.grade > 85) {
                structure.highlights.push({
                    type: 'high-quality-project',
                    project: project.title,
                    achievement: `${project.grade}% quality score`
                });
            }
        });
        
        // Convert skills to array
        structure.overview.skillsProven = Array.from(structure.overview.skillsProven);
        
        // Calculate job readiness
        structure.jobReadiness = this.calculateJobReadiness(structure.overview, character);
        
        return structure;
    }
    
    async generatePortfolioContent(structure, generation) {
        const { character, template, customization } = generation;
        
        const content = {
            header: this.generateHeaderContent(structure, character, customization),
            about: this.generateAboutContent(structure, character),
            projects: this.generateProjectsContent(generation.projects),
            skills: this.generateSkillsContent(structure.overview.skillsProven),
            achievements: this.generateAchievementsContent(structure.highlights),
            contact: this.generateContactContent(customization?.contact),
            jobReadiness: this.generateJobReadinessContent(structure.jobReadiness)
        };
        
        return content;
    }
    
    generateHeaderContent(structure, character, customization) {
        const characterProfiles = {
            'cal': {
                title: 'Data Systems Architect',
                tagline: 'Building scalable data systems with precision and insight',
                focus: 'Analytics & System Design'
            },
            'arty': {
                title: 'Creative Design Professional',
                tagline: 'Crafting beautiful, user-centered design experiences',
                focus: 'Visual Design & User Experience'
            },
            'ralph': {
                title: 'Strategic Developer',
                tagline: 'Competitive solutions for complex challenges',
                focus: 'Game Development & Strategy'
            },
            'vera': {
                title: 'Research & Documentation Specialist',
                tagline: 'Evidence-based solutions with scholarly rigor',
                focus: 'Research & Technical Writing'
            },
            'paulo': {
                title: 'Business Solution Developer',
                tagline: 'Practical applications that deliver real business value',
                focus: 'Full-Stack Development & Business Analysis'
            },
            'nash': {
                title: 'Communication Systems Builder',
                tagline: 'Connecting people through collaborative technology',
                focus: 'Community Platforms & Social Systems'
            }
        };
        
        const profile = characterProfiles[character];
        
        return {
            name: customization?.name || `${character} Student`,
            title: customization?.title || profile.title,
            tagline: customization?.tagline || profile.tagline,
            focus: profile.focus,
            avatar: customization?.avatar || `./assets/${character}_avatar.png`,
            totalProjects: structure.totalProjects,
            totalSkills: structure.skillsProven.length
        };
    }
    
    generateAboutContent(structure, character) {
        const characterDescriptions = {
            'cal': 'Data-driven professional with expertise in system architecture and analytics. Proven ability to design scalable solutions and extract actionable insights from complex datasets.',
            'arty': 'Creative professional specializing in visual design and user experience. Passionate about creating beautiful, functional designs that solve real problems.',
            'ralph': 'Strategic thinker with a competitive edge in software development. Focused on building engaging applications and optimizing performance.',
            'vera': 'Research-oriented professional with strong analytical skills. Committed to evidence-based decision making and comprehensive documentation.',
            'paulo': 'Business-focused developer who bridges technical solutions with real-world applications. Experienced in full-stack development and process optimization.',
            'nash': 'Communication-focused technologist who builds platforms that bring people together. Expertise in collaborative systems and community building.'
        };
        
        return {
            description: characterDescriptions[character],
            skills: structure.skillsProven,
            projectCount: structure.totalProjects,
            experience: `${structure.totalProjects} completed projects demonstrating professional-level competency`
        };
    }
    
    generateProjectsContent(projects) {
        return projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            skills: project.skillsProven || [],
            deliverables: project.deliverables || [],
            marketValue: project.marketValue,
            grade: project.grade,
            thumbnail: project.thumbnail || './assets/project_placeholder.png',
            links: {
                demo: project.demoUrl,
                code: project.codeUrl,
                documentation: project.docsUrl
            },
            highlights: project.highlights || []
        }));
    }
    
    generateSkillsContent(skills) {
        // Categorize skills
        const categories = {
            technical: [],
            design: [],
            business: [],
            research: [],
            communication: []
        };
        
        skills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (skillLower.includes('data') || skillLower.includes('system') || skillLower.includes('development')) {
                categories.technical.push(skill);
            } else if (skillLower.includes('design') || skillLower.includes('visual') || skillLower.includes('creative')) {
                categories.design.push(skill);
            } else if (skillLower.includes('business') || skillLower.includes('analysis') || skillLower.includes('management')) {
                categories.business.push(skill);
            } else if (skillLower.includes('research') || skillLower.includes('documentation') || skillLower.includes('writing')) {
                categories.research.push(skill);
            } else {
                categories.communication.push(skill);
            }
        });
        
        return categories;
    }
    
    generateAchievementsContent(highlights) {
        return highlights.map(highlight => ({
            type: highlight.type,
            title: this.getAchievementTitle(highlight.type),
            description: highlight.achievement,
            project: highlight.project,
            icon: this.getAchievementIcon(highlight.type)
        }));
    }
    
    generateContactContent(customContact) {
        return {
            email: customContact?.email || 'student@example.com',
            linkedin: customContact?.linkedin,
            github: customContact?.github,
            portfolio: customContact?.portfolio,
            phone: customContact?.phone,
            location: customContact?.location || 'Remote Available'
        };
    }
    
    generateJobReadinessContent(jobReadiness) {
        return {
            overallScore: jobReadiness.score,
            readyForRoles: jobReadiness.roles,
            strengths: jobReadiness.strengths,
            recommendations: jobReadiness.recommendations,
            marketValue: jobReadiness.marketValue
        };
    }
    
    calculateJobReadiness(overview, character) {
        let score = 50; // Base score
        
        // Add points for projects
        score += Math.min(overview.totalProjects * 15, 30);
        
        // Add points for skills diversity
        score += Math.min(overview.skillsProven.length * 2, 20);
        
        // Character-specific bonuses
        const characterBonuses = {
            'cal': overview.skillsProven.filter(s => s.toLowerCase().includes('data')).length * 5,
            'arty': overview.skillsProven.filter(s => s.toLowerCase().includes('design')).length * 5,
            'ralph': overview.skillsProven.filter(s => s.toLowerCase().includes('game')).length * 5,
            'vera': overview.skillsProven.filter(s => s.toLowerCase().includes('research')).length * 5,
            'paulo': overview.skillsProven.filter(s => s.toLowerCase().includes('business')).length * 5,
            'nash': overview.skillsProven.filter(s => s.toLowerCase().includes('communication')).length * 5
        };
        
        score += characterBonuses[character] || 0;
        score = Math.min(score, 100);
        
        return {
            score: score,
            roles: this.getJobRolesForCharacter(character, score),
            strengths: overview.skillsProven.slice(0, 5),
            recommendations: this.getJobRecommendations(score),
            marketValue: this.getMarketValueEstimate(overview.marketValue, character)
        };
    }
    
    getJobRolesForCharacter(character, score) {
        const roles = {
            'cal': ['Data Analyst', 'Systems Architect', 'Business Intelligence Developer', 'Database Administrator'],
            'arty': ['UI/UX Designer', 'Visual Designer', 'Brand Designer', 'Creative Director'],
            'ralph': ['Game Developer', 'Software Engineer', 'Technical Lead', 'Product Manager'],
            'vera': ['Research Analyst', 'Technical Writer', 'Documentation Specialist', 'Content Strategist'],
            'paulo': ['Full-Stack Developer', 'Business Analyst', 'Product Owner', 'Solutions Architect'],
            'nash': ['Community Manager', 'Platform Developer', 'Social Media Strategist', 'Collaboration Specialist']
        };
        
        const characterRoles = roles[character] || ['Software Developer'];
        
        // Filter based on score
        if (score >= 80) return characterRoles;
        if (score >= 60) return characterRoles.slice(0, 3);
        return characterRoles.slice(0, 2);
    }
    
    getJobRecommendations(score) {
        if (score >= 85) {
            return [
                'Apply for senior-level positions',
                'Consider freelance/consulting opportunities',
                'Lead team projects'
            ];
        } else if (score >= 70) {
            return [
                'Apply for mid-level positions',
                'Build more diverse project portfolio',
                'Seek mentorship opportunities'
            ];
        } else {
            return [
                'Focus on entry-level positions',
                'Complete 2-3 more projects',
                'Strengthen core skills'
            ];
        }
    }
    
    getMarketValueEstimate(marketValues, character) {
        if (!marketValues || marketValues.length === 0) {
            const baseRates = {
                'cal': '$75-125/hour',
                'arty': '$55-95/hour', 
                'ralph': '$65-110/hour',
                'vera': '$60-100/hour',
                'paulo': '$75-130/hour',
                'nash': '$60-105/hour'
            };
            return baseRates[character] || '$50-90/hour';
        }
        
        // Parse and average market values
        const rates = marketValues.map(mv => {
            const matches = mv.match(/\$(\d+)-(\d+)/);
            if (matches) {
                return (parseInt(matches[1]) + parseInt(matches[2])) / 2;
            }
            return 75; // Default
        });
        
        const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.round(avgRate * 0.8);
        const max = Math.round(avgRate * 1.2);
        
        return `$${min}-${max}/hour`;
    }
    
    getAchievementTitle(type) {
        const titles = {
            'high-quality-project': 'Excellence Award',
            'skill-mastery': 'Skill Mastery',
            'innovation': 'Innovation Recognition',
            'leadership': 'Leadership Achievement'
        };
        return titles[type] || 'Achievement';
    }
    
    getAchievementIcon(type) {
        const icons = {
            'high-quality-project': '🏆',
            'skill-mastery': '⭐',
            'innovation': '💡',
            'leadership': '👑'
        };
        return icons[type] || '🎯';
    }
    
    async applyTemplateAndStyling(content, template) {
        // Generate HTML from template
        const html = await this.generateHTMLFromTemplate(content, template);
        
        // Generate CSS styling
        const css = await this.generateCSSForTemplate(template);
        
        // Generate JavaScript interactions
        const js = await this.generateJavaScriptForTemplate(template);
        
        return {
            html: html,
            css: css,
            js: js,
            template: template.name
        };
    }
    
    async generateHTMLFromTemplate(content, template) {
        // This would use a real templating engine in production
        // For now, generate a basic HTML structure
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.header.name} - ${content.header.title}</title>
    <link rel="stylesheet" href="./css/portfolio.css">
</head>
<body class="${template.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}">
    <header class="portfolio-header">
        <div class="header-content">
            <img src="${content.header.avatar}" alt="${content.header.name}" class="avatar">
            <div class="header-text">
                <h1>${content.header.name}</h1>
                <h2>${content.header.title}</h2>
                <p class="tagline">${content.header.tagline}</p>
                <div class="stats">
                    <span>${content.header.totalProjects} Projects</span>
                    <span>${content.header.totalSkills} Skills</span>
                </div>
            </div>
        </div>
    </header>
    
    <nav class="portfolio-nav">
        <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#achievements">Achievements</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
    
    <main class="portfolio-main">
        <section id="about" class="section">
            <h2>About Me</h2>
            <p>${content.about.description}</p>
            <p><strong>Experience:</strong> ${content.about.experience}</p>
        </section>
        
        <section id="projects" class="section">
            <h2>Projects</h2>
            <div class="projects-grid">
                ${content.projects.map(project => `
                    <div class="project-card">
                        <img src="${project.thumbnail}" alt="${project.title}">
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <div class="project-skills">
                            ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                        <div class="project-links">
                            ${project.links.demo ? `<a href="${project.links.demo}">Demo</a>` : ''}
                            ${project.links.code ? `<a href="${project.links.code}">Code</a>` : ''}
                        </div>
                        ${project.grade ? `<div class="project-grade">Quality: ${project.grade}%</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section id="skills" class="section">
            <h2>Skills</h2>
            <div class="skills-categories">
                ${Object.entries(content.skills).map(([category, skills]) => 
                    skills.length > 0 ? `
                    <div class="skill-category">
                        <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                        <div class="skill-list">
                            ${skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
                        </div>
                    </div>
                ` : '').join('')}
            </div>
        </section>
        
        <section id="achievements" class="section">
            <h2>Achievements</h2>
            <div class="achievements-list">
                ${content.achievements.map(achievement => `
                    <div class="achievement-item">
                        <span class="achievement-icon">${achievement.icon}</span>
                        <div class="achievement-content">
                            <h3>${achievement.title}</h3>
                            <p>${achievement.description}</p>
                            ${achievement.project ? `<small>Project: ${achievement.project}</small>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section id="job-readiness" class="section">
            <h2>Job Readiness</h2>
            <div class="readiness-score">
                <div class="score-circle">
                    <span class="score">${content.jobReadiness.overallScore}%</span>
                </div>
                <div class="readiness-details">
                    <h3>Ready for roles:</h3>
                    <ul>
                        ${content.jobReadiness.readyForRoles.map(role => `<li>${role}</li>`).join('')}
                    </ul>
                    <p><strong>Market Value:</strong> ${content.jobReadiness.marketValue}</p>
                </div>
            </div>
        </section>
        
        <section id="contact" class="section">
            <h2>Contact</h2>
            <div class="contact-info">
                <p><strong>Email:</strong> ${content.contact.email}</p>
                <p><strong>Location:</strong> ${content.contact.location}</p>
                ${content.contact.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${content.contact.linkedin}">${content.contact.linkedin}</a></p>` : ''}
                ${content.contact.github ? `<p><strong>GitHub:</strong> <a href="${content.contact.github}">${content.contact.github}</a></p>` : ''}
            </div>
        </section>
    </main>
    
    <footer class="portfolio-footer">
        <p>&copy; ${new Date().getFullYear()} ${content.header.name}. Portfolio generated by Document Generator Platform.</p>
    </footer>
    
    <script src="./js/portfolio.js"></script>
</body>
</html>`;
    }
    
    async generateCSSForTemplate(template) {
        // Generate CSS based on template style
        const baseCSS = `
/* Portfolio Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
}

.portfolio-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 60px 20px;
    text-align: center;
}

.header-content {
    max-width: 800px;
    margin: 0 auto;
}

.avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid white;
    margin-bottom: 20px;
}

.header-text h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
}

.header-text h2 {
    font-size: 1.5em;
    margin-bottom: 10px;
    opacity: 0.9;
}

.tagline {
    font-size: 1.1em;
    margin-bottom: 20px;
    opacity: 0.8;
}

.stats {
    display: flex;
    justify-content: center;
    gap: 20px;
}

.stats span {
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9em;
}

.portfolio-nav {
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.portfolio-nav ul {
    list-style: none;
    display: flex;
    justify-content: center;
    max-width: 800px;
    margin: 0 auto;
}

.portfolio-nav li {
    margin: 0 20px;
}

.portfolio-nav a {
    display: block;
    padding: 15px 10px;
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s;
}

.portfolio-nav a:hover {
    color: #667eea;
}

.portfolio-main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px 20px;
}

.section {
    margin-bottom: 60px;
    background: white;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.section h2 {
    font-size: 2em;
    margin-bottom: 30px;
    color: #333;
    border-bottom: 3px solid #667eea;
    padding-bottom: 10px;
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

.project-card {
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
}

.project-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.project-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.project-card h3 {
    padding: 15px 20px 10px;
    font-size: 1.3em;
    color: #333;
}

.project-card p {
    padding: 0 20px 15px;
    color: #666;
}

.project-skills {
    padding: 0 20px 15px;
}

.skill-tag {
    display: inline-block;
    background: #f0f0f0;
    color: #333;
    padding: 4px 8px;
    border-radius: 15px;
    font-size: 0.8em;
    margin: 2px;
}

.project-links {
    padding: 0 20px 15px;
}

.project-links a {
    display: inline-block;
    background: #667eea;
    color: white;
    padding: 8px 16px;
    border-radius: 5px;
    text-decoration: none;
    margin-right: 10px;
    font-size: 0.9em;
    transition: background 0.3s;
}

.project-links a:hover {
    background: #5a6fd8;
}

.project-grade {
    background: #4CAF50;
    color: white;
    padding: 8px 20px;
    font-weight: bold;
    text-align: center;
}

.skills-categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
}

.skill-category h3 {
    margin-bottom: 15px;
    color: #667eea;
    font-size: 1.2em;
}

.skill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.skill-item {
    background: #667eea;
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.9em;
}

.achievements-list {
    display: grid;
    gap: 20px;
}

.achievement-item {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 10px;
    border-left: 4px solid #667eea;
}

.achievement-icon {
    font-size: 2em;
    margin-right: 20px;
}

.achievement-content h3 {
    margin-bottom: 5px;
    color: #333;
}

.achievement-content p {
    color: #666;
    margin-bottom: 5px;
}

.achievement-content small {
    color: #999;
}

.readiness-score {
    display: flex;
    align-items: center;
    gap: 40px;
}

.score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: conic-gradient(#4CAF50 0deg 252deg, #e0e0e0 252deg 360deg);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.score-circle::before {
    content: '';
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: white;
    position: absolute;
}

.score {
    font-size: 1.5em;
    font-weight: bold;
    color: #4CAF50;
    z-index: 1;
}

.readiness-details ul {
    list-style: none;
    margin: 10px 0;
}

.readiness-details li {
    padding: 5px 0;
    color: #333;
}

.readiness-details li::before {
    content: '✓ ';
    color: #4CAF50;
    font-weight: bold;
}

.contact-info p {
    margin-bottom: 10px;
    font-size: 1.1em;
}

.contact-info a {
    color: #667eea;
    text-decoration: none;
}

.contact-info a:hover {
    text-decoration: underline;
}

.portfolio-footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 40px 20px;
    margin-top: 60px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .portfolio-nav ul {
        flex-wrap: wrap;
    }
    
    .portfolio-nav li {
        margin: 0 10px;
    }
    
    .section {
        padding: 20px;
    }
    
    .readiness-score {
        flex-direction: column;
        text-align: center;
    }
}
`;
        
        return baseCSS;
    }
    
    async generateJavaScriptForTemplate(template) {
        return `
// Portfolio Interactive Features
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation
    const navLinks = document.querySelectorAll('.portfolio-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Project card interactions
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', function() {
            // Could expand to show project details
            console.log('Project card clicked:', this);
        });
    });
    
    // Animate score circle
    const scoreElement = document.querySelector('.score');
    if (scoreElement) {
        const score = parseInt(scoreElement.textContent);
        const circle = document.querySelector('.score-circle');
        if (circle) {
            const degrees = (score / 100) * 360;
            circle.style.background = \`conic-gradient(#4CAF50 0deg \${degrees}deg, #e0e0e0 \${degrees}deg 360deg)\`;
        }
    }
    
    console.log('Portfolio interactive features loaded');
});
`;
    }
    
    async generateSupportingAssets(generation) {
        // Generate placeholder assets
        const assets = {
            avatar: await this.generateAvatarPlaceholder(generation.character),
            projectThumbnails: await this.generateProjectThumbnails(generation.projects),
            icons: await this.generateIcons(),
            manifest: await this.generateWebManifest(generation)
        };
        
        return assets;
    }
    
    async generateAvatarPlaceholder(character) {
        // Create a simple SVG avatar based on character
        const avatars = {
            'cal': '<svg><!-- Cal avatar SVG --></svg>',
            'arty': '<svg><!-- Arty avatar SVG --></svg>',
            'ralph': '<svg><!-- Ralph avatar SVG --></svg>',
            'vera': '<svg><!-- Vera avatar SVG --></svg>',
            'paulo': '<svg><!-- Paulo avatar SVG --></svg>',
            'nash': '<svg><!-- Nash avatar SVG --></svg>'
        };
        
        return avatars[character] || '<svg><!-- Default avatar --></svg>';
    }
    
    async generateProjectThumbnails(projects) {
        // Generate placeholder thumbnails for projects
        return projects.map(project => ({
            projectId: project.id,
            thumbnail: `./assets/project_${project.id}_thumb.png`,
            generated: true
        }));
    }
    
    async generateIcons() {
        return {
            favicon: './assets/favicon.ico',
            appleTouchIcon: './assets/apple-touch-icon.png',
            icon192: './assets/icon-192.png',
            icon512: './assets/icon-512.png'
        };
    }
    
    async generateWebManifest(generation) {
        return {
            name: `${generation.studentId} Portfolio`,
            short_name: 'Portfolio',
            description: `Professional portfolio for ${generation.character}`,
            start_url: '/',
            display: 'standalone',
            theme_color: '#667eea',
            background_color: '#ffffff',
            icons: [
                {
                    src: './assets/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: './assets/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png'
                }
            ]
        };
    }
    
    async finalizePortfolio(styledPortfolio, assets, generation) {
        const portfolioId = generation.id;
        const portfolioDir = path.join(this.portfolioOutputDir, portfolioId);
        
        // Create portfolio directory
        await fs.mkdir(portfolioDir, { recursive: true });
        await fs.mkdir(path.join(portfolioDir, 'css'), { recursive: true });
        await fs.mkdir(path.join(portfolioDir, 'js'), { recursive: true });
        await fs.mkdir(path.join(portfolioDir, 'assets'), { recursive: true });
        
        // Write HTML file
        await fs.writeFile(path.join(portfolioDir, 'index.html'), styledPortfolio.html);
        
        // Write CSS file
        await fs.writeFile(path.join(portfolioDir, 'css', 'portfolio.css'), styledPortfolio.css);
        
        // Write JavaScript file
        await fs.writeFile(path.join(portfolioDir, 'js', 'portfolio.js'), styledPortfolio.js);
        
        // Write manifest
        await fs.writeFile(
            path.join(portfolioDir, 'manifest.json'), 
            JSON.stringify(assets.manifest, null, 2)
        );
        
        const finalPortfolio = {
            id: portfolioId,
            studentId: generation.studentId,
            character: generation.character,
            template: generation.template.name,
            url: `http://localhost:${this.port}/portfolio/${portfolioId}`,
            localPath: portfolioDir,
            files: {
                html: 'index.html',
                css: 'css/portfolio.css',
                js: 'js/portfolio.js',
                manifest: 'manifest.json'
            },
            assets: assets,
            generatedAt: Date.now(),
            projectCount: generation.projects.length
        };
        
        return finalPortfolio;
    }
    
    // Utility methods
    generateSessionId() {
        return `portfolio_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;
    }
    
    getRecentPortfolios() {
        return Array.from(this.generatedPortfolios.values())
            .filter(p => p.status === 'completed')
            .sort((a, b) => b.completedAt - a.completedAt)
            .slice(0, 5)
            .map(p => ({
                id: p.id,
                studentId: p.studentId,
                character: p.character,
                template: p.template.name,
                url: p.result.url,
                generatedAt: p.completedAt
            }));
    }
    
    async createPortfolioTemplates() {
        // Create basic template files - in production these would be more sophisticated
        const templateContent = '<!-- Portfolio template will be here -->';
        
        Object.keys(this.portfolioTemplates).forEach(async (templateName) => {
            const templatePath = path.join(this.templateDir, `${templateName}.html`);
            try {
                await fs.writeFile(templatePath, templateContent);
            } catch (e) {
                // Template already exists or error creating
            }
        });
    }
    
    async loadExistingPortfolios() {
        // Load any existing portfolios from disk
        try {
            const portfolios = await fs.readdir(this.portfolioOutputDir);
            console.log(`📁 Found ${portfolios.length} existing portfolios`);
        } catch (e) {
            console.log('📁 No existing portfolios found');
        }
    }
}

// Auto-start if run directly
if (require.main === module) {
    console.log('📁 STARTING PORTFOLIO GENERATOR');
    console.log('🎨 Professional Portfolios from Student Projects');
    console.log('==================================================\n');
    
    const generator = new PortfolioGenerator();
    generator.start().catch(console.error);
    
    console.log('✨ Ready to generate job-ready portfolios!');
}

module.exports = PortfolioGenerator;
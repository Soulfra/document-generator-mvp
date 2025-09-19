/**
 * 📄💼✨ Job Application Template System
 * Generates tailored resumes, cover letters, and portfolios
 * Extends existing template processor for job applications
 */

class JobApplicationTemplates {
    constructor() {
        this.resumeTemplates = new Map();
        this.coverLetterTemplates = new Map();
        this.portfolioTemplates = new Map();
        
        // Initialize default templates
        this.initializeResumeTemplates();
        this.initializeCoverLetterTemplates();
        this.initializePortfolioTemplates();
        
        // User profile cache
        this.userProfile = null;
        
        console.log('📄 Job Application Templates initialized');
    }

    /**
     * Set user profile for personalization
     */
    setUserProfile(profile) {
        this.userProfile = profile;
        console.log('👤 User profile updated');
    }

    /**
     * Generate complete application package
     */
    async generateApplicationPackage(jobData, userProfile = null) {
        try {
            const profile = userProfile || this.userProfile;
            if (!profile) {
                throw new Error('User profile required for application generation');
            }

            console.log('📦 Generating complete application package...');

            // Select best templates based on job
            const resumeTemplate = this.selectResumeTemplate(jobData, profile);
            const coverTemplate = this.selectCoverLetterTemplate(jobData, profile);
            const portfolioTemplate = this.selectPortfolioTemplate(jobData, profile);

            // Generate all documents
            const [resume, coverLetter, portfolio] = await Promise.all([
                this.generateResume(jobData, profile, resumeTemplate),
                this.generateCoverLetter(jobData, profile, coverTemplate),
                this.generatePortfolio(jobData, profile, portfolioTemplate)
            ]);

            const applicationPackage = {
                jobData,
                generatedAt: new Date().toISOString(),
                documents: {
                    resume,
                    coverLetter,
                    portfolio
                },
                metadata: {
                    resumeTemplate: resumeTemplate.id,
                    coverTemplate: coverTemplate.id,
                    portfolioTemplate: portfolioTemplate.id,
                    matchScore: this.calculateJobMatch(jobData, profile)
                }
            };

            console.log('✅ Application package generated successfully');
            return applicationPackage;

        } catch (error) {
            console.error('❌ Error generating application package:', error);
            throw error;
        }
    }

    /**
     * Initialize resume templates
     */
    initializeResumeTemplates() {
        // ATS-Friendly Template
        this.resumeTemplates.set('ats-friendly', {
            id: 'ats-friendly',
            name: 'ATS-Friendly Resume',
            description: 'Clean, scannable format optimized for Applicant Tracking Systems',
            bestFor: ['corporate', 'traditional', 'large-company'],
            sections: [
                'contact',
                'professional-summary',
                'technical-skills',
                'work-experience',
                'education',
                'certifications',
                'projects'
            ],
            formatting: {
                fonts: ['Arial', 'Calibri', 'Times New Roman'],
                colors: ['black', 'dark-blue', 'dark-gray'],
                layout: 'single-column',
                bulletPoints: 'simple',
                headers: 'clear'
            }
        });

        // Creative Template
        this.resumeTemplates.set('creative', {
            id: 'creative',
            name: 'Creative Resume',
            description: 'Visually appealing design for creative roles',
            bestFor: ['startup', 'design', 'creative', 'marketing'],
            sections: [
                'header-with-photo',
                'brand-statement',
                'core-competencies',
                'experience-timeline',
                'education',
                'portfolio-highlights',
                'awards'
            ],
            formatting: {
                fonts: ['Helvetica', 'Montserrat', 'Open Sans'],
                colors: ['brand-primary', 'accent-color', 'modern-gray'],
                layout: 'two-column',
                bulletPoints: 'custom-icons',
                headers: 'styled'
            }
        });

        // Technical Template
        this.resumeTemplates.set('technical', {
            id: 'technical',
            name: 'Technical Resume',
            description: 'Optimized for software engineering and technical roles',
            bestFor: ['tech', 'engineering', 'development', 'security'],
            sections: [
                'contact',
                'technical-summary',
                'technical-skills',
                'programming-languages',
                'work-experience',
                'technical-projects',
                'education',
                'certifications',
                'open-source-contributions'
            ],
            formatting: {
                fonts: ['Source Code Pro', 'Roboto', 'Lato'],
                colors: ['tech-blue', 'code-green', 'terminal-gray'],
                layout: 'hybrid',
                bulletPoints: 'code-style',
                headers: 'technical'
            }
        });

        // Executive Template
        this.resumeTemplates.set('executive', {
            id: 'executive',
            name: 'Executive Resume',
            description: 'Professional format for senior leadership positions',
            bestFor: ['executive', 'senior', 'leadership', 'c-level'],
            sections: [
                'executive-summary',
                'core-competencies',
                'executive-experience',
                'key-achievements',
                'board-positions',
                'education',
                'professional-affiliations',
                'speaking-engagements'
            ],
            formatting: {
                fonts: ['Georgia', 'Minion Pro', 'Trajan Pro'],
                colors: ['executive-navy', 'gold-accent', 'professional-gray'],
                layout: 'traditional',
                bulletPoints: 'executive-style',
                headers: 'elegant'
            }
        });

        console.log(`📄 ${this.resumeTemplates.size} resume templates loaded`);
    }

    /**
     * Initialize cover letter templates
     */
    initializeCoverLetterTemplates() {
        // Standard Template
        this.coverLetterTemplates.set('standard', {
            id: 'standard',
            name: 'Standard Cover Letter',
            description: 'Professional business letter format',
            bestFor: ['corporate', 'traditional', 'formal'],
            structure: [
                'header-with-contact',
                'date-and-employer-contact',
                'professional-greeting',
                'opening-paragraph',
                'experience-paragraph',
                'skills-match-paragraph',
                'company-interest-paragraph',
                'closing-paragraph',
                'professional-signature'
            ],
            tone: 'professional',
            length: 'medium'
        });

        // Startup Template
        this.coverLetterTemplates.set('startup', {
            id: 'startup',
            name: 'Startup Cover Letter',
            description: 'Casual, personality-driven letter for startup culture',
            bestFor: ['startup', 'small-company', 'casual', 'remote'],
            structure: [
                'personal-header',
                'casual-greeting',
                'hook-opening',
                'passion-paragraph',
                'impact-stories',
                'culture-fit-paragraph',
                'enthusiastic-closing',
                'casual-signature'
            ],
            tone: 'conversational',
            length: 'concise'
        });

        // Technical Template
        this.coverLetterTemplates.set('technical', {
            id: 'technical',
            name: 'Technical Cover Letter',
            description: 'Focused on technical skills and project experience',
            bestFor: ['tech', 'engineering', 'development'],
            structure: [
                'technical-header',
                'direct-greeting',
                'technical-opening',
                'skills-alignment',
                'project-highlights',
                'technical-fit',
                'contribution-closing',
                'professional-signature'
            ],
            tone: 'technical-professional',
            length: 'detailed'
        });

        console.log(`📝 ${this.coverLetterTemplates.size} cover letter templates loaded`);
    }

    /**
     * Initialize portfolio templates
     */
    initializePortfolioTemplates() {
        // Project Showcase
        this.portfolioTemplates.set('project-showcase', {
            id: 'project-showcase',
            name: 'Project Showcase',
            description: 'Highlights top 3-5 relevant projects',
            bestFor: ['development', 'design', 'creative'],
            sections: [
                'portfolio-intro',
                'featured-projects',
                'technical-skills-visual',
                'process-overview',
                'contact-cta'
            ],
            format: 'visual-heavy'
        });

        // Case Studies
        this.portfolioTemplates.set('case-studies', {
            id: 'case-studies',
            name: 'Case Studies',
            description: 'Detailed problem-solving narratives',
            bestFor: ['consulting', 'product', 'strategy'],
            sections: [
                'case-study-intro',
                'problem-definition',
                'solution-approach',
                'implementation',
                'results-metrics',
                'lessons-learned'
            ],
            format: 'narrative-driven'
        });

        // GitHub Showcase
        this.portfolioTemplates.set('github-showcase', {
            id: 'github-showcase',
            name: 'GitHub Showcase',
            description: 'Code repositories and contributions',
            bestFor: ['software-engineering', 'open-source'],
            sections: [
                'github-overview',
                'top-repositories',
                'contribution-graph',
                'code-samples',
                'open-source-contributions',
                'technical-blog-posts'
            ],
            format: 'code-focused'
        });

        console.log(`🎨 ${this.portfolioTemplates.size} portfolio templates loaded`);
    }

    /**
     * Select best resume template based on job
     */
    selectResumeTemplate(jobData, userProfile) {
        // Analyze job and company type
        const jobType = this.analyzeJobType(jobData);
        const companyType = this.analyzeCompanyType(jobData);
        
        // Score each template
        const scores = new Map();
        
        for (const [id, template] of this.resumeTemplates) {
            let score = 0;
            
            // Company type match
            if (template.bestFor.includes(companyType)) score += 3;
            
            // Job type match
            if (template.bestFor.includes(jobType)) score += 2;
            
            // Industry-specific bonuses
            if (jobData.companyResearch?.industry?.toLowerCase().includes('tech') && 
                template.id === 'technical') score += 2;
            
            if (jobData.jobTitle?.toLowerCase().includes('senior') && 
                template.id === 'executive') score += 1;
            
            scores.set(id, score);
        }
        
        // Return highest scoring template
        const bestTemplate = [...scores.entries()]
            .sort((a, b) => b[1] - a[1])[0][0];
        
        console.log(`📄 Selected resume template: ${bestTemplate}`);
        return this.resumeTemplates.get(bestTemplate);
    }

    /**
     * Select best cover letter template
     */
    selectCoverLetterTemplate(jobData, userProfile) {
        const companyType = this.analyzeCompanyType(jobData);
        
        // Simple selection logic
        if (companyType === 'startup') return this.coverLetterTemplates.get('startup');
        if (companyType === 'tech') return this.coverLetterTemplates.get('technical');
        
        return this.coverLetterTemplates.get('standard');
    }

    /**
     * Select best portfolio template
     */
    selectPortfolioTemplate(jobData, userProfile) {
        const jobType = this.analyzeJobType(jobData);
        
        if (jobType === 'development' || jobType === 'tech') {
            return this.portfolioTemplates.get('github-showcase');
        }
        
        if (jobType === 'consulting' || jobType === 'strategy') {
            return this.portfolioTemplates.get('case-studies');
        }
        
        return this.portfolioTemplates.get('project-showcase');
    }

    /**
     * Analyze job type from job data
     */
    analyzeJobType(jobData) {
        const title = jobData.jobTitle?.toLowerCase() || '';
        const description = jobData.description?.toLowerCase() || '';
        
        if (title.includes('developer') || title.includes('engineer') || 
            title.includes('programmer')) return 'development';
        
        if (title.includes('security') || title.includes('architect')) return 'tech';
        
        if (title.includes('design') || title.includes('creative')) return 'design';
        
        if (title.includes('senior') || title.includes('lead') || 
            title.includes('manager')) return 'senior';
        
        if (title.includes('consultant') || title.includes('strategy')) return 'consulting';
        
        return 'general';
    }

    /**
     * Analyze company type from job data
     */
    analyzeCompanyType(jobData) {
        const company = jobData.company?.toLowerCase() || '';
        const description = jobData.description?.toLowerCase() || '';
        
        // Check company research data
        if (jobData.companyResearch?.size) {
            const size = jobData.companyResearch.size.toLowerCase();
            if (size.includes('1-50') || size.includes('startup')) return 'startup';
            if (size.includes('5000+') || size.includes('10000+')) return 'large-company';
        }
        
        // Check for tech indicators
        if (jobData.companyResearch?.industry?.toLowerCase().includes('technology') ||
            jobData.companyResearch?.techStack?.length > 0) return 'tech';
        
        // Check for startup indicators
        if (company.includes('startup') || description.includes('fast-paced') ||
            description.includes('equity')) return 'startup';
        
        // Check for corporate indicators
        if (company.includes('corporation') || company.includes('enterprise') ||
            description.includes('fortune')) return 'corporate';
        
        return 'traditional';
    }

    /**
     * Generate tailored resume
     */
    async generateResume(jobData, userProfile, template) {
        console.log(`📄 Generating ${template.name}...`);
        
        // Customize sections based on job requirements
        const sections = this.customizeResumeSections(jobData, userProfile, template);
        
        // Generate content for each section
        const content = {};
        for (const section of sections) {
            content[section] = await this.generateResumeSection(section, jobData, userProfile);
        }
        
        return {
            templateId: template.id,
            templateName: template.name,
            sections: content,
            formatting: template.formatting,
            generatedAt: new Date().toISOString(),
            wordCount: this.calculateWordCount(content),
            pageCount: this.estimatePageCount(content)
        };
    }

    /**
     * Generate tailored cover letter
     */
    async generateCoverLetter(jobData, userProfile, template) {
        console.log(`📝 Generating ${template.name}...`);
        
        const content = {};
        for (const section of template.structure) {
            content[section] = await this.generateCoverLetterSection(section, jobData, userProfile);
        }
        
        return {
            templateId: template.id,
            templateName: template.name,
            structure: content,
            tone: template.tone,
            length: template.length,
            generatedAt: new Date().toISOString(),
            wordCount: this.calculateWordCount(content)
        };
    }

    /**
     * Generate portfolio presentation
     */
    async generatePortfolio(jobData, userProfile, template) {
        console.log(`🎨 Generating ${template.name}...`);
        
        // Select most relevant projects
        const relevantProjects = this.selectRelevantProjects(jobData, userProfile);
        
        const content = {};
        for (const section of template.sections) {
            content[section] = await this.generatePortfolioSection(section, jobData, userProfile, relevantProjects);
        }
        
        return {
            templateId: template.id,
            templateName: template.name,
            sections: content,
            format: template.format,
            projects: relevantProjects,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Customize resume sections based on job
     */
    customizeResumeSections(jobData, userProfile, template) {
        let sections = [...template.sections];
        
        // Add job-specific sections
        if (jobData.requirements?.some(req => req.toLowerCase().includes('security'))) {
            if (!sections.includes('security-clearances')) {
                sections.splice(sections.indexOf('certifications'), 0, 'security-clearances');
            }
        }
        
        // Reorder sections based on relevance
        sections = this.reorderSectionsByRelevance(sections, jobData);
        
        return sections;
    }

    /**
     * Reorder resume sections by relevance to job
     */
    reorderSectionsByRelevance(sections, jobData) {
        const relevanceScores = new Map();
        
        sections.forEach((section, index) => {
            let score = sections.length - index; // Base order score
            
            // Boost technical sections for tech jobs
            if (jobData.jobTitle?.toLowerCase().includes('engineer') ||
                jobData.jobTitle?.toLowerCase().includes('developer')) {
                if (section.includes('technical') || section.includes('projects')) {
                    score += 10;
                }
            }
            
            // Boost experience for senior roles
            if (jobData.jobTitle?.toLowerCase().includes('senior') ||
                jobData.jobTitle?.toLowerCase().includes('lead')) {
                if (section.includes('experience')) {
                    score += 8;
                }
            }
            
            relevanceScores.set(section, score);
        });
        
        return [...relevanceScores.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([section]) => section);
    }

    /**
     * Generate resume section content
     */
    async generateResumeSection(section, jobData, userProfile) {
        switch (section) {
            case 'contact':
                return this.generateContactSection(userProfile);
            
            case 'professional-summary':
                return this.generateProfessionalSummary(jobData, userProfile);
            
            case 'technical-skills':
                return this.generateTechnicalSkills(jobData, userProfile);
            
            case 'work-experience':
                return this.generateWorkExperience(jobData, userProfile);
            
            case 'education':
                return this.generateEducation(userProfile);
            
            case 'projects':
                return this.generateProjects(jobData, userProfile);
            
            default:
                return this.generateGenericSection(section, jobData, userProfile);
        }
    }

    /**
     * Generate contact section
     */
    generateContactSection(userProfile) {
        return {
            name: userProfile.name || 'Your Name',
            email: userProfile.email || 'your.email@example.com',
            phone: userProfile.phone || '(555) 123-4567',
            location: userProfile.location || 'City, State',
            linkedin: userProfile.linkedin || 'linkedin.com/in/yourname',
            github: userProfile.github || 'github.com/yourusername',
            website: userProfile.website || 'yourwebsite.com'
        };
    }

    /**
     * Generate professional summary
     */
    generateProfessionalSummary(jobData, userProfile) {
        const yearsExp = userProfile.yearsExperience || 5;
        const skills = userProfile.topSkills?.slice(0, 3) || ['software development', 'problem solving', 'teamwork'];
        
        return `Experienced ${jobData.jobTitle?.toLowerCase() || 'professional'} with ${yearsExp}+ years of expertise in ${skills.join(', ')}. Proven track record of delivering high-quality solutions and driving business impact. Passionate about ${jobData.companyResearch?.industry?.toLowerCase() || 'technology'} and committed to continuous learning and innovation.`;
    }

    /**
     * Generate technical skills section
     */
    generateTechnicalSkills(jobData, userProfile) {
        const skills = {
            'Programming Languages': userProfile.programmingLanguages || ['JavaScript', 'Python', 'Java'],
            'Frameworks & Libraries': userProfile.frameworks || ['React', 'Node.js', 'Express'],
            'Tools & Technologies': userProfile.tools || ['Git', 'Docker', 'AWS'],
            'Databases': userProfile.databases || ['PostgreSQL', 'MongoDB', 'Redis']
        };
        
        // Prioritize skills mentioned in job requirements
        return this.prioritizeSkillsByJobReqs(skills, jobData);
    }

    /**
     * Prioritize skills based on job requirements
     */
    prioritizeSkillsByJobReqs(skills, jobData) {
        const requirements = jobData.requirements?.join(' ').toLowerCase() || '';
        
        const prioritizedSkills = {};
        Object.entries(skills).forEach(([category, skillList]) => {
            prioritizedSkills[category] = skillList.sort((a, b) => {
                const aScore = requirements.includes(a.toLowerCase()) ? 1 : 0;
                const bScore = requirements.includes(b.toLowerCase()) ? 1 : 0;
                return bScore - aScore;
            });
        });
        
        return prioritizedSkills;
    }

    /**
     * Calculate job match score
     */
    calculateJobMatch(jobData, userProfile) {
        let matchScore = 0;
        let totalCriteria = 0;
        
        // Check required skills match
        if (jobData.requirements && userProfile.skills) {
            const requirements = jobData.requirements.join(' ').toLowerCase();
            const userSkills = userProfile.skills.map(s => s.toLowerCase());
            
            userSkills.forEach(skill => {
                totalCriteria++;
                if (requirements.includes(skill)) {
                    matchScore++;
                }
            });
        }
        
        // Check experience level
        if (jobData.jobTitle && userProfile.yearsExperience) {
            totalCriteria++;
            if (jobData.jobTitle.toLowerCase().includes('senior') && userProfile.yearsExperience >= 5) {
                matchScore++;
            } else if (jobData.jobTitle.toLowerCase().includes('junior') && userProfile.yearsExperience <= 3) {
                matchScore++;
            } else if (!jobData.jobTitle.toLowerCase().includes('senior') && !jobData.jobTitle.toLowerCase().includes('junior')) {
                matchScore++;
            }
        }
        
        return totalCriteria > 0 ? Math.round((matchScore / totalCriteria) * 100) : 50;
    }

    /**
     * Calculate word count for content
     */
    calculateWordCount(content) {
        const text = JSON.stringify(content);
        return text.split(/\s+/).length;
    }

    /**
     * Estimate page count
     */
    estimatePageCount(content) {
        const wordCount = this.calculateWordCount(content);
        return Math.ceil(wordCount / 500); // Rough estimate: 500 words per page
    }

    /**
     * Select relevant projects for portfolio
     */
    selectRelevantProjects(jobData, userProfile) {
        const allProjects = userProfile.projects || [];
        const requirements = jobData.requirements?.join(' ').toLowerCase() || '';
        
        // Score projects by relevance
        const scoredProjects = allProjects.map(project => {
            let score = 0;
            const projectText = `${project.name} ${project.description} ${project.technologies?.join(' ')}`.toLowerCase();
            
            // Check technology match
            if (project.technologies) {
                project.technologies.forEach(tech => {
                    if (requirements.includes(tech.toLowerCase())) {
                        score += 3;
                    }
                });
            }
            
            // Check keyword match
            const keywords = ['security', 'web', 'mobile', 'api', 'database', 'cloud'];
            keywords.forEach(keyword => {
                if (requirements.includes(keyword) && projectText.includes(keyword)) {
                    score += 2;
                }
            });
            
            return { ...project, relevanceScore: score };
        });
        
        // Return top 5 most relevant projects
        return scoredProjects
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);
    }

    /**
     * Generate placeholder content for missing sections
     */
    generateGenericSection(section, jobData, userProfile) {
        return `Content for ${section} section - customization in progress...`;
    }

    /**
     * Generate cover letter section content
     */
    async generateCoverLetterSection(section, jobData, userProfile) {
        // Implementation would generate specific content for each cover letter section
        return `Generated content for ${section}`;
    }

    /**
     * Generate portfolio section content
     */
    async generatePortfolioSection(section, jobData, userProfile, projects) {
        // Implementation would generate specific content for each portfolio section
        return `Generated content for ${section}`;
    }

    /**
     * Generate work experience
     */
    generateWorkExperience(jobData, userProfile) {
        const experiences = userProfile.workExperience || [];
        
        return experiences.map(exp => ({
            ...exp,
            highlightedAchievements: this.selectRelevantAchievements(exp.achievements || [], jobData)
        }));
    }

    /**
     * Select relevant achievements based on job
     */
    selectRelevantAchievements(achievements, jobData) {
        const requirements = jobData.requirements?.join(' ').toLowerCase() || '';
        
        return achievements
            .map(achievement => ({
                text: achievement,
                relevanceScore: this.calculateAchievementRelevance(achievement, requirements)
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 3)
            .map(a => a.text);
    }

    /**
     * Calculate achievement relevance to job
     */
    calculateAchievementRelevance(achievement, requirements) {
        const achText = achievement.toLowerCase();
        let score = 0;
        
        // Check for quantified results
        if (achText.match(/\d+%|\$\d+|increased|improved|reduced/)) {
            score += 2;
        }
        
        // Check for keyword matches
        const keywords = requirements.split(' ');
        keywords.forEach(keyword => {
            if (keyword.length > 3 && achText.includes(keyword)) {
                score += 1;
            }
        });
        
        return score;
    }

    /**
     * Generate education section
     */
    generateEducation(userProfile) {
        return userProfile.education || [{
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            school: 'University Name',
            graduationYear: '2020',
            gpa: '3.7'
        }];
    }

    /**
     * Generate projects section
     */
    generateProjects(jobData, userProfile) {
        return this.selectRelevantProjects(jobData, userProfile).slice(0, 3);
    }

    /**
     * Export application package to various formats
     */
    exportApplicationPackage(applicationPackage, format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(applicationPackage, null, 2);
            
            case 'summary':
                return this.generateApplicationSummary(applicationPackage);
            
            case 'pdf':
                return this.generatePDFExport(applicationPackage);
            
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Generate application summary
     */
    generateApplicationSummary(applicationPackage) {
        const { jobData, documents, metadata } = applicationPackage;
        
        return `
🎯 Job Application Package
==========================

📍 Position: ${jobData.jobTitle}
🏢 Company: ${jobData.company}
📊 Match Score: ${metadata.matchScore}%

📄 Generated Documents:
• Resume (${documents.resume.templateName})
• Cover Letter (${documents.coverLetter.templateName})
• Portfolio (${documents.portfolio.templateName})

📈 Package Statistics:
• Resume: ${documents.resume.pageCount} page(s), ${documents.resume.wordCount} words
• Cover Letter: ${documents.coverLetter.wordCount} words
• Portfolio: ${documents.portfolio.projects.length} featured projects

🕒 Generated: ${new Date(applicationPackage.generatedAt).toLocaleString()}
        `.trim();
    }

    /**
     * Generate PDF export instructions
     */
    generatePDFExport(applicationPackage) {
        return {
            message: 'PDF generation requires additional dependencies',
            recommendation: 'Use a PDF generation library like puppeteer or jsPDF',
            data: applicationPackage
        };
    }

    /**
     * Get template statistics
     */
    getTemplateStats() {
        return {
            resumeTemplates: this.resumeTemplates.size,
            coverLetterTemplates: this.coverLetterTemplates.size,
            portfolioTemplates: this.portfolioTemplates.size,
            totalTemplates: this.resumeTemplates.size + this.coverLetterTemplates.size + this.portfolioTemplates.size
        };
    }

    /**
     * List available templates
     */
    listTemplates() {
        return {
            resume: Array.from(this.resumeTemplates.values()).map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                bestFor: t.bestFor
            })),
            coverLetter: Array.from(this.coverLetterTemplates.values()).map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                bestFor: t.bestFor
            })),
            portfolio: Array.from(this.portfolioTemplates.values()).map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                bestFor: t.bestFor
            }))
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobApplicationTemplates;
} else {
    window.JobApplicationTemplates = JobApplicationTemplates;
}

console.log('📄💼✨ Job Application Templates loaded - Ready to generate tailored applications!');
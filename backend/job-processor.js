
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

// Configure Puppeteer with stealth mode
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function processJobApplication(jobData) {
    const sessionId = 'session_' + Date.now();
    
    try {
        // Broadcast progress if available
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 10, 'Starting job processing...');
        }
        
        // Step 1: Scrape job posting
        let jobInfo = {};
        if (jobData.jobURL) {
            jobInfo = await scrapeJobPosting(jobData.jobURL);
            if (global.broadcastJobProgress) {
                global.broadcastJobProgress(sessionId, 30, 'Job posting scraped successfully');
            }
        } else {
            jobInfo = {
                jobTitle: 'Position from Manual Description',
                company: 'Unknown Company',
                description: jobData.manualDescription,
                requirements: []
            };
        }
        
        // Step 2: Generate resume
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 50, 'Generating tailored resume...');
        }
        
        const resume = await generateResume(jobData.userProfile, jobInfo);
        
        // Step 3: Generate cover letter
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 70, 'Writing cover letter...');
        }
        
        const coverLetter = await generateCoverLetter(jobData.userProfile, jobInfo);
        
        // Step 4: Finalize
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 100, 'Application package ready!');
        }
        
        return {
            sessionId,
            jobData: jobInfo,
            documents: {
                resume,
                coverLetter
            },
            generatedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Job processing error:', error);
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 0, 'Error: ' + error.message);
        }
        throw error;
    }
}

async function scrapeJobPosting(jobURL) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    try {
        const page = await browser.newPage();
        
        // Set realistic headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        await page.goto(jobURL, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Extract job information
        const jobInfo = await page.evaluate(() => {
            // Generic selectors that work on most job sites
            const titleSelectors = ['h1', '.job-title', '[data-testid="job-title"]', '.jobtitle'];
            const companySelectors = ['.company', '.company-name', '[data-testid="company-name"]'];
            const descSelectors = ['.job-description', '.description', '.job-details'];
            
            function findBySelectors(selectors) {
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) return element.textContent.trim();
                }
                return '';
            }
            
            return {
                jobTitle: findBySelectors(titleSelectors) || 'Unknown Position',
                company: findBySelectors(companySelectors) || 'Unknown Company',
                description: findBySelectors(descSelectors) || 'No description found',
                location: document.querySelector('.location, .job-location')?.textContent.trim() || 'Unknown Location',
                platform: window.location.hostname
            };
        });
        
        return jobInfo;
        
    } finally {
        await browser.close();
    }
}

async function generateResume(userProfile, jobInfo) {
    // Simple template-based resume generation
    // In production, this would use AI services
    
    const resume = {
        header: {
            name: userProfile.name,
            email: userProfile.email
        },
        summary: `Experienced professional with expertise in ${userProfile.skills?.slice(0, 3).join(', ') || 'various technologies'}. Seeking opportunities in ${jobInfo.jobTitle} role.`,
        experience: userProfile.experience,
        skills: userProfile.skills?.join(', ') || '',
        education: userProfile.education,
        content: `
${userProfile.name}
${userProfile.email}

PROFESSIONAL SUMMARY
Experienced professional with expertise in ${userProfile.skills?.slice(0, 3).join(', ') || 'various technologies'}. Seeking opportunities in ${jobInfo.jobTitle} role at ${jobInfo.company}.

EXPERIENCE
${userProfile.experience}

SKILLS
${userProfile.skills?.join(', ') || ''}

EDUCATION
${userProfile.education || ''}
        `.trim()
    };
    
    return resume;
}

async function generateCoverLetter(userProfile, jobInfo) {
    const coverLetter = {
        content: `
Dear Hiring Manager,

I am writing to express my strong interest in the ${jobInfo.jobTitle} position at ${jobInfo.company}. With my background in ${userProfile.skills?.slice(0, 2).join(' and ') || 'technology'}, I am confident I would be a valuable addition to your team.

${userProfile.experience}

I am particularly excited about this opportunity because ${jobInfo.company} has a strong reputation in the industry. My skills in ${userProfile.skills?.slice(0, 3).join(', ') || 'various technologies'} align well with your requirements.

I would welcome the opportunity to discuss how my experience can contribute to your team's success.

Best regards,
${userProfile.name}
        `.trim()
    };
    
    return coverLetter;
}

async function testJobScraping(jobURL) {
    try {
        const jobInfo = await scrapeJobPosting(jobURL);
        return {
            ...jobInfo,
            tested: true,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Scraping failed: ${error.message}`);
    }
}

module.exports = {
    processJobApplication,
    testJobScraping,
    scrapeJobPosting
};

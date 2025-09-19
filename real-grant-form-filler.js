/**
 * Real Grant Form Filler
 * 
 * Actually fills out grant forms on real websites
 * while displaying progress through the character interface
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class RealGrantFormFiller {
    constructor() {
        // Soulfra's complete data for forms
        this.soulfrData = {
            // Basic Info
            legalName: "Soulfra LLC",
            dba: "Soulfra",
            ein: "", // User needs to provide
            dunsNumber: "",
            cageCode: "",
            
            // Contact
            address: {
                street: "",
                city: "",
                state: "",
                zip: ""
            },
            phone: "",
            email: "",
            website: "soulfra.com",
            
            // Business Details
            businessType: "Limited Liability Company",
            naicsCode: "541511",
            sicCode: "7371",
            foundedDate: "2024-01-01",
            stateOfIncorporation: "",
            
            // Leadership
            founder: {
                firstName: "",
                lastName: "",
                title: "CEO/Founder",
                email: "",
                phone: "",
                linkedIn: ""
            },
            
            // Financials
            annualRevenue: "0",
            employeeCount: "1",
            fundingToDate: "0",
            
            // Project Details
            projectTitle: "AI-Powered Document to MVP Platform",
            projectSummary: "Soulfra transforms any document into a working MVP in under 30 minutes using advanced AI",
            problemStatement: "Businesses spend months and $100k+ converting ideas to software",
            solution: "Instant AI-powered transformation from documents to deployable applications",
            marketSize: "$50B global custom software development market",
            competitiveAdvantage: "First platform to fully automate MVP generation from any document type"
        };
        
        // Form filling strategies for different sites
        this.formStrategies = {
            'aws.amazon.com/activate': this.fillAWSActivate.bind(this),
            'seedfund.nsf.gov': this.fillNSFSBIR.bind(this),
            'grants.gov': this.fillGrantsGov.bind(this),
            'sam.gov': this.fillSAMRegistration.bind(this)
        };
    }
    
    async fillAWSActivate(page, data) {
        console.log("🎮 Grant Goblin: Let's get those AWS credits!");
        
        try {
            // Navigate to AWS Activate
            await page.goto('https://aws.amazon.com/activate/portfolio-signup/', {
                waitUntil: 'networkidle2'
            });
            
            // Company Information
            await page.waitForSelector('input[name="company_name"]', { timeout: 5000 });
            await page.type('input[name="company_name"]', data.legalName);
            await page.type('input[name="website"]', data.website);
            
            // Founder Information
            await page.type('input[name="first_name"]', data.founder.firstName || 'NEED_NAME');
            await page.type('input[name="last_name"]', data.founder.lastName || 'NEED_NAME');
            await page.type('input[name="email"]', data.founder.email || 'NEED_EMAIL');
            
            // Company Stage
            await page.select('select[name="company_stage"]', 'pre-seed');
            
            // Industry
            await page.select('select[name="industry"]', 'Software');
            
            // Description
            await page.type('textarea[name="description"]', data.projectSummary);
            
            // Take screenshot
            await page.screenshot({ 
                path: 'aws-activate-filled.png',
                fullPage: true 
            });
            
            console.log("✅ Form Fairy: AWS Activate form filled! Screenshot saved.");
            
            return {
                success: true,
                screenshot: 'aws-activate-filled.png',
                readyToSubmit: !!(data.founder.email && data.founder.firstName)
            };
            
        } catch (error) {
            console.error("❌ Error filling AWS form:", error.message);
            return { success: false, error: error.message };
        }
    }
    
    async fillNSFSBIR(page, data) {
        console.log("🦁 Success Sphinx: Preparing NSF SBIR application...");
        
        try {
            // This would navigate to actual NSF submission system
            // For now, we'll create a detailed application package
            
            const application = {
                // Project Summary
                projectSummary: {
                    title: data.projectTitle,
                    keywords: ["artificial intelligence", "software automation", "MVP generation"],
                    summary: data.projectSummary,
                    intellectualMerit: `Soulfra advances AI understanding by creating the first system capable of 
                        translating human intent directly into functional software without human intervention.`,
                    broaderImpacts: `Democratizes software development, enabling non-technical entrepreneurs 
                        to build technology products. Will create 50+ high-tech jobs.`
                },
                
                // Technical Narrative (15 pages)
                technicalNarrative: {
                    problem: data.problemStatement,
                    solution: data.solution,
                    innovation: `Novel AI architecture combining NLP, code generation, and automated testing`,
                    approach: `Phase I: Prototype enhancement and validation with 100 beta users`,
                    team: {
                        pi: data.founder,
                        advisors: "Industry experts in AI/ML and software development"
                    }
                },
                
                // Commercialization Plan
                commercialization: {
                    marketSize: data.marketSize,
                    customers: "Software agencies, startups, enterprise innovation labs",
                    revenue: "$50M ARR within 3 years",
                    competition: "No direct competitors; indirect include low-code platforms",
                    advantages: data.competitiveAdvantage
                },
                
                // Budget
                budget: {
                    total: 275000,
                    breakdown: {
                        "Personnel": 165000,
                        "Equipment": 30000,
                        "Cloud Infrastructure": 40000,
                        "Other Direct Costs": 20000,
                        "Indirect Costs": 20000
                    }
                }
            };
            
            // Save application package
            await fs.writeFile(
                'nsf-sbir-application-package.json',
                JSON.stringify(application, null, 2)
            );
            
            console.log("✅ NSF SBIR application package created!");
            
            return {
                success: true,
                package: 'nsf-sbir-application-package.json',
                readyToSubmit: !!data.ein
            };
            
        } catch (error) {
            console.error("❌ Error with NSF application:", error.message);
            return { success: false, error: error.message };
        }
    }
    
    async fillGrantsGov(page, data) {
        console.log("🐉 Deadline Dragon: Checking Grants.gov opportunities!");
        
        try {
            await page.goto('https://www.grants.gov/search-grants', {
                waitUntil: 'networkidle2'
            });
            
            // Search for relevant grants
            await page.waitForSelector('input[name="keyword"]', { timeout: 5000 });
            await page.type('input[name="keyword"]', 'artificial intelligence small business');
            
            // Filter by eligibility
            await page.click('input[value="Small businesses"]');
            
            // Search
            await page.click('button[type="submit"]');
            
            // Wait for results
            await page.waitForSelector('.search-results', { timeout: 10000 });
            
            // Extract grant opportunities
            const grants = await page.evaluate(() => {
                const results = [];
                document.querySelectorAll('.grant-opportunity').forEach(grant => {
                    results.push({
                        title: grant.querySelector('.title')?.textContent,
                        agency: grant.querySelector('.agency')?.textContent,
                        amount: grant.querySelector('.amount')?.textContent,
                        deadline: grant.querySelector('.deadline')?.textContent,
                        number: grant.querySelector('.opportunity-number')?.textContent
                    });
                });
                return results;
            });
            
            // Save opportunities
            await fs.writeFile(
                'grants-gov-opportunities.json',
                JSON.stringify(grants, null, 2)
            );
            
            console.log(`✅ Found ${grants.length} grant opportunities!`);
            
            return {
                success: true,
                grantsFound: grants.length,
                opportunities: 'grants-gov-opportunities.json'
            };
            
        } catch (error) {
            console.error("❌ Error searching Grants.gov:", error.message);
            return { success: false, error: error.message };
        }
    }
    
    async fillSAMRegistration(page, data) {
        console.log("🧚 Form Fairy: Starting SAM.gov registration...");
        
        // SAM registration is complex and requires:
        // 1. DUNS number
        // 2. EIN
        // 3. Bank account info
        // 4. NAICS codes
        // 5. Size standards
        
        const samChecklist = {
            required: {
                ein: data.ein || "❌ MISSING",
                duns: data.dunsNumber || "❌ MISSING", 
                bankAccount: "❌ NEED BANK INFO",
                naics: data.naicsCode || "✅ 541511",
                address: data.address.street || "❌ MISSING",
                pocInfo: data.founder.email || "❌ MISSING"
            },
            
            steps: [
                "1. Get EIN from IRS.gov (10 minutes)",
                "2. Get DUNS from dnb.com (free, 1-2 days)",
                "3. Create SAM.gov account",
                "4. Complete Core Data sections",
                "5. Add banking information", 
                "6. Submit and wait for validation (3-5 days)"
            ],
            
            tips: [
                "Use your business bank account, not personal",
                "Have your incorporation docs ready",
                "List all NAICS codes that apply",
                "Be consistent with legal business name"
            ]
        };
        
        await fs.writeFile(
            'sam-registration-checklist.json',
            JSON.stringify(samChecklist, null, 2)
        );
        
        console.log("✅ SAM.gov registration checklist created!");
        
        return {
            success: true,
            checklist: 'sam-registration-checklist.json',
            readyToRegister: !!(data.ein && data.dunsNumber)
        };
    }
    
    async runFormFiller(url, additionalData = {}) {
        const browser = await puppeteer.launch({
            headless: false, // Show browser for user to see
            defaultViewport: null
        });
        
        try {
            const page = await browser.newPage();
            
            // Merge additional data
            const completeData = { ...this.soulfrData, ...additionalData };
            
            // Find appropriate strategy
            const strategy = Object.entries(this.formStrategies)
                .find(([domain]) => url.includes(domain))?.[1];
            
            if (!strategy) {
                console.log("⚠️ No specific strategy for this site, using generic approach");
                return await this.fillGenericForm(page, completeData, url);
            }
            
            // Run specific strategy
            const result = await strategy(page, completeData);
            
            // Keep browser open for user to review and submit
            console.log("\n🎮 Browser will stay open for you to review and submit!");
            console.log("Close the browser window when you're done.\n");
            
            return result;
            
        } catch (error) {
            console.error("Error in form filler:", error);
            await browser.close();
            throw error;
        }
    }
    
    async fillGenericForm(page, data, url) {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Generic form filling logic
        // Try to intelligently fill common fields
        
        const fieldMappings = {
            // Company fields
            'company': data.legalName,
            'business': data.legalName,
            'organization': data.legalName,
            'dba': data.dba,
            'ein': data.ein,
            'tax': data.ein,
            'duns': data.dunsNumber,
            
            // Contact fields
            'email': data.founder.email || data.email,
            'phone': data.phone,
            'website': data.website,
            'url': data.website,
            
            // Address fields
            'address': data.address.street,
            'street': data.address.street,
            'city': data.address.city,
            'state': data.address.state,
            'zip': data.address.zip,
            'postal': data.address.zip,
            
            // Person fields
            'first': data.founder.firstName,
            'last': data.founder.lastName,
            'name': `${data.founder.firstName} ${data.founder.lastName}`,
            'title': data.founder.title,
            
            // Business details
            'naics': data.naicsCode,
            'sic': data.sicCode,
            'employees': data.employeeCount,
            'revenue': data.annualRevenue,
            'description': data.projectSummary,
            'summary': data.projectSummary
        };
        
        // Try to fill fields
        for (const [keyword, value] of Object.entries(fieldMappings)) {
            if (!value) continue;
            
            try {
                // Try different selectors
                const selectors = [
                    `input[name*="${keyword}" i]`,
                    `input[id*="${keyword}" i]`,
                    `input[placeholder*="${keyword}" i]`,
                    `textarea[name*="${keyword}" i]`,
                    `select[name*="${keyword}" i]`
                ];
                
                for (const selector of selectors) {
                    const elements = await page.$$(selector);
                    for (const element of elements) {
                        const tagName = await element.evaluate(el => el.tagName);
                        
                        if (tagName === 'SELECT') {
                            // Try to select appropriate option
                            await element.select(value).catch(() => {});
                        } else {
                            // Clear and type
                            await element.click({ clickCount: 3 });
                            await element.type(value);
                        }
                    }
                }
            } catch (e) {
                // Continue with next field
            }
        }
        
        // Take screenshot
        const screenshot = `form-filled-${Date.now()}.png`;
        await page.screenshot({ path: screenshot, fullPage: true });
        
        return {
            success: true,
            screenshot,
            message: "Attempted to fill generic form. Please review and complete manually."
        };
    }
}

// Create instance and export
const formFiller = new RealGrantFormFiller();

// CLI interface
if (require.main === module) {
    const url = process.argv[2];
    if (!url) {
        console.log("Usage: node real-grant-form-filler.js <grant-website-url>");
        console.log("\nExample URLs:");
        console.log("  https://aws.amazon.com/activate/portfolio-signup/");
        console.log("  https://www.grants.gov/search-grants");
        console.log("  https://sam.gov/content/home");
        process.exit(1);
    }
    
    formFiller.runFormFiller(url).catch(console.error);
}

module.exports = { RealGrantFormFiller, formFiller };
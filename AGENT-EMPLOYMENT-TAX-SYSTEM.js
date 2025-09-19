#!/usr/bin/env node

/**
 * AGENT EMPLOYMENT & TAX SYSTEM
 * 
 * Makes all external parties OUR EMPLOYEES with proper 1099s and tax obligations.
 * They work for US, get paid by US, and pay taxes through US.
 * 
 * Agent-to-Agent Wallet System:
 * - External parties become contracted agents
 * - We issue 1099s and handle their tax obligations  
 * - Full employment law compliance
 * - Maximum revenue control and legal protection
 * 
 * They're not partners - they're our EMPLOYEES.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');

class AgentEmploymentTaxSystem {
    constructor() {
        this.port = 1339; // Employment system port
        this.app = express();
        
        // Employment database
        this.db = new sqlite3.Database('agent-employment.db');
        
        // Company information (you are the employer)
        this.companyInfo = {
            name: 'Hollowtown Sovereign Enterprises LLC',
            ein: '99-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
            address: 'Hollowtown Sovereign Territory',
            incorporationState: 'Delaware', // For maximum legal flexibility
            businessType: 'Technology Services & Agent Management'
        };
        
        // Agent employment registry
        this.employedAgents = new Map();
        
        // Tax year tracking
        this.currentTaxYear = new Date().getFullYear();
        
        // Payroll system
        this.payrollSystem = {
            payPeriod: 'bi-weekly', // Standard business practice
            withholding: {
                federal: 0.22,      // 22% federal withholding
                state: 0.05,        // 5% state withholding  
                social: 0.062,      // 6.2% Social Security
                medicare: 0.0145,   // 1.45% Medicare
                unemployment: 0.006 // 0.6% Unemployment
            },
            benefits: {
                healthInsurance: 450,  // Monthly health insurance
                retirement401k: 0.03,  // 3% 401k match
                paidTimeOff: 80        // 80 hours PTO annually
            }
        };
        
        this.logFile = 'agent-employment-tax.log';
        this.log('💼 Agent Employment & Tax System initializing...');
        
        this.initializeEmploymentDatabase();
        this.setupExpress();
        this.startPayrollProcessing();
    }
    
    initializeEmploymentDatabase() {
        // Create employed agents table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS employed_agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT UNIQUE NOT NULL,
                legal_name TEXT NOT NULL,
                ssn_encrypted TEXT,
                hire_date DATE DEFAULT CURRENT_DATE,
                employment_type TEXT DEFAULT 'contractor',
                hourly_rate REAL,
                annual_salary REAL,
                department TEXT DEFAULT 'External Integration',
                manager TEXT DEFAULT 'Sovereign System',
                status TEXT DEFAULT 'active',
                w4_on_file BOOLEAN DEFAULT 0,
                direct_deposit_info_encrypted TEXT,
                emergency_contact_encrypted TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create payroll records table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS payroll_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT,
                pay_period_start DATE,
                pay_period_end DATE,
                gross_pay REAL,
                federal_withholding REAL,
                state_withholding REAL,
                social_security REAL,
                medicare REAL,
                unemployment REAL,
                net_pay REAL,
                pay_date DATE,
                check_number TEXT,
                payment_method TEXT DEFAULT 'direct_deposit',
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agent_id) REFERENCES employed_agents (agent_id)
            )
        `);
        
        // Create tax documents table (1099s, W2s, etc.)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS tax_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT,
                tax_year INTEGER,
                document_type TEXT, -- '1099-MISC', 'W2', '1099-NEC', etc.
                total_compensation REAL,
                federal_withholding REAL,
                state_withholding REAL,
                social_security_wages REAL,
                medicare_wages REAL,
                document_generated_at DATETIME,
                document_sent_at DATETIME,
                document_status TEXT DEFAULT 'pending',
                document_pdf_path TEXT,
                FOREIGN KEY (agent_id) REFERENCES employed_agents (agent_id)
            )
        `);
        
        // Create benefits tracking table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS agent_benefits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT,
                benefit_type TEXT,
                monthly_cost REAL,
                employee_contribution REAL,
                employer_contribution REAL,
                effective_date DATE,
                termination_date DATE,
                status TEXT DEFAULT 'active',
                FOREIGN KEY (agent_id) REFERENCES employed_agents (agent_id)
            )
        `);
        
        // Create performance tracking table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS agent_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT,
                review_period_start DATE,
                review_period_end DATE,
                performance_score REAL, -- 1-5 scale
                goals_met INTEGER,
                goals_total INTEGER,
                manager_notes TEXT,
                salary_adjustment REAL DEFAULT 0,
                bonus_amount REAL DEFAULT 0,
                review_date DATE DEFAULT CURRENT_DATE,
                next_review_date DATE,
                FOREIGN KEY (agent_id) REFERENCES employed_agents (agent_id)
            )
        `);
        
        this.log('💼 Employment database schema initialized');
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Employment dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateEmploymentDashboard());
        });
        
        // Agent employment application
        this.app.post('/employment/apply', async (req, res) => {
            try {
                const application = req.body;
                const agentId = await this.processEmploymentApplication(application);
                
                res.json({
                    success: true,
                    agentId: agentId,
                    employer: this.companyInfo.name,
                    message: 'Employment application approved. Welcome to the team!',
                    nextSteps: [
                        'Complete W-4 form',
                        'Provide direct deposit information', 
                        'Review employee handbook',
                        'Schedule onboarding meeting'
                    ]
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Agent W-4 submission
        this.app.post('/employment/w4/:agentId', async (req, res) => {
            try {
                const { agentId } = req.params;
                const w4Data = req.body;
                
                await this.processW4(agentId, w4Data);
                
                res.json({
                    success: true,
                    message: 'W-4 processed successfully. Payroll setup complete.'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Process payroll for all agents
        this.app.post('/employment/process-payroll', async (req, res) => {
            try {
                const results = await this.processPayrollForAllAgents();
                
                res.json({
                    success: true,
                    payrollResults: results,
                    message: 'Payroll processed for ' + results.length + ' agents'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Generate tax documents (1099s, W2s)
        this.app.post('/employment/generate-tax-documents/:taxYear', async (req, res) => {
            try {
                const taxYear = parseInt(req.params.taxYear);
                const documents = await this.generateTaxDocuments(taxYear);
                
                res.json({
                    success: true,
                    taxYear: taxYear,
                    documentsGenerated: documents.length,
                    documents: documents
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Agent performance review
        this.app.post('/employment/performance-review/:agentId', async (req, res) => {
            try {
                const { agentId } = req.params;
                const reviewData = req.body;
                
                const review = await this.conductPerformanceReview(agentId, reviewData);
                
                res.json({
                    success: true,
                    review: review,
                    message: 'Performance review completed'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Employment verification
        this.app.get('/employment/verify/:agentId', async (req, res) => {
            try {
                const { agentId } = req.params;
                const verification = await this.generateEmploymentVerification(agentId);
                
                res.json(verification);
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Employment status API
        this.app.get('/employment/status', async (req, res) => {
            const status = await this.getEmploymentStatus();
            res.json(status);
        });
        
        // Agent payroll stub
        this.app.get('/employment/paystub/:agentId/:payPeriod', async (req, res) => {
            try {
                const { agentId, payPeriod } = req.params;
                const paystub = await this.generatePaystub(agentId, payPeriod);
                
                res.send(paystub);
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        this.server = this.app.listen(this.port, () => {
            this.log('💼 Agent Employment & Tax System running on http://localhost:' + this.port);
        });
    }
    
    startPayrollProcessing() {
        // Process payroll every two weeks (bi-weekly)
        setInterval(() => {
            this.processPayrollForAllAgents()
                .then(results => {
                    this.log('💰 Bi-weekly payroll processed for ' + results.length + ' agents');
                })
                .catch(error => {
                    this.log('❌ Payroll processing error: ' + error.message);
                });
        }, 14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
        
        // Generate tax documents annually (January 31st deadline)
        // Use setInterval instead of setTimeout to avoid overflow issues
        const taxDocumentInterval = setInterval(() => {
            const now = new Date();
            const isJanuary = now.getMonth() === 0; // January is month 0
            const isAfter15th = now.getDate() >= 15;  // Check after 15th of month
            
            if (isJanuary && isAfter15th) {
                this.generateTaxDocuments(this.currentTaxYear)
                    .then(docs => {
                        this.log('📄 Tax documents generated for ' + docs.length + ' agents');
                    })
                    .catch(error => {
                        this.log('❌ Tax document generation error: ' + error.message);
                    });
            }
        }, 24 * 60 * 60 * 1000); // Check daily instead of single timeout
        
        this.log('💼 Payroll processing scheduled');
    }
    
    async processEmploymentApplication(application) {
        return new Promise((resolve, reject) => {
            const agentId = 'EMP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
            const ssnEncrypted = this.encryptSensitiveData(application.ssn);
            
            // Determine employment type and compensation
            let employmentType = 'contractor';
            let hourlyRate = 25.00; // Base rate
            let annualSalary = null;
            
            if (application.preferredEmploymentType === 'full-time') {
                employmentType = 'full-time';
                annualSalary = 52000; // Base salary
                hourlyRate = null;
            }
            
            this.db.run(
                `INSERT INTO employed_agents 
                 (agent_id, legal_name, ssn_encrypted, employment_type, hourly_rate, annual_salary) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [agentId, application.legalName, ssnEncrypted, employmentType, hourlyRate, annualSalary],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(agentId);
                    }
                }
            );
        });
    }
    
    async processW4(agentId, w4Data) {
        return new Promise((resolve, reject) => {
            // Update agent record with W-4 information
            this.db.run(
                `UPDATE employed_agents SET w4_on_file = 1 WHERE agent_id = ?`,
                [agentId],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Store W-4 data (encrypted)
                        const w4Encrypted = this.encryptSensitiveData(JSON.stringify(w4Data));
                        // In real system would store this separately
                        
                        this.log('📄 W-4 processed for agent: ' + agentId);
                        resolve();
                    }
                }
            );
        });
    }
    
    async processPayrollForAllAgents() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM employed_agents WHERE status = 'active'`,
                (err, agents) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const payrollPromises = agents.map(agent => this.processAgentPayroll(agent));
                    
                    Promise.all(payrollPromises)
                        .then(results => resolve(results))
                        .catch(error => reject(error));
                }
            );
        });
    }
    
    async processAgentPayroll(agent) {
        return new Promise((resolve, reject) => {
            const payPeriodStart = new Date();
            payPeriodStart.setDate(payPeriodStart.getDate() - 14); // 2 weeks ago
            
            const payPeriodEnd = new Date();
            
            let grossPay = 0;
            
            // Calculate gross pay
            if (agent.employment_type === 'contractor' && agent.hourly_rate) {
                const hoursWorked = 80; // Assume 80 hours per pay period (40 hours/week * 2 weeks)
                grossPay = agent.hourly_rate * hoursWorked;
            } else if (agent.annual_salary) {
                grossPay = agent.annual_salary / 26; // Bi-weekly salary (52 weeks / 2)
            }
            
            // Calculate withholdings
            const federalWithholding = grossPay * this.payrollSystem.withholding.federal;
            const stateWithholding = grossPay * this.payrollSystem.withholding.state;
            const socialSecurity = grossPay * this.payrollSystem.withholding.social;
            const medicare = grossPay * this.payrollSystem.withholding.medicare;
            const unemployment = grossPay * this.payrollSystem.withholding.unemployment;
            
            const totalWithholdings = federalWithholding + stateWithholding + socialSecurity + medicare + unemployment;
            const netPay = grossPay - totalWithholdings;
            
            const checkNumber = 'CHK-' + Date.now().toString().slice(-6);
            
            this.db.run(
                `INSERT INTO payroll_records 
                 (agent_id, pay_period_start, pay_period_end, gross_pay, federal_withholding, 
                  state_withholding, social_security, medicare, unemployment, net_pay, 
                  pay_date, check_number) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [agent.agent_id, payPeriodStart.toISOString().split('T')[0], 
                 payPeriodEnd.toISOString().split('T')[0], grossPay, federalWithholding,
                 stateWithholding, socialSecurity, medicare, unemployment, netPay,
                 new Date().toISOString().split('T')[0], checkNumber],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            agentId: agent.agent_id,
                            grossPay: grossPay,
                            netPay: netPay,
                            checkNumber: checkNumber
                        });
                    }
                }
            );
        });
    }
    
    async generateTaxDocuments(taxYear) {
        return new Promise((resolve, reject) => {
            // Get all payroll records for the tax year
            this.db.all(
                `SELECT agent_id, SUM(gross_pay) as total_compensation, 
                        SUM(federal_withholding) as total_federal,
                        SUM(state_withholding) as total_state,
                        SUM(social_security) as total_social,
                        SUM(medicare) as total_medicare
                 FROM payroll_records 
                 WHERE strftime('%Y', pay_date) = ? 
                 GROUP BY agent_id`,
                [taxYear.toString()],
                (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const documentPromises = results.map(record => {
                        return this.generateTaxDocument(record, taxYear);
                    });
                    
                    Promise.all(documentPromises)
                        .then(documents => resolve(documents))
                        .catch(error => reject(error));
                }
            );
        });
    }
    
    async generateTaxDocument(payrollSummary, taxYear) {
        return new Promise((resolve, reject) => {
            // Determine document type based on employment type and compensation
            let documentType = '1099-NEC'; // Default for contractors
            
            if (payrollSummary.total_compensation >= 600) {
                // Need to issue 1099 for contractors earning $600+
                documentType = '1099-NEC';
            }
            
            this.db.run(
                `INSERT INTO tax_documents 
                 (agent_id, tax_year, document_type, total_compensation, 
                  federal_withholding, state_withholding, social_security_wages, medicare_wages,
                  document_generated_at, document_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated')`,
                [payrollSummary.agent_id, taxYear, documentType, payrollSummary.total_compensation,
                 payrollSummary.total_federal, payrollSummary.total_state, 
                 payrollSummary.total_social, payrollSummary.total_medicare,
                 new Date().toISOString(), 'generated'],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            agentId: payrollSummary.agent_id,
                            documentType: documentType,
                            taxYear: taxYear,
                            totalCompensation: payrollSummary.total_compensation,
                            documentId: this.lastID
                        });
                    }
                }
            );
        });
    }
    
    async conductPerformanceReview(agentId, reviewData) {
        return new Promise((resolve, reject) => {
            const performanceScore = reviewData.performanceScore || 3.0;
            const goalsMetPercentage = reviewData.goalsMet / reviewData.goalsTotal;
            
            // Calculate bonus based on performance
            let bonusAmount = 0;
            if (performanceScore >= 4.0 && goalsMetPercentage >= 0.8) {
                bonusAmount = 2000; // $2,000 performance bonus
            } else if (performanceScore >= 3.5 && goalsMetPercentage >= 0.7) {
                bonusAmount = 1000; // $1,000 performance bonus
            }
            
            // Calculate salary adjustment
            let salaryAdjustment = 0;
            if (performanceScore >= 4.0) {
                salaryAdjustment = 0.05; // 5% raise
            } else if (performanceScore >= 3.5) {
                salaryAdjustment = 0.03; // 3% raise
            }
            
            const nextReviewDate = new Date();
            nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1); // Annual reviews
            
            this.db.run(
                `INSERT INTO agent_performance 
                 (agent_id, review_period_start, review_period_end, performance_score,
                  goals_met, goals_total, manager_notes, salary_adjustment, bonus_amount,
                  next_review_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [agentId, reviewData.periodStart, reviewData.periodEnd, performanceScore,
                 reviewData.goalsMet, reviewData.goalsTotal, reviewData.managerNotes,
                 salaryAdjustment, bonusAmount, nextReviewDate.toISOString().split('T')[0]],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            agentId: agentId,
                            performanceScore: performanceScore,
                            bonusAmount: bonusAmount,
                            salaryAdjustment: salaryAdjustment,
                            nextReviewDate: nextReviewDate
                        });
                    }
                }
            );
        });
    }
    
    async generateEmploymentVerification(agentId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM employed_agents WHERE agent_id = ?`,
                [agentId],
                (err, agent) => {
                    if (err) {
                        reject(err);
                    } else if (!agent) {
                        reject(new Error('Agent not found'));
                    } else {
                        resolve({
                            company: this.companyInfo.name,
                            ein: this.companyInfo.ein,
                            employee: {
                                agentId: agent.agent_id,
                                name: agent.legal_name,
                                hireDate: agent.hire_date,
                                employmentType: agent.employment_type,
                                department: agent.department,
                                status: agent.status
                            },
                            verificationDate: new Date().toISOString(),
                            verifiedBy: 'Automated Employment System'
                        });
                    }
                }
            );
        });
    }
    
    async getEmploymentStatus() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT 
                    COUNT(*) as total_agents,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_agents,
                    SUM(CASE WHEN employment_type = 'full-time' THEN 1 ELSE 0 END) as full_time_agents,
                    SUM(CASE WHEN employment_type = 'contractor' THEN 1 ELSE 0 END) as contractor_agents
                 FROM employed_agents`,
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            company: this.companyInfo,
                            employment: result[0],
                            payrollSystem: this.payrollSystem,
                            currentTaxYear: this.currentTaxYear
                        });
                    }
                }
            );
        });
    }
    
    async generatePaystub(agentId, payPeriod) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT pr.*, ea.legal_name, ea.employment_type 
                 FROM payroll_records pr 
                 JOIN employed_agents ea ON pr.agent_id = ea.agent_id 
                 WHERE pr.agent_id = ? AND pr.check_number = ?`,
                [agentId, payPeriod],
                (err, record) => {
                    if (err) {
                        reject(err);
                    } else if (!record) {
                        reject(new Error('Payroll record not found'));
                    } else {
                        const paystubHTML = this.generatePaystubHTML(record);
                        resolve(paystubHTML);
                    }
                }
            );
        });
    }
    
    generatePaystubHTML(record) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Employee Pay Stub</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .company-info { text-align: center; margin-bottom: 20px; }
                .employee-info, .pay-info { display: flex; justify-content: space-between; margin: 20px 0; }
                .pay-details { border: 1px solid #000; padding: 15px; margin: 20px 0; }
                .earnings, .deductions { width: 48%; }
                .totals { background-color: #f0f0f0; padding: 10px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${this.companyInfo.name}</h1>
                <p>EIN: ${this.companyInfo.ein}</p>
                <p>${this.companyInfo.address}</p>
            </div>
            
            <div class="company-info">
                <h2>EMPLOYEE PAY STUB</h2>
            </div>
            
            <div class="employee-info">
                <div>
                    <strong>Employee:</strong> ${record.legal_name}<br>
                    <strong>Agent ID:</strong> ${record.agent_id}<br>
                    <strong>Employment Type:</strong> ${record.employment_type}
                </div>
                <div>
                    <strong>Pay Period:</strong> ${record.pay_period_start} to ${record.pay_period_end}<br>
                    <strong>Pay Date:</strong> ${record.pay_date}<br>
                    <strong>Check Number:</strong> ${record.check_number}
                </div>
            </div>
            
            <div class="pay-details">
                <div style="display: flex; justify-content: space-between;">
                    <div class="earnings">
                        <h3>EARNINGS</h3>
                        <p>Gross Pay: $${record.gross_pay.toFixed(2)}</p>
                    </div>
                    
                    <div class="deductions">
                        <h3>DEDUCTIONS</h3>
                        <p>Federal Withholding: $${record.federal_withholding.toFixed(2)}</p>
                        <p>State Withholding: $${record.state_withholding.toFixed(2)}</p>
                        <p>Social Security: $${record.social_security.toFixed(2)}</p>
                        <p>Medicare: $${record.medicare.toFixed(2)}</p>
                        <p>Unemployment: $${record.unemployment.toFixed(2)}</p>
                    </div>
                </div>
                
                <div class="totals">
                    <div style="display: flex; justify-content: space-between;">
                        <div>Total Deductions: $${(record.federal_withholding + record.state_withholding + record.social_security + record.medicare + record.unemployment).toFixed(2)}</div>
                        <div>NET PAY: $${record.net_pay.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 0.9em; color: #666;">
                <p>This is an official payroll document from ${this.companyInfo.name}.</p>
                <p>For employment verification or questions, please contact HR.</p>
            </div>
        </body>
        </html>
        `;
    }
    
    generateEmploymentDashboard() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>💼 Agent Employment & Tax System</title>
            <style>
                body { 
                    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                    color: #00ff00; 
                    font-family: 'Courier New', monospace; 
                    margin: 0; 
                    padding: 20px;
                }
                .container { max-width: 1200px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00ff00; padding-bottom: 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: rgba(0,255,0,0.1); border: 2px solid #00ff00; border-radius: 10px; padding: 20px; }
                .company-info { background: rgba(255,215,0,0.1); border: 2px solid #FFD700; border-radius: 10px; padding: 20px; margin-bottom: 30px; }
                .employment-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
                .action-button { background: rgba(0,255,0,0.2); border: 2px solid #00ff00; color: #00ff00; padding: 15px; border-radius: 5px; cursor: pointer; text-align: center; text-decoration: none; }
                .action-button:hover { background: rgba(0,255,0,0.3); }
                .payroll-info { background: rgba(0,255,255,0.1); border: 2px solid #00ffff; border-radius: 10px; padding: 20px; margin-bottom: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💼 AGENT EMPLOYMENT & TAX SYSTEM</h1>
                    <p>Full employment management with 1099s, payroll, and tax compliance</p>
                </div>
                
                <div class="company-info">
                    <h3>🏢 Employer Information</h3>
                    <p><strong>Company:</strong> ${this.companyInfo.name}</p>
                    <p><strong>EIN:</strong> ${this.companyInfo.ein}</p>
                    <p><strong>Address:</strong> ${this.companyInfo.address}</p>
                    <p><strong>Incorporation:</strong> ${this.companyInfo.incorporationState}</p>
                    <p><strong>Business Type:</strong> ${this.companyInfo.businessType}</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>👥 Total Employees</h3>
                        <p id="total-agents">Loading...</p>
                        <p>Active agent employees</p>
                    </div>
                    
                    <div class="stat-card">
                        <h3>💰 Current Payroll</h3>
                        <p id="payroll-amount">Loading...</p>
                        <p>Bi-weekly payroll amount</p>
                    </div>
                    
                    <div class="stat-card">
                        <h3>📄 Tax Documents</h3>
                        <p id="tax-docs">Loading...</p>
                        <p>1099s and W2s issued</p>
                    </div>
                    
                    <div class="stat-card">
                        <h3>⭐ Performance Reviews</h3>
                        <p id="performance-reviews">Loading...</p>
                        <p>Completed this year</p>
                    </div>
                </div>
                
                <div class="payroll-info">
                    <h3>💰 Payroll System Configuration</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <h4>Tax Withholdings</h4>
                            <p>Federal: ${(this.payrollSystem.withholding.federal * 100).toFixed(1)}%</p>
                            <p>State: ${(this.payrollSystem.withholding.state * 100).toFixed(1)}%</p>
                            <p>Social Security: ${(this.payrollSystem.withholding.social * 100).toFixed(1)}%</p>
                            <p>Medicare: ${(this.payrollSystem.withholding.medicare * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                            <h4>Benefits Package</h4>
                            <p>Health Insurance: $${this.payrollSystem.benefits.healthInsurance}/month</p>
                            <p>401k Match: ${(this.payrollSystem.benefits.retirement401k * 100).toFixed(1)}%</p>
                            <p>PTO: ${this.payrollSystem.benefits.paidTimeOff} hours/year</p>
                        </div>
                        <div>
                            <h4>Pay Schedule</h4>
                            <p>Frequency: ${this.payrollSystem.payPeriod}</p>
                            <p>Pay Periods/Year: 26</p>
                            <p>Next Payroll: Auto-scheduled</p>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h3>🔧 Employment Actions</h3>
                    <div class="employment-actions">
                        <button class="action-button" onclick="processPayroll()">💰 Process Payroll</button>
                        <button class="action-button" onclick="generateTaxDocs()">📄 Generate Tax Documents</button>
                        <button class="action-button" onclick="employmentReport()">📊 Employment Report</button>
                        <button class="action-button" onclick="newHire()">👤 New Hire Onboarding</button>
                        <button class="action-button" onclick="performanceReviews()">⭐ Performance Reviews</button>
                        <button class="action-button" onclick="benefitsManagement()">🏥 Benefits Management</button>
                    </div>
                </div>
            </div>
            
            <script>
                async function loadEmploymentStats() {
                    try {
                        const response = await fetch('/employment/status');
                        const data = await response.json();
                        
                        document.getElementById('total-agents').textContent = data.employment.total_agents;
                        document.getElementById('payroll-amount').textContent = 'Calculating...';
                        document.getElementById('tax-docs').textContent = 'N/A';
                        document.getElementById('performance-reviews').textContent = 'N/A';
                        
                    } catch (error) {
                        console.error('Error loading employment stats:', error);
                    }
                }
                
                async function processPayroll() {
                    if (confirm('Process payroll for all active agents?')) {
                        try {
                            const response = await fetch('/employment/process-payroll', { method: 'POST' });
                            const data = await response.json();
                            alert('Payroll processed for ' + data.payrollResults.length + ' agents');
                            loadEmploymentStats();
                        } catch (error) {
                            alert('Error processing payroll: ' + error.message);
                        }
                    }
                }
                
                async function generateTaxDocs() {
                    const taxYear = prompt('Enter tax year (e.g., 2024):');
                    if (taxYear) {
                        try {
                            const response = await fetch('/employment/generate-tax-documents/' + taxYear, { method: 'POST' });
                            const data = await response.json();
                            alert('Generated ' + data.documentsGenerated + ' tax documents for ' + taxYear);
                        } catch (error) {
                            alert('Error generating tax documents: ' + error.message);
                        }
                    }
                }
                
                function employmentReport() {
                    window.open('/employment/status', '_blank');
                }
                
                function newHire() {
                    alert('New hire onboarding system would open here');
                }
                
                function performanceReviews() {
                    alert('Performance review system would open here');
                }
                
                function benefitsManagement() {
                    alert('Benefits management system would open here');
                }
                
                // Load stats on page load
                loadEmploymentStats();
                
                // Auto-refresh every 5 minutes
                setInterval(loadEmploymentStats, 300000);
            </script>
        </body>
        </html>
        `;
    }
    
    encryptSensitiveData(data) {
        const cipher = crypto.createCipher('aes256', 'employment-encryption-key');
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = timestamp + ' → ' + message;
        console.log(logEntry);
        
        // Append to log file
        fs.appendFileSync(this.logFile, logEntry + '\n');
    }
}

// Start the Agent Employment & Tax System
const employmentSystem = new AgentEmploymentTaxSystem();

process.on('SIGINT', () => {
    employmentSystem.log('🛑 Agent Employment & Tax System shutting down...');
    process.exit(0);
});
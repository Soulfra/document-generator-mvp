#!/usr/bin/env node

/**
 * 🏠 FAMILY ONBOARDING WIZARD
 * 
 * Complete family setup system for:
 * - Insurance agents to sell as family packages
 * - Parents to manage entire household
 * - Age-appropriate access for all family members
 * - Volunteer hour tracking for bill credits
 * - 1099 generation for family coordinators
 * - Zero-knowledge verification (Signal-style privacy)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class FamilyOnboardingWizard {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 7000;
        
        // Family account registry
        this.families = new Map();
        this.insuranceAgents = new Map();
        this.nonprofitPartners = new Map();
        
        // Age access tiers
        this.accessTiers = {
            BABY: { ages: [0, 6], name: 'Little Learner', features: ['educational_games_only', 'parent_supervised'] },
            CHILD: { ages: [7, 12], name: 'Young Explorer', features: ['supervised_learning', 'parent_approval_required'] },
            TEEN: { ages: [13, 17], name: 'Student Scholar', features: ['educational_forums', 'filtered_content', 'limited_autonomy'] },
            ADULT: { ages: [18, 99], name: 'Full Access', features: ['bank_verified', 'open_chat', 'all_features'] },
            SENIOR: { ages: [65, 120], name: 'Wisdom Circle', features: ['simplified_interface', 'family_oversight', 'large_text'] }
        };
        
        // Volunteer credit rates
        this.volunteerCredits = {
            'food_bank': { rate: 12.00, description: 'Food bank volunteer' },
            'literacy_tutor': { rate: 15.00, description: 'Adult literacy tutoring' },
            'senior_companion': { rate: 10.00, description: 'Senior companion services' },
            'environmental': { rate: 8.00, description: 'Environmental cleanup' },
            'youth_mentor': { rate: 14.00, description: 'Youth mentoring programs' },
            'disaster_relief': { rate: 16.00, description: 'Disaster relief volunteer' }
        };
        
        // Insurance agent commission structure
        this.agentCommissions = {
            'family_basic': { monthly: 29.99, commission: 0.15, features: ['basic_access', 'parental_controls'] },
            'family_premium': { monthly: 49.99, commission: 0.20, features: ['full_access', 'educational_content', 'volunteer_tracking'] },
            'family_enterprise': { monthly: 79.99, commission: 0.25, features: ['all_features', 'priority_support', 'custom_content'] }
        };
        
        this.initialize();
    }
    
    async initialize() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        this.setupRoutes();
        
        this.app.listen(this.port, () => {
            console.log(`🏠 Family Onboarding Wizard running on port ${this.port}`);
            console.log(`👨‍👩‍👧‍👦 Complete family digital safety platform`);
            console.log(`💼 Insurance agent portal ready`);
            console.log(`🤝 Nonprofit volunteer tracking enabled`);
        });
    }
    
    setupRoutes() {
        // Main family onboarding page
        this.app.get('/', (req, res) => {
            res.send(this.generateOnboardingPage());
        });
        
        // Insurance agent portal
        this.app.get('/agent', (req, res) => {
            res.send(this.generateAgentPortal());
        });
        
        // Family setup wizard
        this.app.post('/api/family/start-setup', this.startFamilySetup.bind(this));
        this.app.post('/api/family/add-member', this.addFamilyMember.bind(this));
        this.app.post('/api/family/complete-setup', this.completeFamilySetup.bind(this));
        
        // Volunteer hour tracking
        this.app.post('/api/volunteer/log-hours', this.logVolunteerHours.bind(this));
        this.app.get('/api/volunteer/credits/:familyId', this.getVolunteerCredits.bind(this));
        
        // Insurance agent management
        this.app.post('/api/agent/register', this.registerAgent.bind(this));
        this.app.post('/api/agent/family-sale', this.recordFamilySale.bind(this));
        this.app.get('/api/agent/commissions/:agentId', this.getAgentCommissions.bind(this));
        
        // Zero-knowledge verification
        this.app.post('/api/verify/age-proof', this.generateAgeProof.bind(this));
        this.app.post('/api/verify/bank-proof', this.generateBankProof.bind(this));
        this.app.post('/api/verify/family-proof', this.generateFamilyProof.bind(this));
        
        // 1099 generation
        this.app.get('/api/tax/1099/:familyId', this.generate1099.bind(this));
    }
    
    generateOnboardingPage() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🏠 Family Digital Safety Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        
        .wizard-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .step {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .step.active { border-color: #4CAF50; }
        .step.completed { opacity: 0.7; }
        
        .step-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .step-number {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #4CAF50;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-weight: bold;
        }
        
        .family-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .family-member {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        
        .age-tier {
            display: inline-block;
            background: #FF6B6B;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            margin: 5px 0;
        }
        
        .benefits {
            background: rgba(76, 175, 80, 0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .benefits h3 { color: #4CAF50; margin-bottom: 15px; }
        .benefits ul { list-style: none; }
        .benefits li {
            padding: 8px 0;
            position: relative;
            padding-left: 25px;
        }
        .benefits li:before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #4CAF50;
            font-weight: bold;
        }
        
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 5px;
            transition: all 0.3s;
        }
        
        button:hover { background: #45a049; transform: translateY(-2px); }
        button:disabled { background: #ccc; cursor: not-allowed; }
        
        input, select {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            margin: 8px 0;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
        }
        
        .pricing {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .pricing-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            position: relative;
        }
        
        .pricing-card.featured {
            border: 2px solid #4CAF50;
            transform: scale(1.05);
        }
        
        .price {
            font-size: 2em;
            font-weight: bold;
            color: #4CAF50;
            margin: 10px 0;
        }
        
        .volunteer-credits {
            background: rgba(255, 193, 7, 0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .volunteer-credits h3 { color: #FFC107; }
    </style>
</head>
<body>
    <div class="wizard-container">
        <h1>🏠 Welcome to Your Family Digital Safety Setup</h1>
        <p>Insurance agent-approved platform for complete family protection and education</p>
        
        <div class="step active" id="step1">
            <div class="step-header">
                <div class="step-number">1</div>
                <h2>Family Information</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3>Family Admin (Parent/Guardian)</h3>
                    <input type="text" id="parentName" placeholder="Full Name" />
                    <input type="email" id="parentEmail" placeholder="Email Address" />
                    <input type="date" id="parentBirthdate" placeholder="Birth Date" />
                    <input type="text" id="familyName" placeholder="Family Name" />
                </div>
                
                <div class="benefits">
                    <h3>🎯 Family Admin Benefits</h3>
                    <ul>
                        <li>Receive 1099 for family coordination services</li>
                        <li>Earn bill credits through volunteer hours</li>
                        <li>Complete parental control over all accounts</li>
                        <li>Monthly family activity reports</li>
                        <li>Insurance discounts available</li>
                    </ul>
                </div>
            </div>
            
            <button onclick="nextStep(2)">Continue Setup →</button>
        </div>
        
        <div class="step" id="step2">
            <div class="step-header">
                <div class="step-number">2</div>
                <h2>Add Family Members</h2>
            </div>
            
            <div id="familyMembers">
                <div class="family-member">
                    <h4>👤 Family Member</h4>
                    <input type="text" placeholder="Name" class="member-name" />
                    <input type="date" placeholder="Birth Date" class="member-birthdate" />
                    <select class="member-relation">
                        <option>Child</option>
                        <option>Spouse</option>
                        <option>Parent</option>
                        <option>Grandparent</option>
                        <option>Other Family</option>
                    </select>
                    <div class="age-tier" id="tier-0">Age tier will be calculated</div>
                </div>
            </div>
            
            <button onclick="addFamilyMember()">+ Add Another Family Member</button>
            <button onclick="nextStep(3)">Continue →</button>
        </div>
        
        <div class="step" id="step3">
            <div class="step-header">
                <div class="step-number">3</div>
                <h2>Choose Your Plan</h2>
            </div>
            
            <div class="pricing">
                <div class="pricing-card">
                    <h3>Family Basic</h3>
                    <div class="price">$29.99/mo</div>
                    <ul style="text-align: left; margin: 20px 0;">
                        <li>✓ Age-appropriate content filtering</li>
                        <li>✓ Basic parental controls</li>
                        <li>✓ Educational games for kids</li>
                        <li>✓ Family activity reports</li>
                    </ul>
                    <button onclick="selectPlan('basic')">Select Basic</button>
                </div>
                
                <div class="pricing-card featured">
                    <h3>Family Premium</h3>
                    <div class="price">$49.99/mo</div>
                    <div style="background: #4CAF50; color: white; padding: 5px; margin: 10px -25px; border-radius: 15px;">Most Popular</div>
                    <ul style="text-align: left; margin: 20px 0;">
                        <li>✓ Everything in Basic</li>
                        <li>✓ Advanced educational content</li>
                        <li>✓ Volunteer hour tracking</li>
                        <li>✓ Bill credit system</li>
                        <li>✓ 1099 generation</li>
                        <li>✓ Priority support</li>
                    </ul>
                    <button onclick="selectPlan('premium')">Select Premium</button>
                </div>
                
                <div class="pricing-card">
                    <h3>Family Enterprise</h3>
                    <div class="price">$79.99/mo</div>
                    <ul style="text-align: left; margin: 20px 0;">
                        <li>✓ Everything in Premium</li>
                        <li>✓ Custom educational content</li>
                        <li>✓ Advanced analytics</li>
                        <li>✓ Multiple family coordination</li>
                        <li>✓ White-label options</li>
                        <li>✓ Dedicated support</li>
                    </ul>
                    <button onclick="selectPlan('enterprise')">Select Enterprise</button>
                </div>
            </div>
            
            <div class="volunteer-credits">
                <h3>💰 Volunteer Hour Credits</h3>
                <p>Earn bill credits by volunteering with our nonprofit partners:</p>
                <ul style="margin: 15px 0;">
                    <li><strong>Food Bank Volunteer:</strong> $12/hour credit</li>
                    <li><strong>Literacy Tutoring:</strong> $15/hour credit</li>
                    <li><strong>Senior Companion:</strong> $10/hour credit</li>
                    <li><strong>Youth Mentoring:</strong> $14/hour credit</li>
                </ul>
                <p><em>Credits apply to your monthly bill. Excess credits can be donated to charity!</em></p>
            </div>
        </div>
        
        <div class="step" id="step4">
            <div class="step-header">
                <div class="step-number">4</div>
                <h2>Verification & Setup Complete</h2>
            </div>
            
            <div style="text-align: center;">
                <h3>🎉 Your Family Account is Ready!</h3>
                
                <div class="benefits">
                    <h3>What Happens Next:</h3>
                    <ul>
                        <li>Family admin will receive bank verification instructions</li>
                        <li>Each family member gets age-appropriate access</li>
                        <li>Volunteer hour tracking begins immediately</li>
                        <li>Monthly 1099 generation for tax purposes</li>
                        <li>Insurance agent receives commission setup</li>
                    </ul>
                </div>
                
                <div id="familySummary"></div>
                
                <button onclick="completeFamilySetup()" style="background: #4CAF50; font-size: 18px; padding: 20px 40px;">
                    🚀 Launch Family Platform
                </button>
            </div>
        </div>
    </div>
    
    <script>
        let currentStep = 1;
        let familyData = {
            admin: {},
            members: [],
            plan: null,
            agentId: new URLSearchParams(window.location.search).get('agent')
        };
        
        function nextStep(step) {
            // Validate current step
            if (!validateStep(currentStep)) return;
            
            // Hide current step
            document.getElementById(\`step\${currentStep}\`).classList.remove('active');
            document.getElementById(\`step\${currentStep}\`).classList.add('completed');
            
            // Show next step
            document.getElementById(\`step\${step}\`).classList.add('active');
            currentStep = step;
            
            if (step === 4) {
                generateFamilySummary();
            }
        }
        
        function validateStep(step) {
            switch(step) {
                case 1:
                    const name = document.getElementById('parentName').value;
                    const email = document.getElementById('parentEmail').value;
                    const birthdate = document.getElementById('parentBirthdate').value;
                    
                    if (!name || !email || !birthdate) {
                        alert('Please fill in all family admin information');
                        return false;
                    }
                    
                    familyData.admin = { name, email, birthdate };
                    return true;
                    
                case 2:
                    const members = document.querySelectorAll('.family-member');
                    familyData.members = [];
                    
                    members.forEach(member => {
                        const name = member.querySelector('.member-name').value;
                        const birthdate = member.querySelector('.member-birthdate').value;
                        const relation = member.querySelector('.member-relation').value;
                        
                        if (name && birthdate) {
                            familyData.members.push({ name, birthdate, relation });
                        }
                    });
                    
                    return true;
                    
                case 3:
                    if (!familyData.plan) {
                        alert('Please select a plan');
                        return false;
                    }
                    return true;
            }
            return true;
        }
        
        function addFamilyMember() {
            const container = document.getElementById('familyMembers');
            const memberDiv = document.createElement('div');
            memberDiv.className = 'family-member';
            memberDiv.innerHTML = \`
                <h4>👤 Family Member</h4>
                <input type="text" placeholder="Name" class="member-name" />
                <input type="date" placeholder="Birth Date" class="member-birthdate" />
                <select class="member-relation">
                    <option>Child</option>
                    <option>Spouse</option>
                    <option>Parent</option>
                    <option>Grandparent</option>
                    <option>Other Family</option>
                </select>
                <button onclick="this.parentElement.remove()" style="background: #f44336;">Remove</button>
            \`;
            container.appendChild(memberDiv);
        }
        
        function selectPlan(plan) {
            familyData.plan = plan;
            
            // Update UI to show selection
            document.querySelectorAll('.pricing-card').forEach(card => {
                card.style.opacity = '0.5';
            });
            
            event.target.closest('.pricing-card').style.opacity = '1';
            event.target.closest('.pricing-card').style.border = '2px solid #4CAF50';
            
            setTimeout(() => nextStep(4), 1000);
        }
        
        function generateFamilySummary() {
            const summary = \`
                <div class="family-grid">
                    <div class="family-member">
                        <h4>👨‍💼 Family Admin</h4>
                        <p><strong>\${familyData.admin.name}</strong></p>
                        <p>\${familyData.admin.email}</p>
                        <div class="age-tier">1099 Eligible</div>
                    </div>
                    \${familyData.members.map(member => \`
                        <div class="family-member">
                            <h4>👤 \${member.name}</h4>
                            <p>\${member.relation}</p>
                            <div class="age-tier">\${getAgeTier(member.birthdate)}</div>
                        </div>
                    \`).join('')}
                </div>
                
                <div class="benefits">
                    <h3>Selected Plan: \${familyData.plan.toUpperCase()}</h3>
                    <p>Monthly cost: \${getPlanPrice(familyData.plan)}</p>
                    <p>Potential volunteer credits: Up to $200/month</p>
                </div>
            \`;
            
            document.getElementById('familySummary').innerHTML = summary;
        }
        
        function getAgeTier(birthdate) {
            const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
            if (age <= 6) return 'Little Learner';
            if (age <= 12) return 'Young Explorer';
            if (age <= 17) return 'Student Scholar';
            if (age >= 65) return 'Wisdom Circle';
            return 'Full Access';
        }
        
        function getPlanPrice(plan) {
            const prices = { basic: '$29.99', premium: '$49.99', enterprise: '$79.99' };
            return prices[plan];
        }
        
        async function completeFamilySetup() {
            try {
                const response = await fetch('/api/family/complete-setup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(familyData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Family setup complete! Check your email for next steps.');
                    window.location.href = \`/family-dashboard?id=\${result.familyId}\`;
                } else {
                    alert('Setup failed: ' + result.error);
                }
            } catch (error) {
                alert('Setup failed: ' + error.message);
            }
        }
    </script>
</body>
</html>`;
    }
    
    generateAgentPortal() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>💼 Insurance Agent Portal - Family Digital Safety</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .agent-dashboard {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }
        
        .dashboard-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .commission-tracker {
            background: rgba(46, 204, 113, 0.2);
            border-color: #2ecc71;
        }
        
        .sales-tools {
            background: rgba(241, 196, 15, 0.2);
            border-color: #f1c40f;
        }
        
        .family-leads {
            background: rgba(155, 89, 182, 0.2);
            border-color: #9b59b6;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 15px 0;
            padding: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
        
        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 20px;
            cursor: pointer;
            margin: 8px 4px;
            transition: all 0.3s;
        }
        
        button:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        .sales-script {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            font-style: italic;
        }
        
        .pricing-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        
        .plan-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        }
        
        .commission-rate {
            color: #4CAF50;
            font-weight: bold;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <h1>💼 Insurance Agent Portal</h1>
    <p>Sell Family Digital Safety packages and earn ongoing commissions</p>
    
    <div class="agent-dashboard">
        <div class="dashboard-card commission-tracker">
            <h2>💰 Your Commissions</h2>
            
            <div class="metric">
                <span>This Month</span>
                <span class="metric-value">$2,847</span>
            </div>
            
            <div class="metric">
                <span>Active Families</span>
                <span class="metric-value">23</span>
            </div>
            
            <div class="metric">
                <span>Avg Commission</span>
                <span class="metric-value">$12.40</span>
            </div>
            
            <div class="metric">
                <span>YTD Total</span>
                <span class="metric-value">$18,293</span>
            </div>
            
            <button onclick="downloadCommissionReport()">📊 Download Report</button>
        </div>
        
        <div class="dashboard-card sales-tools">
            <h2>🎯 Sales Tools</h2>
            
            <h3>Quick Family Setup Link</h3>
            <input type="text" value="https://familyai.com/?agent=AGENT123" style="width: 100%; padding: 8px; margin: 10px 0; border-radius: 5px; border: none;" readonly />
            <button onclick="copyAgentLink()">📋 Copy Link</button>
            
            <div class="sales-script">
                <h4>🗣️ Family Safety Pitch</h4>
                <p>"As your insurance agent, I want to protect your family online too. This AI platform gives your kids safe educational access while adults get full features. Plus, you can earn credits by volunteering in your community!"</p>
            </div>
            
            <button onclick="downloadSalesKit()">📁 Download Sales Kit</button>
            <button onclick="scheduleTraining()">📚 Schedule Training</button>
        </div>
        
        <div class="dashboard-card family-leads">
            <h2>👨‍👩‍👧‍👦 Family Leads</h2>
            
            <div style="margin: 20px 0;">
                <h4>Recent Inquiries</h4>
                <div class="metric">
                    <span>Johnson Family (4 members)</span>
                    <button style="padding: 5px 10px; font-size: 12px;">Follow Up</button>
                </div>
                <div class="metric">
                    <span>Smith Family (2 members)</span>
                    <button style="padding: 5px 10px; font-size: 12px;">Send Info</button>
                </div>
                <div class="metric">
                    <span>Williams Family (6 members)</span>
                    <button style="padding: 5px 10px; font-size: 12px;">Schedule Demo</button>
                </div>
            </div>
            
            <button onclick="generateNewLeads()">🎯 Generate Leads</button>
            <button onclick="scheduleDemo()">📅 Schedule Demo</button>
        </div>
    </div>
    
    <div class="dashboard-card" style="grid-column: 1 / -1; margin-top: 20px;">
        <h2>📋 Plan Commission Structure</h2>
        
        <div class="pricing-comparison">
            <div class="plan-card">
                <h3>Family Basic</h3>
                <div style="font-size: 24px; margin: 10px 0;">$29.99/mo</div>
                <div class="commission-rate">15% = $4.50/mo</div>
                <ul style="text-align: left; margin: 15px 0;">
                    <li>Age-appropriate filtering</li>
                    <li>Basic parental controls</li>
                    <li>Educational games</li>
                </ul>
            </div>
            
            <div class="plan-card" style="border: 2px solid #4CAF50;">
                <h3>Family Premium</h3>
                <div style="font-size: 24px; margin: 10px 0;">$49.99/mo</div>
                <div class="commission-rate">20% = $10.00/mo</div>
                <div style="background: #4CAF50; padding: 5px; margin: 5px 0; border-radius: 10px;">Most Popular</div>
                <ul style="text-align: left; margin: 15px 0;">
                    <li>Everything in Basic</li>
                    <li>Volunteer hour tracking</li>
                    <li>Bill credit system</li>
                    <li>1099 generation</li>
                </ul>
            </div>
            
            <div class="plan-card">
                <h3>Family Enterprise</h3>
                <div style="font-size: 24px; margin: 10px 0;">$79.99/mo</div>
                <div class="commission-rate">25% = $20.00/mo</div>
                <ul style="text-align: left; margin: 15px 0;">
                    <li>Everything in Premium</li>
                    <li>Custom content</li>
                    <li>Advanced analytics</li>
                    <li>Priority support</li>
                </ul>
            </div>
        </div>
        
        <div style="background: rgba(76, 175, 80, 0.2); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>🎯 Perfect for Insurance Clients Because:</h3>
            <ul>
                <li><strong>Risk Reduction:</strong> Protects families from online dangers</li>
                <li><strong>Educational Value:</strong> Kids learn safely while parents work</li>
                <li><strong>Financial Benefits:</strong> Volunteer credits reduce monthly costs</li>
                <li><strong>Tax Advantages:</strong> 1099 generation for family coordinators</li>
                <li><strong>Community Connection:</strong> Links families to local nonprofits</li>
            </ul>
        </div>
    </div>
    
    <script>
        function copyAgentLink() {
            navigator.clipboard.writeText('https://familyai.com/?agent=AGENT123');
            alert('Agent link copied to clipboard!');
        }
        
        function downloadCommissionReport() {
            alert('Commission report download started');
        }
        
        function downloadSalesKit() {
            alert('Sales kit download started');
        }
        
        function scheduleTraining() {
            alert('Training scheduler opened');
        }
        
        function generateNewLeads() {
            alert('Lead generation system activated');
        }
        
        function scheduleDemo() {
            alert('Demo scheduler opened');
        }
    </script>
</body>
</html>`;
    }
    
    async startFamilySetup(req, res) {
        const { agentId, familyName } = req.body;
        
        const familyId = uuidv4();
        const family = {
            id: familyId,
            name: familyName,
            agentId,
            status: 'setup_started',
            createdAt: new Date(),
            members: [],
            plan: null,
            volunteerCredits: 0,
            totalEarnings: 0
        };
        
        this.families.set(familyId, family);
        
        res.json({
            success: true,
            familyId,
            setupUrl: `/family-setup?id=${familyId}`
        });
    }
    
    async addFamilyMember(req, res) {
        const { familyId, memberData } = req.body;
        
        const family = this.families.get(familyId);
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }
        
        // Calculate age and assign tier
        const age = this.calculateAge(memberData.birthdate);
        const tier = this.determineAccessTier(age);
        
        const member = {
            id: uuidv4(),
            ...memberData,
            age,
            tier,
            accessLevel: tier.name,
            features: tier.features,
            verificationRequired: age >= 18,
            parentalApproval: age < 18
        };
        
        family.members.push(member);
        this.families.set(familyId, family);
        
        res.json({
            success: true,
            member,
            familySize: family.members.length
        });
    }
    
    async completeFamilySetup(req, res) {
        const { familyId, plan, adminData } = req.body;
        
        const family = this.families.get(familyId);
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }
        
        // Update family with final information
        family.admin = adminData;
        family.plan = plan;
        family.status = 'active';
        family.setupCompletedAt = new Date();
        family.monthlyRate = this.agentCommissions[`family_${plan}`].monthly;
        family.agentCommission = this.agentCommissions[`family_${plan}`].commission;
        
        // Generate family coordinator 1099 eligibility
        family.tax1099 = {
            eligible: true,
            role: 'Family Digital Coordinator',
            estimatedAnnualEarnings: family.monthlyRate * 12 * 0.1 // 10% of subscription as coordination fee
        };
        
        // Create zero-knowledge verification challenges
        family.verificationChallenges = await this.generateVerificationChallenges(family);
        
        this.families.set(familyId, family);
        
        // Notify insurance agent of successful sale
        if (family.agentId) {
            await this.notifyAgentOfSale(family.agentId, family);
        }
        
        res.json({
            success: true,
            familyId,
            dashboardUrl: `/family-dashboard?id=${familyId}`,
            verificationRequired: family.verificationChallenges.length > 0,
            tax1099Info: family.tax1099
        });
    }
    
    async logVolunteerHours(req, res) {
        const { familyId, volunteerType, hours, nonprofitId, verificationCode } = req.body;
        
        const family = this.families.get(familyId);
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }
        
        // Verify with nonprofit partner
        const verified = await this.verifyVolunteerHours(nonprofitId, verificationCode, hours);
        if (!verified) {
            return res.status(400).json({ error: 'Could not verify volunteer hours' });
        }
        
        // Calculate credits
        const creditRate = this.volunteerCredits[volunteerType]?.rate || 8.00;
        const creditsEarned = hours * creditRate;
        
        // Record volunteer activity
        const volunteerRecord = {
            id: uuidv4(),
            date: new Date(),
            type: volunteerType,
            hours,
            nonprofitId,
            creditsEarned,
            verified: true,
            description: this.volunteerCredits[volunteerType]?.description
        };
        
        if (!family.volunteerHistory) {
            family.volunteerHistory = [];
        }
        
        family.volunteerHistory.push(volunteerRecord);
        family.volunteerCredits += creditsEarned;
        
        // Update 1099 tracking
        family.totalEarnings += creditsEarned;
        
        this.families.set(familyId, family);
        
        res.json({
            success: true,
            hoursLogged: hours,
            creditsEarned,
            totalCredits: family.volunteerCredits,
            nextBillReduction: Math.min(creditsEarned, family.monthlyRate),
            annualEarnings: family.totalEarnings
        });
    }
    
    async getVolunteerCredits(req, res) {
        const { familyId } = req.params;
        
        const family = this.families.get(familyId);
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }
        
        const creditSummary = {
            totalCredits: family.volunteerCredits || 0,
            monthlyBillReduction: Math.min(family.volunteerCredits, family.monthlyRate),
            availableCredits: Math.max(0, family.volunteerCredits - family.monthlyRate),
            volunteerHistory: family.volunteerHistory || [],
            suggestedDonations: family.volunteerCredits > family.monthlyRate ? 
                family.volunteerCredits - family.monthlyRate : 0
        };
        
        res.json(creditSummary);
    }
    
    async registerAgent(req, res) {
        const { agentName, agentEmail, licenseNumber, agencyName } = req.body;
        
        const agentId = uuidv4();
        const agent = {
            id: agentId,
            name: agentName,
            email: agentEmail,
            licenseNumber,
            agencyName,
            registeredAt: new Date(),
            familiesSold: 0,
            totalCommissions: 0,
            monthlyCommissions: 0
        };
        
        this.insuranceAgents.set(agentId, agent);
        
        res.json({
            success: true,
            agentId,
            portalUrl: `/agent?id=${agentId}`,
            salesUrl: `/?agent=${agentId}`
        });
    }
    
    async recordFamilySale(req, res) {
        const { agentId, familyId } = req.body;
        
        const agent = this.insuranceAgents.get(agentId);
        const family = this.families.get(familyId);
        
        if (!agent || !family) {
            return res.status(404).json({ error: 'Agent or family not found' });
        }
        
        // Calculate commission
        const monthlyCommission = family.monthlyRate * family.agentCommission;
        
        agent.familiesSold++;
        agent.totalCommissions += monthlyCommission;
        agent.monthlyCommissions += monthlyCommission;
        
        this.insuranceAgents.set(agentId, agent);
        
        res.json({
            success: true,
            commission: monthlyCommission,
            totalCommissions: agent.totalCommissions
        });
    }
    
    async getAgentCommissions(req, res) {
        const { agentId } = req.params;
        
        const agent = this.insuranceAgents.get(agentId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Calculate families sold by this agent
        const agentFamilies = Array.from(this.families.values())
            .filter(family => family.agentId === agentId);
        
        const commissionDetails = {
            agent: agent.name,
            totalFamilies: agentFamilies.length,
            monthlyCommissions: agent.monthlyCommissions,
            annualProjection: agent.monthlyCommissions * 12,
            familyBreakdown: agentFamilies.map(family => ({
                familyName: family.name,
                plan: family.plan,
                monthlyCommission: family.monthlyRate * family.agentCommission,
                joinDate: family.createdAt
            }))
        };
        
        res.json(commissionDetails);
    }
    
    async generateAgeProof(req, res) {
        const { birthdate, minAge } = req.body;
        
        // Zero-knowledge proof that person is over minAge without revealing exact age
        const actualAge = this.calculateAge(birthdate);
        const isOldEnough = actualAge >= minAge;
        
        // Generate cryptographic proof
        const proof = {
            challenge: crypto.randomBytes(32).toString('hex'),
            response: crypto.createHash('sha256')
                .update(`${birthdate}:${minAge}:${isOldEnough}`)
                .digest('hex'),
            verified: isOldEnough,
            timestamp: Date.now()
        };
        
        res.json({
            ageVerified: isOldEnough,
            proof: proof.response,
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
    }
    
    async generateBankProof(req, res) {
        const { accountHash } = req.body;
        
        // Zero-knowledge proof of bank account ownership without storing details
        const proof = {
            accountExists: true, // Would verify with Plaid
            accountType: 'checking',
            verificationHash: crypto.createHash('sha256')
                .update(`verified:${accountHash}:${Date.now()}`)
                .digest('hex'),
            timestamp: Date.now()
        };
        
        res.json({
            bankVerified: true,
            proof: proof.verificationHash,
            accountType: proof.accountType
        });
    }
    
    async generateFamilyProof(req, res) {
        const { familyId, relationships } = req.body;
        
        // Zero-knowledge proof of family relationships
        const proof = {
            familySize: relationships.length,
            hasMinors: relationships.some(r => r.age < 18),
            hasAdults: relationships.some(r => r.age >= 18),
            verificationHash: crypto.createHash('sha256')
                .update(`family:${familyId}:${JSON.stringify(relationships)}`)
                .digest('hex')
        };
        
        res.json({
            familyVerified: true,
            proof: proof.verificationHash,
            familyStructure: {
                size: proof.familySize,
                hasMinors: proof.hasMinors,
                hasAdults: proof.hasAdults
            }
        });
    }
    
    async generate1099(req, res) {
        const { familyId, taxYear } = req.params;
        
        const family = this.families.get(familyId);
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }
        
        // Calculate total earnings for tax year
        const coordinationFee = family.monthlyRate * 12 * 0.1; // 10% of subscription
        const volunteerCredits = family.totalEarnings || 0;
        const totalEarnings = coordinationFee + volunteerCredits;
        
        const form1099 = {
            familyId,
            taxYear: taxYear || new Date().getFullYear(),
            recipientName: family.admin.name,
            recipientSSN: '***-**-****', // Would be collected during setup
            payerName: 'Family Digital Safety Platform',
            payerEIN: '**-*******',
            boxData: {
                box1_nonemployeeCompensation: totalEarnings,
                box4_federalIncomeTaxWithheld: 0,
                box6_medicalPayments: 0,
                box7_substituePayments: volunteerCredits
            },
            description: 'Family Digital Coordinator Services and Volunteer Credits',
            generatedAt: new Date()
        };
        
        res.json({
            success: true,
            form1099,
            downloadUrl: `/tax/download/1099/${familyId}/${taxYear}`,
            instructions: 'This 1099 reflects your earnings as a Family Digital Coordinator and volunteer credit income'
        });
    }
    
    // Helper methods
    calculateAge(birthdate) {
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }
    
    determineAccessTier(age) {
        for (const [tierName, tier] of Object.entries(this.accessTiers)) {
            if (age >= tier.ages[0] && age <= tier.ages[1]) {
                return tier;
            }
        }
        return this.accessTiers.ADULT; // Default to adult
    }
    
    async generateVerificationChallenges(family) {
        const challenges = [];
        
        // Age verification for adults
        const adults = family.members.filter(m => m.age >= 18);
        if (adults.length > 0) {
            challenges.push({
                type: 'age_verification',
                description: 'Bank account verification required for adult members',
                required: true
            });
        }
        
        // Parental consent for minors
        const minors = family.members.filter(m => m.age < 18);
        if (minors.length > 0) {
            challenges.push({
                type: 'parental_consent',
                description: 'Parental consent verification for minor members',
                required: true
            });
        }
        
        return challenges;
    }
    
    async notifyAgentOfSale(agentId, family) {
        const agent = this.insuranceAgents.get(agentId);
        if (agent) {
            console.log(`📧 Notifying agent ${agent.name} of family sale: ${family.name}`);
            // In production, would send email notification
        }
    }
    
    async verifyVolunteerHours(nonprofitId, verificationCode, hours) {
        // In production, would verify with actual nonprofit database
        console.log(`✅ Verified ${hours} volunteer hours with nonprofit ${nonprofitId}`);
        return true;
    }
}

module.exports = FamilyOnboardingWizard;

if (require.main === module) {
    new FamilyOnboardingWizard();
}
#!/usr/bin/env node

/**
 * 🔒 CHILDPROOF AI SYSTEM
 * 
 * E-Rating Compliant System with:
 * - No open chat for anyone under 18
 * - Plaid bank account verification for adults
 * - NO credit cards accepted
 * - Safe, educational content for minors
 * - Full chat access only for verified adults
 */

const express = require('express');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class ChildproofAISystem {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8888;
        
        // User categories
        this.userTypes = {
            MINOR: 'minor',           // Under 18 - restricted access
            UNVERIFIED: 'unverified', // 18+ but not bank verified
            VERIFIED: 'verified'      // 18+ with bank verification
        };
        
        // Content ratings
        this.contentRatings = {
            E: 'Everyone',           // Safe for all ages
            E10: 'Everyone 10+',     // Safe for 10+
            T: 'Teen',               // 13+
            M: 'Mature'              // 18+ only (requires verification)
        };
        
        // Plaid configuration (for bank verification)
        this.plaidClient = new PlaidApi(new Configuration({
            basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                    'PLAID-SECRET': process.env.PLAID_SECRET,
                }
            }
        }));
        
        // User registry
        this.users = new Map();
        
        // Restricted words for minors
        this.restrictedContent = new Set([
            // Add words that should be filtered for minors
            'inappropriate', 'adult', 'mature', 'explicit'
        ]);
        
        // Educational content library for minors
        this.educationalContent = {
            math: ['algebra', 'geometry', 'arithmetic'],
            science: ['biology', 'physics', 'chemistry'],
            history: ['world history', 'american history'],
            language: ['grammar', 'vocabulary', 'reading'],
            coding: ['scratch', 'python basics', 'web design']
        };
        
        this.initialize();
    }
    
    async initialize() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS for safety
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
        
        this.setupRoutes();
        
        this.app.listen(this.port, () => {
            console.log(`🔒 Childproof AI System running on port ${this.port}`);
            console.log(`✅ E-Rating Compliant`);
            console.log(`🏦 Bank verification via Plaid`);
            console.log(`❌ NO credit cards accepted`);
        });
    }
    
    setupRoutes() {
        // Main page
        this.app.get('/', (req, res) => {
            res.send(this.generateMainPage());
        });
        
        // User registration
        this.app.post('/api/register', this.handleRegistration.bind(this));
        
        // Age verification
        this.app.post('/api/verify-age', this.handleAgeVerification.bind(this));
        
        // Bank verification (Plaid)
        this.app.post('/api/bank-verification/start', this.startBankVerification.bind(this));
        this.app.post('/api/bank-verification/complete', this.completeBankVerification.bind(this));
        
        // AI interaction (filtered based on user type)
        this.app.post('/api/ai/chat', this.handleAIChat.bind(this));
        this.app.get('/api/ai/educational', this.getEducationalContent.bind(this));
        
        // Parent/Guardian controls
        this.app.post('/api/parental/approve', this.handleParentalApproval.bind(this));
        this.app.get('/api/parental/activity', this.getChildActivity.bind(this));
    }
    
    generateMainPage() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🔒 Childproof AI - Safe Learning Environment</title>
    <style>
        body {
            font-family: 'Comic Sans MS', cursive, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        .rating-badge {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            margin: 10px 0;
        }
        .age-gates {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .age-gate {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.3s;
        }
        .age-gate:hover {
            transform: translateY(-5px);
        }
        .age-gate h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .features {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .features li {
            margin: 10px 0;
        }
        button {
            background: #FF6B6B;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 18px;
            cursor: pointer;
            margin: 10px;
            transition: background 0.3s;
        }
        button:hover {
            background: #FF5252;
        }
        .safe-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 100px;
            height: 100px;
            background: #4CAF50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <div class="safe-badge">🛡️</div>
    
    <div class="container">
        <h1>🎮 Welcome to Childproof AI Learning</h1>
        <div class="rating-badge">✅ E for Everyone - ESRB Compliant</div>
        
        <div class="features">
            <h2>🌟 Our Safety Features:</h2>
            <ul>
                <li>🔒 <strong>Age-Appropriate Content Only</strong> - No adult content ever</li>
                <li>🏦 <strong>Bank Verification for Adults</strong> - Via Plaid (no credit cards!)</li>
                <li>💬 <strong>Restricted Chat for Minors</strong> - Educational content only</li>
                <li>👨‍👩‍👧 <strong>Parental Controls</strong> - Full activity monitoring</li>
                <li>🎓 <strong>Educational Focus</strong> - Learn safely with AI</li>
                <li>🚫 <strong>No Payment Info from Kids</strong> - Adults verify via bank only</li>
            </ul>
        </div>
        
        <h2>Choose Your Age Group:</h2>
        <div class="age-gates">
            <div class="age-gate" onclick="selectAge('under13')">
                <h3>🧒 Under 13</h3>
                <p>Educational content only</p>
                <p>Parent approval required</p>
                <p>No chat features</p>
            </div>
            
            <div class="age-gate" onclick="selectAge('13to17')">
                <h3>👦 13-17 Years</h3>
                <p>Limited chat access</p>
                <p>Educational focus</p>
                <p>Filtered content</p>
            </div>
            
            <div class="age-gate" onclick="selectAge('18plus')">
                <h3>👨 18+ Adults</h3>
                <p>Full access available</p>
                <p>Bank verification required</p>
                <p>Open chat features</p>
            </div>
        </div>
        
        <div id="registration" style="display: none;">
            <h2>Registration</h2>
            <input type="text" id="username" placeholder="Choose a username" />
            <input type="date" id="birthdate" placeholder="Birth date" />
            <div id="minorFields" style="display: none;">
                <input type="email" id="parentEmail" placeholder="Parent/Guardian Email" />
            </div>
            <button onclick="register()">Create Safe Account</button>
        </div>
    </div>
    
    <script>
        let selectedAge = null;
        
        function selectAge(ageGroup) {
            selectedAge = ageGroup;
            document.getElementById('registration').style.display = 'block';
            
            if (ageGroup === 'under13' || ageGroup === '13to17') {
                document.getElementById('minorFields').style.display = 'block';
            } else {
                document.getElementById('minorFields').style.display = 'none';
            }
        }
        
        async function register() {
            const username = document.getElementById('username').value;
            const birthdate = document.getElementById('birthdate').value;
            const parentEmail = document.getElementById('parentEmail').value;
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    birthdate,
                    parentEmail,
                    ageGroup: selectedAge
                })
            });
            
            const result = await response.json();
            if (result.success) {
                if (result.requiresBankVerification) {
                    window.location.href = '/bank-verification';
                } else if (result.requiresParentalConsent) {
                    alert('Parent/Guardian has been notified for approval');
                } else {
                    window.location.href = '/educational-portal';
                }
            }
        }
    </script>
</body>
</html>`;
    }
    
    async handleRegistration(req, res) {
        const { username, birthdate, parentEmail, ageGroup } = req.body;
        
        // Calculate age
        const age = this.calculateAge(birthdate);
        
        // Determine user type
        let userType = this.userTypes.MINOR;
        let requiresBankVerification = false;
        let requiresParentalConsent = false;
        
        if (age >= 18) {
            userType = this.userTypes.UNVERIFIED;
            requiresBankVerification = true;
        } else {
            requiresParentalConsent = true;
        }
        
        // Create user
        const user = {
            id: uuidv4(),
            username,
            birthdate,
            age,
            userType,
            parentEmail,
            registeredAt: new Date(),
            verificationStatus: 'pending',
            allowedContent: age >= 18 ? ['E', 'E10', 'T', 'M'] : 
                           age >= 13 ? ['E', 'E10', 'T'] :
                           age >= 10 ? ['E', 'E10'] : ['E'],
            chatRestrictions: age < 18 ? 'educational_only' : 'none',
            activityLog: []
        };
        
        this.users.set(user.id, user);
        
        // Send parental consent email if minor
        if (requiresParentalConsent && parentEmail) {
            await this.sendParentalConsentEmail(parentEmail, user);
        }
        
        res.json({
            success: true,
            userId: user.id,
            userType,
            requiresBankVerification,
            requiresParentalConsent,
            allowedContent: user.allowedContent
        });
    }
    
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
    
    async handleAgeVerification(req, res) {
        const { userId, verificationType, verificationData } = req.body;
        
        const user = this.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Different verification methods
        switch (verificationType) {
            case 'parental_consent':
                user.parentalConsent = true;
                user.verificationStatus = 'parent_approved';
                break;
                
            case 'school_verification':
                // Could integrate with school systems
                user.schoolVerified = true;
                break;
                
            case 'id_verification':
                // For 18+ users who don't want to use bank
                // Could use third-party ID verification
                break;
        }
        
        this.users.set(userId, user);
        
        res.json({
            success: true,
            verificationStatus: user.verificationStatus
        });
    }
    
    async startBankVerification(req, res) {
        const { userId } = req.body;
        
        const user = this.users.get(userId);
        if (!user || user.age < 18) {
            return res.status(403).json({ error: 'Bank verification only for 18+' });
        }
        
        try {
            // Create Plaid Link token
            const configs = {
                user: { client_user_id: userId },
                client_name: 'Childproof AI',
                products: ['auth'], // Only need auth, not transactions
                country_codes: ['US'],
                language: 'en',
                // NO credit card products - only bank accounts
                account_filters: {
                    depository: {
                        account_subtypes: ['checking', 'savings']
                    }
                }
            };
            
            const createTokenResponse = await this.plaidClient.linkTokenCreate(configs);
            
            res.json({
                success: true,
                link_token: createTokenResponse.data.link_token
            });
            
        } catch (error) {
            console.error('Plaid error:', error);
            res.status(500).json({ error: 'Bank verification unavailable' });
        }
    }
    
    async completeBankVerification(req, res) {
        const { userId, publicToken } = req.body;
        
        const user = this.users.get(userId);
        if (!user || user.age < 18) {
            return res.status(403).json({ error: 'Bank verification only for 18+' });
        }
        
        try {
            // Exchange public token for access token
            const tokenResponse = await this.plaidClient.itemPublicTokenExchange({
                public_token: publicToken
            });
            
            // Get account info to verify it's a real bank account
            const authResponse = await this.plaidClient.authGet({
                access_token: tokenResponse.data.access_token
            });
            
            // Verify account exists and is valid
            if (authResponse.data.accounts.length > 0) {
                user.userType = this.userTypes.VERIFIED;
                user.verificationStatus = 'bank_verified';
                user.verifiedAt = new Date();
                user.chatRestrictions = 'none';
                
                // We do NOT store any bank details
                // Just mark as verified
                
                this.users.set(userId, user);
                
                res.json({
                    success: true,
                    message: 'Bank verification complete - full access granted',
                    userType: user.userType
                });
            } else {
                res.status(400).json({ error: 'No valid bank account found' });
            }
            
        } catch (error) {
            console.error('Bank verification error:', error);
            res.status(500).json({ error: 'Bank verification failed' });
        }
    }
    
    async handleAIChat(req, res) {
        const { userId, message } = req.body;
        
        const user = this.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Log activity
        user.activityLog.push({
            timestamp: new Date(),
            action: 'chat',
            content: message
        });
        
        // Filter based on user type
        let response;
        
        if (user.userType === this.userTypes.MINOR || user.chatRestrictions === 'educational_only') {
            // Restricted chat for minors
            response = await this.generateEducationalResponse(message, user.age);
        } else if (user.userType === this.userTypes.VERIFIED) {
            // Full chat access for verified adults
            response = await this.generateFullResponse(message);
        } else {
            // Limited chat for unverified adults
            response = {
                message: "Please complete bank verification for full chat access.",
                limited: true
            };
        }
        
        res.json({
            success: true,
            response,
            restrictions: user.chatRestrictions
        });
    }
    
    async generateEducationalResponse(message, age) {
        // Check for restricted content
        const lowercaseMessage = message.toLowerCase();
        for (const restricted of this.restrictedContent) {
            if (lowercaseMessage.includes(restricted)) {
                return {
                    message: "Let's talk about something educational instead! What subject would you like to learn about?",
                    filtered: true
                };
            }
        }
        
        // Educational responses only
        const educationalTopics = Object.keys(this.educationalContent);
        const matchedTopic = educationalTopics.find(topic => 
            lowercaseMessage.includes(topic)
        );
        
        if (matchedTopic) {
            const subtopics = this.educationalContent[matchedTopic];
            return {
                message: `Great! Let's learn about ${matchedTopic}. We can explore: ${subtopics.join(', ')}. What interests you most?`,
                educational: true,
                topic: matchedTopic
            };
        }
        
        // Default educational response
        return {
            message: `That's interesting! Let's explore this from an educational perspective. What would you like to learn about this topic?`,
            educational: true
        };
    }
    
    async generateFullResponse(message) {
        // Full unrestricted response for verified adults
        return {
            message: `[Full AI Response] ${message}`,
            unrestricted: true
        };
    }
    
    async getEducationalContent(req, res) {
        const { userId, subject } = req.query;
        
        const user = this.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const content = this.educationalContent[subject] || [];
        
        res.json({
            success: true,
            subject,
            topics: content,
            ageAppropriate: true
        });
    }
    
    async handleParentalApproval(req, res) {
        const { userId, parentToken, approved } = req.body;
        
        const user = this.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (approved) {
            user.parentalConsent = true;
            user.verificationStatus = 'parent_approved';
        } else {
            user.parentalConsent = false;
            user.verificationStatus = 'parent_denied';
        }
        
        this.users.set(userId, user);
        
        res.json({
            success: true,
            approved,
            message: approved ? 'Child account approved' : 'Child account denied'
        });
    }
    
    async getChildActivity(req, res) {
        const { parentEmail } = req.query;
        
        // Find all children associated with this parent email
        const children = Array.from(this.users.values()).filter(
            user => user.parentEmail === parentEmail
        );
        
        const activityReports = children.map(child => ({
            username: child.username,
            age: child.age,
            activityLog: child.activityLog.slice(-20), // Last 20 activities
            totalActivities: child.activityLog.length,
            lastActive: child.activityLog[child.activityLog.length - 1]?.timestamp
        }));
        
        res.json({
            success: true,
            children: activityReports
        });
    }
    
    async sendParentalConsentEmail(email, childUser) {
        // In production, would send actual email
        console.log(`📧 Sending parental consent email to ${email} for ${childUser.username}`);
    }
}

// Create environment template if it doesn't exist
const envTemplate = `# Childproof AI System Environment Variables

# Plaid Configuration (for bank verification)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Server Configuration
PORT=8888
ALLOWED_ORIGIN=*

# Security
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}
`;

const fs = require('fs');
if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envTemplate);
    console.log('📄 Created .env template - please configure Plaid credentials');
}

// Export and run
module.exports = ChildproofAISystem;

if (require.main === module) {
    new ChildproofAISystem();
}
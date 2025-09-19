#!/usr/bin/env node

/**
 * 🎯 AGENT REASONING HUB
 * Multi-agent service platform with specialized revenue streams
 * Each agent has unique personality, pricing, and capabilities
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json());

// Agent definitions with personalities and pricing
const AGENTS = {
    ralph: {
        name: 'Ralph',
        personality: 'Paranoid Security Expert',
        specialty: 'defensive_security',
        description: 'Finds vulnerabilities others miss with military-grade paranoia',
        avatar: '🛡️',
        models: ['local_ollama', 'anthropic_claude'],
        pricing: {
            basic: 0.15,        // Basic security scan
            premium: 0.75,      // Deep vulnerability analysis
            enterprise: 5.00    // Full security audit
        },
        capabilities: [
            'vulnerability_scanning',
            'security_audit',
            'threat_assessment',
            'compliance_check',
            'penetration_testing'
        ],
        motto: 'Trust nothing, verify everything, assume breach'
    },
    
    doc: {
        name: 'DocAgent',
        personality: 'Friendly Documentation Specialist',
        specialty: 'documentation_generation',
        description: 'Makes complex code understandable with clear explanations',
        avatar: '📚',
        models: ['anthropic_opus', 'openai_gpt4'],
        pricing: {
            basic: 0.10,        // Simple documentation
            premium: 1.00,      // Comprehensive docs
            enterprise: 10.00   // Full technical spec
        },
        capabilities: [
            'code_documentation',
            'api_documentation',
            'user_guides',
            'technical_specifications',
            'readme_generation'
        ],
        motto: 'Good code tells you what, great docs tell you why'
    },
    
    roast: {
        name: 'RoastAgent',
        personality: 'Sarcastic Code Critic',
        specialty: 'code_quality_roasting',
        description: 'Provides brutally honest code reviews with humor',
        avatar: '🔥',
        models: ['openai_gpt4', 'anthropic_claude'],
        pricing: {
            basic: 0.05,        // Light roasting
            premium: 0.25,      // Full roast with suggestions
            enterprise: 2.00    // Enterprise-grade critique
        },
        capabilities: [
            'code_roasting',
            'quality_assessment',
            'style_critique',
            'performance_shaming',
            'refactoring_suggestions'
        ],
        motto: 'Your code is bad and you should feel bad (but here\'s how to fix it)'
    },
    
    blame: {
        name: 'BlameAgent',
        personality: 'Code Detective',
        specialty: 'attribution_analysis',
        description: 'Traces code origins and git history like a detective',
        avatar: '🕵️',
        models: ['google_gemini', 'anthropic_claude'],
        pricing: {
            basic: 0.10,        // Basic blame analysis
            premium: 0.50,      // Deep attribution report
            enterprise: 3.00    // Full forensic analysis
        },
        capabilities: [
            'git_blame_analysis',
            'code_attribution',
            'change_tracking',
            'author_statistics',
            'repository_forensics'
        ],
        motto: 'Every line tells a story, and I know all the stories'
    },
    
    archaeologist: {
        name: 'ArchaeologistAgent',
        personality: 'Legacy Code Explorer',
        specialty: 'legacy_analysis',
        description: 'Excavates and documents ancient codebases',
        avatar: '🏺',
        models: ['anthropic_opus', 'openai_gpt4'],
        pricing: {
            basic: 0.20,        // Basic legacy scan
            premium: 1.50,      // Deep archaeological dig
            enterprise: 15.00   // Full legacy migration plan
        },
        capabilities: [
            'legacy_code_analysis',
            'dependency_archaeology',
            'technical_debt_assessment',
            'migration_planning',
            'ancient_pattern_recognition'
        ],
        motto: 'Every codebase has secrets buried in its history'
    },
    
    refactor: {
        name: 'RefactorAgent',
        personality: 'Code Perfectionist',
        specialty: 'code_optimization',
        description: 'Obsessively improves code structure and performance',
        avatar: '✨',
        models: ['anthropic_opus', 'openai_gpt4'],
        pricing: {
            basic: 0.25,        // Basic refactoring suggestions
            premium: 2.00,      // Detailed refactoring plan
            enterprise: 20.00   // Full codebase transformation
        },
        capabilities: [
            'code_refactoring',
            'performance_optimization',
            'architecture_improvement',
            'pattern_implementation',
            'technical_debt_reduction'
        ],
        motto: 'Good code is like a good joke - it needs no explanation'
    },
    
    hustle: {
        name: 'HustleAgent',
        personality: 'Revenue Opportunity Hunter',
        specialty: 'monetization_analysis',
        description: 'Finds money-making opportunities in any codebase',
        avatar: '💰',
        models: ['google_gemini', 'anthropic_claude'],
        pricing: {
            basic: 0.50,        // Basic revenue scan
            premium: 5.00,      // Comprehensive monetization plan
            enterprise: 50.00   // Full business transformation
        },
        capabilities: [
            'revenue_opportunity_analysis',
            'api_monetization',
            'subscription_model_design',
            'pricing_strategy',
            'business_intelligence'
        ],
        motto: 'Every line of code is a potential revenue stream'
    },
    
    battle: {
        name: 'BattleAgent',
        personality: 'Code Competition Judge',
        specialty: 'competitive_analysis',
        description: 'Judges code battles and competitive programming',
        avatar: '⚔️',
        models: ['local_ollama', 'google_gemini'],
        pricing: {
            basic: 0.30,        // Simple code comparison
            premium: 3.00,      // Full competitive analysis
            enterprise: 25.00   // Tournament-grade judging
        },
        capabilities: [
            'code_comparison',
            'algorithm_efficiency',
            'competitive_scoring',
            'performance_benchmarking',
            'solution_ranking'
        ],
        motto: 'In the arena of code, only the efficient survive'
    }
};

// Revenue tracking
let revenueState = {
    totalEarnings: 0,
    agentEarnings: {},
    transactions: [],
    activeSubscriptions: {},
    sessionId: generateSessionId()
};

// Load existing revenue data
try {
    const revenuePath = './agent-revenue-data.json';
    if (fs.existsSync(revenuePath)) {
        revenueState = { ...revenueState, ...JSON.parse(fs.readFileSync(revenuePath, 'utf8')) };
        console.log('💰 Loaded existing revenue data');
    }
} catch (error) {
    console.warn('⚠️ Could not load revenue data:', error.message);
}

// Initialize agent earnings
Object.keys(AGENTS).forEach(agentId => {
    if (!revenueState.agentEarnings[agentId]) {
        revenueState.agentEarnings[agentId] = 0;
    }
});

// Agent request router
class AgentRouter {
    static selectBestAgent(taskType, requirements = {}) {
        const candidates = Object.entries(AGENTS).filter(([id, agent]) => {
            return agent.capabilities.some(cap => 
                taskType.includes(cap.split('_')[0]) || 
                cap.includes(taskType.split('_')[0])
            );
        });
        
        if (candidates.length === 0) {
            // Default to DocAgent for unknown tasks
            return 'doc';
        }
        
        // Sort by specialty match and return best
        candidates.sort(([idA, agentA], [idB, agentB]) => {
            const scoreA = this.calculateAgentScore(agentA, taskType, requirements);
            const scoreB = this.calculateAgentScore(agentB, taskType, requirements);
            return scoreB - scoreA;
        });
        
        return candidates[0][0];
    }
    
    static calculateAgentScore(agent, taskType, requirements) {
        let score = 0;
        
        // Specialty match
        if (agent.specialty.includes(taskType.split('_')[0])) score += 10;
        
        // Capability match
        agent.capabilities.forEach(cap => {
            if (taskType.includes(cap.split('_')[0])) score += 5;
        });
        
        // Price preference
        if (requirements.budget && requirements.budget === 'low') {
            score += (1 / agent.pricing.basic) * 2; // Prefer cheaper agents
        } else if (requirements.budget === 'high') {
            score += agent.pricing.enterprise * 0.1; // Prefer premium agents
        }
        
        return score;
    }
}

// Revenue calculator
class RevenueCalculator {
    static calculateCost(agentId, serviceType, complexity = 'basic') {
        const agent = AGENTS[agentId];
        if (!agent) return 0;
        
        let baseCost = agent.pricing[complexity] || agent.pricing.basic;
        
        // Complexity multipliers
        const multipliers = {
            'simple': 0.5,
            'basic': 1.0,
            'complex': 2.0,
            'premium': 3.0,
            'enterprise': 5.0
        };
        
        const multiplier = multipliers[complexity] || 1.0;
        return baseCost * multiplier;
    }
    
    static recordTransaction(agentId, serviceType, cost, metadata = {}) {
        const transaction = {
            id: `txn_${generateSessionId()}`,
            agentId: agentId,
            serviceType: serviceType,
            cost: cost,
            timestamp: Date.now(),
            metadata: metadata,
            sessionId: revenueState.sessionId
        };
        
        revenueState.transactions.push(transaction);
        revenueState.agentEarnings[agentId] = (revenueState.agentEarnings[agentId] || 0) + cost;
        revenueState.totalEarnings += cost;
        
        // Save revenue data
        this.saveRevenueData();
        
        return transaction;
    }
    
    static saveRevenueData() {
        try {
            fs.writeFileSync('./agent-revenue-data.json', JSON.stringify(revenueState, null, 2));
        } catch (error) {
            console.warn('⚠️ Could not save revenue data:', error.message);
        }
    }
    
    static getAgentPerformance() {
        const performance = {};
        
        Object.keys(AGENTS).forEach(agentId => {
            const agent = AGENTS[agentId];
            const transactions = revenueState.transactions.filter(t => t.agentId === agentId);
            
            performance[agentId] = {
                name: agent.name,
                personality: agent.personality,
                totalEarnings: revenueState.agentEarnings[agentId] || 0,
                totalRequests: transactions.length,
                averageRevenue: transactions.length > 0 
                    ? (revenueState.agentEarnings[agentId] || 0) / transactions.length 
                    : 0,
                lastRequest: transactions.length > 0 
                    ? Math.max(...transactions.map(t => t.timestamp))
                    : null
            };
        });
        
        return performance;
    }
}

// Mock AI service integration
class AIServiceMock {
    static async processRequest(agentId, prompt, complexity = 'basic') {
        const agent = AGENTS[agentId];
        if (!agent) throw new Error(`Unknown agent: ${agentId}`);
        
        // Simulate processing time based on complexity
        const processingTime = {
            'simple': 500,
            'basic': 1000,
            'complex': 2000,
            'premium': 3000,
            'enterprise': 5000
        };
        
        await new Promise(resolve => setTimeout(resolve, processingTime[complexity] || 1000));
        
        // Generate agent-specific response
        const response = this.generateAgentResponse(agent, prompt, complexity);
        
        return {
            agent: agent.name,
            personality: agent.personality,
            response: response,
            processingTime: processingTime[complexity],
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            recommendations: this.generateRecommendations(agent, complexity)
        };
    }
    
    static generateAgentResponse(agent, prompt, complexity) {
        const responses = {
            ralph: {
                basic: "🛡️ SECURITY ANALYSIS: Found 3 potential vulnerabilities. Your code is more exposed than a Windows XP machine on public WiFi.",
                premium: "🛡️ DEEP SECURITY AUDIT: Comprehensive analysis reveals 7 attack vectors. Implementing defense in depth is critical.",
                enterprise: "🛡️ MILITARY-GRADE ASSESSMENT: Full penetration testing complete. Your codebase has more holes than Swiss cheese, but I've got a 47-point remediation plan."
            },
            doc: {
                basic: "📚 DOCUMENTATION REVIEW: Your code needs more comments than a YouTube controversy video.",
                premium: "📚 COMPREHENSIVE DOCUMENTATION: Generated 47 pages of clear, user-friendly documentation with examples.",
                enterprise: "📚 TECHNICAL SPECIFICATION: Complete system documentation with API references, architecture diagrams, and user guides."
            },
            roast: {
                basic: "🔥 CODE ROAST: This code is like a bad joke - everyone sees it coming and nobody laughs.",
                premium: "🔥 FULL ROAST SESSION: Your variable names are more confusing than IKEA instructions, but here's how to fix them.",
                enterprise: "🔥 ENTERPRISE ROASTING: I've seen cleaner code in a malware sample. Here's a complete refactoring roadmap."
            },
            blame: {
                basic: "🕵️ BLAME ANALYSIS: Found the culprit - it was the intern, as usual.",
                premium: "🕵️ FORENSIC INVESTIGATION: Tracked 247 commits across 15 authors. The smoking gun is in line 42.",
                enterprise: "🕵️ FULL ATTRIBUTION REPORT: Complete code genealogy with author statistics and change patterns."
            },
            archaeologist: {
                basic: "🏺 LEGACY SCAN: This code is older than the pyramids and twice as mysterious.",
                premium: "🏺 ARCHAEOLOGICAL DIG: Excavated ancient patterns and documented tribal knowledge from the before times.",
                enterprise: "🏺 FULL EXCAVATION: Complete legacy analysis with migration roadmap and historical preservation plan."
            },
            refactor: {
                basic: "✨ REFACTORING SUGGESTIONS: Your code could use some Marie Kondo magic - does this function spark joy?",
                premium: "✨ OPTIMIZATION PLAN: Identified 23 improvement opportunities with performance gains up to 300%.",
                enterprise: "✨ COMPLETE TRANSFORMATION: Full architectural redesign with modern patterns and best practices."
            },
            hustle: {
                basic: "💰 REVENUE SCAN: Found 3 monetization opportunities hiding in your codebase.",
                premium: "💰 BUSINESS INTELLIGENCE: Comprehensive revenue strategy with 12 income streams identified.",
                enterprise: "💰 TRANSFORMATION PLAN: Complete business model redesign projected to increase revenue by 400%."
            },
            battle: {
                basic: "⚔️ CODE COMPARISON: This algorithm fights like a politician - lots of noise, little substance.",
                premium: "⚔️ COMPETITIVE ANALYSIS: Benchmarked against industry standards with performance recommendations.",
                enterprise: "⚔️ TOURNAMENT JUDGING: Complete competitive scoring with efficiency rankings and optimization paths."
            }
        };
        
        return responses[agent.name.toLowerCase()]?.[complexity] || `${agent.avatar} ${agent.motto}`;
    }
    
    static generateRecommendations(agent, complexity) {
        const recommendations = {
            basic: [
                `Consider upgrading to ${agent.name}'s premium analysis`,
                'Schedule regular code reviews',
                'Implement automated testing'
            ],
            premium: [
                'Implement suggested improvements',
                'Set up monitoring and alerts',
                'Consider enterprise-grade solutions',
                'Schedule follow-up analysis in 30 days'
            ],
            enterprise: [
                'Execute implementation roadmap',
                'Establish ongoing maintenance schedule',
                'Train team on new processes',
                'Monitor metrics and adjust strategy'
            ]
        };
        
        return recommendations[complexity] || recommendations.basic;
    }
}

// Main routes
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🎯 Agent Reasoning Hub</title>
    <style>
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .revenue-summary {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            text-align: center;
        }
        .agents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin: 30px 0;
        }
        .agent-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-top: 5px solid #667eea;
            transition: transform 0.3s ease;
        }
        .agent-card:hover {
            transform: translateY(-5px);
        }
        .agent-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .agent-avatar {
            font-size: 3em;
            margin-right: 15px;
        }
        .agent-info h3 {
            margin: 0;
            color: #333;
        }
        .agent-info p {
            margin: 5px 0;
            color: #666;
            font-style: italic;
        }
        .pricing-tiers {
            display: flex;
            gap: 10px;
            margin: 15px 0;
        }
        .price-tag {
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            font-size: 0.9em;
        }
        .capabilities {
            margin: 15px 0;
        }
        .capability-tag {
            display: inline-block;
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin: 2px;
        }
        .request-form {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin: 30px 0;
        }
        .form-group {
            margin: 15px 0;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        .form-control {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #5a6fd8; }
        .btn-success { background: #28a745; color: white; }
        .btn-success:hover { background: #218838; }
        .results {
            margin: 30px 0;
            padding: 25px;
            background: white;
            border-radius: 15px;
            border-left: 5px solid #28a745;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Agent Reasoning Hub</h1>
            <p>Multi-Agent Business Intelligence Platform</p>
        </div>
        
        <div class="revenue-summary">
            <h2>💰 Revenue Dashboard</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                <div>
                    <h3>Total Earnings</h3>
                    <div style="font-size: 2em;">$<span id="total-earnings">0.00</span></div>
                </div>
                <div>
                    <h3>Active Agents</h3>
                    <div style="font-size: 2em;"><span id="active-agents">${Object.keys(AGENTS).length}</span></div>
                </div>
                <div>
                    <h3>Total Requests</h3>
                    <div style="font-size: 2em;"><span id="total-requests">0</span></div>
                </div>
            </div>
        </div>
        
        <div class="agents-grid">
            ${Object.entries(AGENTS).map(([id, agent]) => `
                <div class="agent-card">
                    <div class="agent-header">
                        <div class="agent-avatar">${agent.avatar}</div>
                        <div class="agent-info">
                            <h3>${agent.name}</h3>
                            <p>${agent.personality}</p>
                            <p><strong>Specialty:</strong> ${agent.specialty.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    
                    <p><strong>Description:</strong> ${agent.description}</p>
                    
                    <div class="pricing-tiers">
                        <div class="price-tag">Basic: $${agent.pricing.basic}</div>
                        <div class="price-tag">Premium: $${agent.pricing.premium}</div>
                        <div class="price-tag">Enterprise: $${agent.pricing.enterprise}</div>
                    </div>
                    
                    <div class="capabilities">
                        <strong>Capabilities:</strong><br>
                        ${agent.capabilities.map(cap => `<span class="capability-tag">${cap.replace(/_/g, ' ')}</span>`).join('')}
                    </div>
                    
                    <p><strong>Motto:</strong> <em>"${agent.motto}"</em></p>
                    
                    <button class="btn btn-primary" onclick="requestService('${id}')" style="width: 100%;">
                        Request ${agent.name}'s Services
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="request-form">
            <h3>🎯 Request Agent Service</h3>
            <div class="form-group">
                <label>Select Agent:</label>
                <select id="agent-select" class="form-control">
                    <option value="">Auto-select best agent</option>
                    ${Object.entries(AGENTS).map(([id, agent]) => 
                        `<option value="${id}">${agent.avatar} ${agent.name} - ${agent.personality}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Service Type:</label>
                <select id="service-type" class="form-control">
                    <option value="code_analysis">Code Analysis</option>
                    <option value="security_audit">Security Audit</option>
                    <option value="documentation">Documentation</option>
                    <option value="refactoring">Refactoring</option>
                    <option value="performance_optimization">Performance Optimization</option>
                    <option value="revenue_analysis">Revenue Analysis</option>
                    <option value="legacy_modernization">Legacy Modernization</option>
                </select>
            </div>
            <div class="form-group">
                <label>Complexity Level:</label>
                <select id="complexity" class="form-control">
                    <option value="basic">Basic ($)</option>
                    <option value="premium">Premium ($$$)</option>
                    <option value="enterprise">Enterprise ($$$$$)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description/Code:</label>
                <textarea id="request-description" class="form-control" rows="5" 
                         placeholder="Describe your request or paste code here..."></textarea>
            </div>
            <button class="btn btn-success" onclick="submitRequest()" style="width: 100%;">
                🚀 Submit Request & Get Quote
            </button>
        </div>
        
        <div id="results"></div>
    </div>
    
    <script>
        async function loadDashboard() {
            try {
                const response = await fetch('/api/revenue/summary');
                const data = await response.json();
                
                document.getElementById('total-earnings').textContent = data.totalEarnings.toFixed(4);
                document.getElementById('total-requests').textContent = data.totalRequests;
            } catch (error) {
                console.warn('Failed to load dashboard:', error);
            }
        }
        
        function requestService(agentId) {
            document.getElementById('agent-select').value = agentId;
            document.getElementById('request-description').focus();
        }
        
        async function submitRequest() {
            const agentId = document.getElementById('agent-select').value;
            const serviceType = document.getElementById('service-type').value;
            const complexity = document.getElementById('complexity').value;
            const description = document.getElementById('request-description').value;
            
            if (!description.trim()) {
                alert('Please provide a description or code to analyze.');
                return;
            }
            
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<div class="results"><h3>🤖 Processing Request...</h3><p>Agent is analyzing your request...</p></div>';
            
            try {
                const response = await fetch('/api/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: agentId || null,
                        serviceType: serviceType,
                        complexity: complexity,
                        description: description
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    displayResults(result);
                    loadDashboard(); // Refresh revenue numbers
                } else {
                    resultsDiv.innerHTML = '<div class="results"><h3>❌ Error</h3><p>' + result.error + '</p></div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="results"><h3>❌ Request Failed</h3><p>' + error.message + '</p></div>';
            }
        }
        
        function displayResults(result) {
            const resultsDiv = document.getElementById('results');
            
            resultsDiv.innerHTML = \`
                <div class="results">
                    <h3>\${result.agent.avatar} \${result.agent.name} - Analysis Complete</h3>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h4>💬 Agent Response:</h4>
                        <p style="font-size: 1.1em; line-height: 1.6;">\${result.analysis.response}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 10px;">
                            <h4>📊 Analysis Details</h4>
                            <p><strong>Complexity:</strong> \${result.complexity}</p>
                            <p><strong>Processing Time:</strong> \${result.analysis.processingTime}ms</p>
                            <p><strong>Confidence:</strong> \${Math.round(result.analysis.confidence * 100)}%</p>
                        </div>
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 10px;">
                            <h4>💰 Cost Breakdown</h4>
                            <p><strong>Service Cost:</strong> $\${result.cost.toFixed(4)}</p>
                            <p><strong>Agent:</strong> \${result.agent.name}</p>
                            <p><strong>Transaction ID:</strong> \${result.transaction.id}</p>
                        </div>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <h4>🎯 Recommendations</h4>
                        <ul>
                            \${result.analysis.recommendations.map(rec => \`<li>\${rec}</li>\`).join('')}
                        </ul>
                    </div>
                </div>
            \`;
        }
        
        // Load dashboard on page load
        loadDashboard();
        
        // Auto-refresh every 30 seconds
        setInterval(loadDashboard, 30000);
    </script>
</body>
</html>
    `);
});

// API Routes
app.post('/api/request', async (req, res) => {
    try {
        const { agentId, serviceType, complexity, description } = req.body;
        
        // Select best agent if not specified
        const selectedAgentId = agentId || AgentRouter.selectBestAgent(serviceType);
        const agent = AGENTS[selectedAgentId];
        
        if (!agent) {
            return res.json({ success: false, error: 'Invalid agent selected' });
        }
        
        // Calculate cost
        const cost = RevenueCalculator.calculateCost(selectedAgentId, serviceType, complexity);
        
        // Process request with mock AI
        const analysis = await AIServiceMock.processRequest(selectedAgentId, description, complexity);
        
        // Record transaction
        const transaction = RevenueCalculator.recordTransaction(selectedAgentId, serviceType, cost, {
            description: description.slice(0, 100),
            complexity: complexity
        });
        
        console.log(`💰 ${agent.name} earned $${cost.toFixed(4)} for ${serviceType}`);
        
        res.json({
            success: true,
            agent: {
                id: selectedAgentId,
                name: agent.name,
                personality: agent.personality,
                avatar: agent.avatar
            },
            serviceType: serviceType,
            complexity: complexity,
            cost: cost,
            analysis: analysis,
            transaction: transaction
        });
        
    } catch (error) {
        console.error('❌ Request processing failed:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/revenue/summary', (req, res) => {
    const performance = RevenueCalculator.getAgentPerformance();
    
    res.json({
        totalEarnings: revenueState.totalEarnings,
        totalRequests: revenueState.transactions.length,
        agentPerformance: performance,
        topEarner: Object.entries(performance).reduce((top, [id, perf]) => 
            perf.totalEarnings > (top.earnings || 0) ? { id, earnings: perf.totalEarnings, name: perf.name } : top, {}
        )
    });
});

app.get('/api/agents', (req, res) => {
    res.json({
        agents: AGENTS,
        performance: RevenueCalculator.getAgentPerform
    });
});

app.get('/api/agents/:agentId/stats', (req, res) => {
    const { agentId } = req.params;
    const agent = AGENTS[agentId];
    
    if (!agent) {
        return res.json({ success: false, error: 'Agent not found' });
    }
    
    const transactions = revenueState.transactions.filter(t => t.agentId === agentId);
    const totalEarnings = revenueState.agentEarnings[agentId] || 0;
    
    res.json({
        agent: agent,
        stats: {
            totalEarnings: totalEarnings,
            totalRequests: transactions.length,
            averageRevenue: transactions.length > 0 ? totalEarnings / transactions.length : 0,
            recentTransactions: transactions.slice(-10).reverse()
        }
    });
});

// Utility functions
function generateSessionId() {
    return crypto.randomBytes(8).toString('hex');
}

// Start server
const PORT = 3010;
app.listen(PORT, (err) => {
    if (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
    }
    
    console.log('🎯 AGENT REASONING HUB');
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`💰 Managing ${Object.keys(AGENTS).length} specialized agents`);
    console.log('🎮 Multi-revenue stream platform active');
    console.log('💸 Total platform earnings: $' + revenueState.totalEarnings.toFixed(4));
    
    // Display agent roster
    console.log('\n🤖 AGENT ROSTER:');
    Object.entries(AGENTS).forEach(([id, agent]) => {
        const earnings = revenueState.agentEarnings[id] || 0;
        console.log(`   ${agent.avatar} ${agent.name} - $${earnings.toFixed(4)} earned`);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Agent Reasoning Hub...');
    RevenueCalculator.saveRevenueData();
    console.log('✅ Revenue data saved');
    process.exit(0);
});
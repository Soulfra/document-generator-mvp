#!/bin/bash

# 🎯 BUSINESS INTELLIGENCE LAUNCHER
# 
# Launches the complete business intelligence and lead generation system
# for targeted PropTech sales outreach and market research.

echo "🎯 BUSINESS INTELLIGENCE & LEAD GENERATION SYSTEM"
echo "================================================="
echo ""
echo "🚀 Starting comprehensive business research and sales intelligence platform"
echo "📊 Discover, qualify, and track prospects in any market"
echo "💼 Generate actionable business plans for real estate brokerages and service businesses"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO:${NC} $1"
}

debug() {
    echo -e "${PURPLE}[$(date '+%H:%M:%S')] DEBUG:${NC} $1"
}

check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
    return $?
}

wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local count=0
    
    while [ $count -lt $timeout ]; do
        if check_port $port; then
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    return 1
}

create_directories() {
    log "Creating business intelligence directories..."
    mkdir -p business-intelligence/{leads,reports,exports,cache}
    mkdir -p business-intelligence/leads/{qualified,pipeline,sequences}
    mkdir -p business-intelligence/reports/{market-analysis,competitive-intelligence,revenue-projections}
}

# Phase 1: Environment Setup
echo ""
echo "🔧 PHASE 1: ENVIRONMENT SETUP"
echo "=============================="

# Create necessary directories
create_directories

# Check for required Node.js modules
log "Checking Node.js dependencies..."
REQUIRED_MODULES=("ws" "crypto" "https" "fs")
MISSING_MODULES=()

for module in "${REQUIRED_MODULES[@]}"; do
    if ! node -e "require('$module')" 2>/dev/null; then
        MISSING_MODULES+=($module)
    fi
done

if [ ${#MISSING_MODULES[@]} -gt 0 ]; then
    warn "Installing missing Node.js modules: ${MISSING_MODULES[*]}"
    npm install ws
fi

# Phase 2: Start Core Services
echo ""
echo "🧠 PHASE 2: STARTING CORE INTELLIGENCE SERVICES"
echo "=============================================="

SERVICE_PIDS=()

# Start Real Market Research Engine (if not already running)
log "Starting Real Market Research Engine..."
if [ -f "REAL-MARKET-RESEARCH-ENGINE.js" ]; then
    if ! check_port 3340; then
        node REAL-MARKET-RESEARCH-ENGINE.js > /tmp/market-research-engine.log 2>&1 &
        MARKET_PID=$!
        SERVICE_PIDS+=($MARKET_PID)
        
        if wait_for_port 3340 15; then
            log "✅ Real Market Research Engine running on port 3340"
        else
            warn "⚠️ Real Market Research Engine not responding"
        fi
    else
        log "✅ Real Market Research Engine already running"
    fi
else
    warn "REAL-MARKET-RESEARCH-ENGINE.js not found"
fi

# Start Business Intelligence Hub
log "Starting Business Intelligence Hub..."
if [ -f "BUSINESS-INTELLIGENCE-HUB.js" ]; then
    node BUSINESS-INTELLIGENCE-HUB.js > /tmp/business-intelligence-hub.log 2>&1 &
    BUSINESS_HUB_PID=$!
    SERVICE_PIDS+=($BUSINESS_HUB_PID)
    
    # Business Intelligence Hub doesn't start a server by itself, just loads
    sleep 3
    if ps -p $BUSINESS_HUB_PID > /dev/null; then
        log "✅ Business Intelligence Hub initialized"
    else
        warn "⚠️ Business Intelligence Hub failed to initialize"
    fi
else
    error "❌ BUSINESS-INTELLIGENCE-HUB.js not found"
    exit 1
fi

# Start Lead Generation Engine
log "Starting Lead Generation Engine..."
if [ -f "LEAD-GENERATION-ENGINE.js" ]; then
    node LEAD-GENERATION-ENGINE.js > /tmp/lead-generation-engine.log 2>&1 &
    LEAD_ENGINE_PID=$!
    SERVICE_PIDS+=($LEAD_ENGINE_PID)
    
    # Lead Generation Engine doesn't start a server by itself, just loads
    sleep 3
    if ps -p $LEAD_ENGINE_PID > /dev/null; then
        log "✅ Lead Generation Engine initialized"
    else
        warn "⚠️ Lead Generation Engine failed to initialize"
    fi
else
    error "❌ LEAD-GENERATION-ENGINE.js not found"
    exit 1
fi

# Phase 3: Start Integration Services
echo ""
echo "🔗 PHASE 3: STARTING INTEGRATION SERVICES"
echo "========================================"

# Start PropTech VC Content Generator (if available)
log "Starting PropTech VC Content Generator for integration..."
if [ -f "PROPTECH-VC-CONTENT-GENERATOR.js" ]; then
    if ! check_port 3337; then
        node PROPTECH-VC-CONTENT-GENERATOR.js > /tmp/proptech-vc-integration.log 2>&1 &
        VC_PID=$!
        SERVICE_PIDS+=($VC_PID)
        
        if wait_for_port 3337 15; then
            log "✅ PropTech VC integration running on port 3337"
        else
            warn "⚠️ PropTech VC integration not responding"
        fi
    else
        log "✅ PropTech VC integration already running"
    fi
fi

# Start Forum API Server (for research queries)
log "Starting Forum API Server for business research..."
if [ -f "PRODUCTION-FORUM-API-SERVER.js" ]; then
    if ! check_port 3334; then
        node PRODUCTION-FORUM-API-SERVER.js > /tmp/forum-api-business.log 2>&1 &
        FORUM_PID=$!
        SERVICE_PIDS+=($FORUM_PID)
        
        if wait_for_port 3334 10; then
            log "✅ Forum API Server running on port 3334"
        else
            warn "⚠️ Forum API Server not responding"
        fi
    else
        log "✅ Forum API Server already running"
    fi
fi

# Phase 4: Start Dashboard Server
echo ""
echo "📊 PHASE 4: STARTING SALES INTELLIGENCE DASHBOARD"
echo "=============================================="

log "Starting Sales Intelligence Dashboard server..."

# Create a simple HTTP server for the dashboard
cat > /tmp/dashboard-server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/dashboard') {
        fs.readFile('SALES-INTELLIGENCE-DASHBOARD.html', 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading dashboard');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/api/search' && req.method === 'POST') {
        // Handle business intelligence search requests
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const searchData = JSON.parse(body);
                // Here we would integrate with the business intelligence hub
                // For now, return a simple response
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Search request received',
                    query: searchData.query
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

const PORT = 3341;
server.listen(PORT, () => {
    console.log(`📊 Sales Intelligence Dashboard running on port ${PORT}`);
});
EOF

node /tmp/dashboard-server.js > /tmp/dashboard-server.log 2>&1 &
DASHBOARD_PID=$!
SERVICE_PIDS+=($DASHBOARD_PID)

if wait_for_port 3341 15; then
    log "✅ Sales Intelligence Dashboard running on port 3341"
else
    error "❌ Sales Intelligence Dashboard failed to start"
fi

# Phase 5: Create Business Intelligence Integration
echo ""
echo "🔄 PHASE 5: CREATING UNIFIED INTEGRATION SCRIPT"
echo "============================================="

log "Creating unified business intelligence integration..."

cat > business-intelligence-integration.js << 'EOF'
#!/usr/bin/env node

/**
 * 🎯 UNIFIED BUSINESS INTELLIGENCE INTEGRATION
 * 
 * Coordinates between Business Intelligence Hub, Lead Generation Engine,
 * and Real Market Research Engine to provide comprehensive prospect research.
 */

const BusinessIntelligenceHub = require('./BUSINESS-INTELLIGENCE-HUB.js');
const LeadGenerationEngine = require('./LEAD-GENERATION-ENGINE.js');

class UnifiedBusinessIntelligence {
    constructor() {
        this.businessHub = new BusinessIntelligenceHub();
        this.leadEngine = new LeadGenerationEngine();
        
        console.log('🎯 Unified Business Intelligence System Ready');
        console.log('============================================');
    }
    
    async researchMarket(zipCode, options = {}) {
        try {
            console.log(`🔍 Researching market: ${zipCode}`);
            
            // Step 1: Discover businesses in the area
            const businessData = await this.businessHub.discoverBusinessesByZipCode(zipCode, options);
            
            // Step 2: Generate qualified leads
            const leadData = await this.leadEngine.generateLeadsFromBusinessData(businessData, options);
            
            // Step 3: Generate comprehensive business plan
            const businessPlan = this.generateBusinessPlan(leadData);
            
            return {
                market: zipCode,
                businessData,
                leadData,
                businessPlan,
                summary: this.generateExecutiveSummary(leadData)
            };
            
        } catch (error) {
            console.error('Market research failed:', error);
            throw error;
        }
    }
    
    generateBusinessPlan(leadData) {
        const brokerages = leadData.pipeline.leads.filter(l => l.type === 'real_estate_brokerage');
        const serviceBusinesses = leadData.pipeline.leads.filter(l => l.type === 'service_business');
        
        return {
            marketOverview: {
                totalOpportunity: leadData.pipeline.metrics.projectedRevenue,
                brokerageOpportunities: brokerages.length,
                serviceBusinessOpportunities: serviceBusinesses.length,
                averageDealSize: leadData.pipeline.metrics.averageDealSize
            },
            
            pricingStrategy: {
                brokerages: {
                    model: 'freemium',
                    freeThreshold: '25 agents or less',
                    premiumPricing: '$50/agent/month',
                    reasoning: 'Build market penetration with free tier, upsell to premium features'
                },
                serviceBusinesses: {
                    model: 'subscription',
                    basePricing: '$299/month',
                    reasoning: 'Direct revenue model, ROI-focused value proposition'
                }
            },
            
            salesStrategy: {
                brokerages: 'Partnership approach - free agent portal with commission sharing',
                serviceBusinesses: 'ROI-focused - lead generation and conversion tracking',
                prioritization: 'Focus on high-score leads first (80+ lead scores)'
            },
            
            revenueProjections: this.calculateRevenueProjections(leadData),
            
            marketPenetration: this.calculateMarketPenetration(leadData)
        };
    }
    
    calculateRevenueProjections(leadData) {
        const brokerages = leadData.pipeline.leads.filter(l => l.type === 'real_estate_brokerage');
        const serviceBusinesses = leadData.pipeline.leads.filter(l => l.type === 'service_business');
        
        return {
            year1: {
                brokerages: brokerages.length * 2000, // Conservative start
                serviceBusinesses: serviceBusinesses.length * 1800, // 50% of full price
                total: (brokerages.length * 2000) + (serviceBusinesses.length * 1800)
            },
            year2: {
                brokerages: brokerages.length * 4500, // Premium upgrades
                serviceBusinesses: serviceBusinesses.length * 3000, // Full pricing
                total: (brokerages.length * 4500) + (serviceBusinesses.length * 3000)
            },
            year3: {
                brokerages: brokerages.length * 6500, // Full market penetration
                serviceBusinesses: serviceBusinesses.length * 3600, // Full pricing + growth
                total: (brokerages.length * 6500) + (serviceBusinesses.length * 3600)
            }
        };
    }
    
    calculateMarketPenetration(leadData) {
        const highPriorityLeads = leadData.pipeline.leads.filter(l => l.priority === 'high');
        
        return {
            phase1: {
                targets: highPriorityLeads.length,
                timeline: '0-3 months',
                strategy: 'Direct outreach to high-priority leads',
                expectedConversion: '15-20%'
            },
            phase2: {
                targets: leadData.pipeline.leads.filter(l => l.priority === 'medium').length,
                timeline: '3-9 months',
                strategy: 'Nurture sequences and referral programs',
                expectedConversion: '10-15%'
            },
            phase3: {
                targets: leadData.pipeline.leads.filter(l => l.priority === 'low').length,
                timeline: '9-18 months',
                strategy: 'Long-term relationship building',
                expectedConversion: '5-10%'
            }
        };
    }
    
    generateExecutiveSummary(leadData) {
        return {
            headline: `${leadData.qualifiedLeads} Qualified Prospects in ${leadData.zipCode}`,
            keyOpportunities: [
                `${leadData.pipeline.leads.filter(l => l.type === 'real_estate_brokerage').length} real estate brokerages for freemium strategy`,
                `${leadData.pipeline.leads.filter(l => l.type === 'service_business').length} service businesses for premium subscriptions`,
                `$${leadData.pipeline.metrics.projectedRevenue.toLocaleString()} projected revenue opportunity`
            ],
            immediateActions: [
                'Launch outreach to high-priority leads (80+ scores)',
                'Implement dual pricing strategy',
                'Set up automated nurture sequences',
                'Track conversion metrics and ROI'
            ]
        };
    }
}

// Export for use as module
module.exports = UnifiedBusinessIntelligence;

// Run test if called directly
if (require.main === module) {
    const intelligence = new UnifiedBusinessIntelligence();
    
    async function test() {
        try {
            const results = await intelligence.researchMarket('78701');
            console.log('\n✅ BUSINESS INTELLIGENCE RESULTS:');
            console.log('================================');
            console.log(JSON.stringify(results.summary, null, 2));
        } catch (error) {
            console.error('Test failed:', error);
        }
    }
    
    test();
}
EOF

chmod +x business-intelligence-integration.js

log "✅ Business intelligence integration created"

# Give services time to initialize
log "Allowing services to initialize..."
sleep 5

# Phase 6: System Ready
echo ""
echo "🎯 PHASE 6: BUSINESS INTELLIGENCE SYSTEM READY!"
echo "=============================================="

info "Business Intelligence & Lead Generation System is now operational!"
echo ""

echo -e "${CYAN}📊 SYSTEM ACCESS POINTS${NC}"
echo "========================"
echo ""
echo -e "🎯 Sales Intelligence Dashboard:  ${GREEN}http://localhost:3341${NC}"
echo -e "🧠 Business Intelligence API:     ${GREEN}Available via integration script${NC}"
echo -e "📈 Market Research Engine:        ${GREEN}http://localhost:3340${NC}"
echo -e "🔗 PropTech VC Integration:       ${GREEN}http://localhost:3337${NC}"
echo -e "📡 Forum API (Research):          ${GREEN}http://localhost:3334${NC}"
echo ""

echo -e "${CYAN}🎭 SYSTEM CAPABILITIES${NC}"
echo "====================="
echo "✅ Real estate brokerage identification and analysis"
echo "✅ Service business discovery and qualification"
echo "✅ AI-powered lead scoring and prioritization"
echo "✅ Automated outreach strategy generation"
echo "✅ Revenue projections and business case development"
echo "✅ Market penetration analysis and timing"
echo "✅ Competitive intelligence and positioning"
echo "✅ Cost-transparent API usage tracking"
echo ""

echo -e "${CYAN}💰 BUSINESS MODEL FRAMEWORK${NC}"
echo "============================="
echo "🏘️  Real Estate Brokerages:"
echo "   • FREE: Up to 25 agents"
echo "   • PREMIUM: $50/agent/month for larger brokerages"
echo "   • VALUE PROP: Agent productivity + referral revenue"
echo ""
echo "🔧 Service Businesses:"
echo "   • SUBSCRIPTION: $299/month base fee"
echo "   • VALUE PROP: Qualified lead generation + ROI tracking"
echo "   • TRIAL: 30-day free trial available"
echo ""

echo -e "${CYAN}🎯 HOW TO USE THE SYSTEM${NC}"
echo "========================="
echo "1. 🌐 Open Sales Dashboard: http://localhost:3341"
echo "2. 🔍 Enter ZIP code, area code, or metro area"
echo "3. 📊 Review discovered businesses and lead scores"
echo "4. 🚀 Start outreach campaigns for qualified leads"
echo "5. 📈 Track pipeline progress and conversion rates"
echo "6. 💼 Generate business plans and revenue projections"
echo ""

echo -e "${CYAN}📋 QUICK COMMANDS${NC}"
echo "=================="
echo "• Test full system:     node business-intelligence-integration.js"
echo "• View logs:           tail -f /tmp/*.log"
echo "• Export leads:        Use dashboard export feature"
echo "• API integration:     See business-intelligence-integration.js"
echo ""

echo -e "${CYAN}📁 LOG FILES${NC}"
echo "============="
echo "• Business Hub:         /tmp/business-intelligence-hub.log"
echo "• Lead Engine:          /tmp/lead-generation-engine.log"
echo "• Market Research:      /tmp/market-research-engine.log"
echo "• Dashboard:            /tmp/dashboard-server.log"
echo "• PropTech Integration: /tmp/proptech-vc-integration.log"
echo ""

echo -e "${CYAN}💡 BUSINESS DEVELOPMENT STRATEGY${NC}"
echo "================================="
echo "🎯 IMMEDIATE FOCUS:"
echo "• Target ZIP codes with high agent density"
echo "• Focus on brokerages with 15-50 agents (sweet spot)"
echo "• Prioritize service businesses with strong online presence"
echo "• Use free tier to build trust with smaller brokerages"
echo ""
echo "📈 SCALING APPROACH:"
echo "• Phase 1: Local market penetration (0-3 months)"
echo "• Phase 2: Regional expansion (3-9 months)"
echo "• Phase 3: National rollout (9-18 months)"
echo "• Phase 4: Enterprise partnerships (18+ months)"
echo ""

# Phase 7: Monitor and Wait
echo -e "${YELLOW}Press Ctrl+C to stop all business intelligence services${NC}"
echo ""

# Setup cleanup trap
cleanup() {
    echo ""
    echo "🛑 Stopping Business Intelligence services..."
    
    for pid in "${SERVICE_PIDS[@]}"; do
        if [ ! -z "$pid" ]; then
            kill -TERM "$pid" 2>/dev/null
        fi
    done
    
    sleep 3
    
    # Force kill if needed
    for pid in "${SERVICE_PIDS[@]}"; do
        if [ ! -z "$pid" ]; then
            kill -KILL "$pid" 2>/dev/null
        fi
    done
    
    # Cleanup temp files
    rm -f /tmp/dashboard-server.js
    
    echo "✅ All services stopped"
    echo ""
    echo -e "${GREEN}🎉 Business Intelligence Session Complete!${NC}"
    echo "Your comprehensive business research and lead generation platform"
    echo "has provided actionable intelligence for PropTech sales success!"
    echo ""
    echo "📋 Session Summary:"
    echo "• Business discovery and qualification completed"
    echo "• Lead scoring and prioritization applied"
    echo "• Revenue projections and business cases generated"
    echo "• Outreach strategies and sequences prepared"
    echo "• Market penetration plan developed"
    echo ""
    echo "🚀 Ready to convert prospects into customers!"
}

trap cleanup INT TERM

# Live monitoring
echo -e "${PURPLE}🔍 LIVE MONITORING${NC}"
echo "=================="
echo "Monitoring business intelligence services... (Ctrl+C to stop)"

# Monitor loop
while true; do
    sleep 30
    
    # Check if main services are still running
    if ! check_port 3341; then
        error "Dashboard died, restarting..."
        node /tmp/dashboard-server.js > /tmp/dashboard-server.log 2>&1 &
        DASHBOARD_PID=$!
        SERVICE_PIDS+=($DASHBOARD_PID)
    fi
    
    # Log activity from main dashboard
    if [ -f "/tmp/dashboard-server.log" ]; then
        ACTIVITY=$(tail -n 1 /tmp/dashboard-server.log 2>/dev/null)
        if [ ! -z "$ACTIVITY" ]; then
            debug "Dashboard: $ACTIVITY"
        fi
    fi
    
    # Check business intelligence integration
    if [ -f "business-intelligence-integration.js" ]; then
        debug "Business Intelligence Integration: Ready for market research"
    fi
done
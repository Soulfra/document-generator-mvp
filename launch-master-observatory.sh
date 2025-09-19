#!/bin/bash

# 🌐🧠 MASTER AI AGENT OBSERVATORY LAUNCHER
# ========================================
# Watch ALL your AI agents reasoning with each other
# Groups of 4, bosses, specialists, hierarchies - everything unified

set -e

echo "🌐🧠 MASTER AI AGENT OBSERVATORY LAUNCHER"
echo "========================================"
echo ""
echo "👁️ WATCH: All 52 AI agents reasoning together"
echo "🏢 OBSERVE: Executive → Management → Specialist → Worker hierarchy"
echo "💬 MONITOR: Real-time conversations and decision flows"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js to continue."
    exit 1
fi
echo "   ✅ Node.js available"

# Check WebSocket module
if node -e "require('ws')" 2>/dev/null; then
    echo "   ✅ WebSocket module available"
else
    echo "   📦 Installing WebSocket module..."
    npm install ws
    if [[ $? -eq 0 ]]; then
        echo "   ✅ WebSocket module installed"
    else
        echo "   ❌ Failed to install WebSocket module"
        exit 1
    fi
fi

# Check for observatory file
if [[ ! -f "master-ai-agent-observatory.js" ]]; then
    echo "❌ master-ai-agent-observatory.js not found!"
    exit 1
fi
echo "   ✅ Master AI Observatory system found"

echo ""

# Create observatory directories
echo "🏗️ Setting up AI observatory infrastructure..."
mkdir -p .master-ai-observatory/logs
mkdir -p .master-ai-observatory/agents
mkdir -p .master-ai-observatory/conversations
mkdir -p .master-ai-observatory/decisions
echo "   ✅ Observatory infrastructure ready"

echo ""
echo "🚀 LAUNCHING MASTER AI OBSERVATORY..."

# Start the master observatory
nohup node master-ai-agent-observatory.js > .master-ai-observatory/logs/observatory.log 2>&1 &
OBSERVATORY_PID=$!
echo $OBSERVATORY_PID > .master-ai-observatory/logs/observatory.pid

echo "   🌐 Master observatory started (PID: $OBSERVATORY_PID)"
echo "   🧠 Initializing 52 AI agents across 4 hierarchy levels..."
echo "   ⏳ Waiting for agent reasoning systems to come online..."

# Wait for observatory to be ready
max_attempts=20
attempt=1
observatory_ready=false

while [[ $attempt -le $max_attempts ]]; do
    if lsof -i :9200 > /dev/null 2>&1 && lsof -i :9201 > /dev/null 2>&1; then
        echo "   🧠 AI agents online and reasoning (ports 9200/9201)"
        observatory_ready=true
        break
    else
        echo "   ⏳ Attempt $attempt/$max_attempts - initializing agent networks..."
        sleep 3
        ((attempt++))
    fi
done

if [[ "$observatory_ready" != true ]]; then
    echo "   ⚠️  Observatory may still be initializing agents..."
fi

echo ""
echo "🌐 Opening Master AI Observatory interface..."

# Function to open browser
open_browser() {
    local url=$1
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$url" || sensible-browser "$url" || firefox "$url"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        start "$url"
    else
        echo "   ⚠️  Could not auto-open browser. Please manually open: $url"
    fi
}

# Open the master observatory
sleep 3
open_browser "http://localhost:9200"

echo ""
echo "🎉 MASTER AI AGENT OBSERVATORY IS ACTIVE!"
echo "========================================="
echo ""
echo "🌐 OBSERVATORY INTERFACE"
echo "========================"
echo "Observatory URL:       http://localhost:9200"
echo "Agent Communications:  ws://localhost:9201"
echo "Observatory Logs:      tail -f .master-ai-observatory/logs/observatory.log"
echo ""
echo "🏢 AI AGENT HIERARCHY (52 Total Agents)"
echo "======================================="
echo "🔴 LEVEL 1 - Executive Council (4 agents):"
echo "   • CEO Agent: Strategic vision and leadership"
echo "   • CTO Agent: Technology strategy and architecture"  
echo "   • Strategy Agent: Long-term planning and goals"
echo "   • Oversight Agent: Quality control and governance"
echo ""
echo "🟠 LEVEL 2 - Department Heads (16 agents, 4 departments × 4 each):"
echo "   🏗️ Construction Dept: architect, engineer, designer, qa"
echo "   🔍 Intelligence Dept: analyst, researcher, data, insight"
echo "   ⚙️ Operations Dept: logistics, resource, scheduler, coordinator"
echo "   🛡️ Security Dept: guardian, monitor, crypto, audit"
echo ""
echo "🔵 LEVEL 3 - Specialist Teams (16 agents, 4 teams × 4 each):"
echo "   🤖 AI Researchers: llm, neural, training, eval"
echo "   🏗️ System Builders: docker, network, storage, deploy"
echo "   🎨 Content Creators: writer, artist, video, social"
echo "   📊 Data Processors: parser, cleaner, validator, transformer"
echo ""
echo "🟢 LEVEL 4 - Worker Pods (16 agents, 4 pods × 4 each):"
echo "   ⚡ Execution Pod Alpha: worker-a1, worker-a2, worker-a3, worker-a4"
echo "   ⚡ Execution Pod Beta: worker-b1, worker-b2, worker-b3, worker-b4"
echo "   ⚡ Execution Pod Gamma: worker-c1, worker-c2, worker-c3, worker-c4"
echo "   ⚡ Execution Pod Delta: worker-d1, worker-d2, worker-d3, worker-d4"
echo ""
echo "💬 REASONING PATTERNS YOU'LL OBSERVE"
echo "==================================="
echo "🔥 Debates: Agents argue different approaches (2-4 participants)"
echo "💡 Consultations: Expert agents provide advice (1 requester + experts)"
echo "📋 Delegations: Bosses assign work to workers (1 boss + 4 workers)"
echo "🤝 Collaborations: Peer agents work together (2-4 peers)"
echo "⬆️ Escalations: Problems go up the hierarchy (worker → manager → exec)"
echo "🌊 Swarm Intelligence: All agents contribute to decisions (entire hierarchy)"
echo ""
echo "🎯 AGENT STATES AND BEHAVIORS"
echo "============================"
echo "Agent States (color-coded in interface):"
echo "   🟠 THINKING: Agent analyzing and processing"
echo "   🔵 DISCUSSING: Participating in conversations"
echo "   🔴 DECIDING: Making decisions"
echo "   🟢 EXECUTING: Taking actions"
echo "   ⚪ WAITING: Available for new tasks"
echo "   🟩 COMPLETED: Finished current task"
echo ""
echo "Reasoning Cycles:"
echo "   • Main reasoning cycle: Every 3 seconds"
echo "   • Cross-hierarchy conversations: Every 10 seconds"
echo "   • Decision processing: Every 15 seconds"
echo "   • Follow-up task generation: Based on decisions"
echo ""
echo "👁️ WHAT YOU'LL WATCH IN REAL-TIME"
echo "================================="
echo "🌐 Main Visualization (Left Panel):"
echo "   • Concentric circles showing hierarchy levels"
echo "   • Agent dots colored by current state"
echo "   • Connection lines showing active conversations"
echo "   • Glowing effects for agents deep in thought"
echo ""
echo "📊 Sidebar Information (Right Panel):"
echo "   • Agent hierarchy with real-time states"
echo "   • Active conversations with message threads"
echo "   • Recent decisions and their impacts"
echo "   • Agent state distribution statistics"
echo ""
echo "💬 Live Conversation Examples:"
echo "   CEO Agent: \"I think we should consider resource optimization from a strategic perspective.\""
echo "   Engineer Agent: \"That's valid, but what about scalability constraints?\""
echo "   Worker A1: \"From my experience with deployment, I'd suggest a phased approach.\""
echo ""
echo "🎯 Decision Flow Examples:"
echo "   • Executive Council debates resource allocation"
echo "   • Construction team collaborates on architecture"
echo "   • Worker pods coordinate on task execution"
echo "   • Cross-functional teams consult specialists"
echo ""
echo "🔄 AGENT INTERACTION PATTERNS"
echo "============================"
echo "Hierarchical Communications:"
echo "   • Executives set strategic direction"
echo "   • Managers coordinate departmental work"
echo "   • Specialists provide expert consultation"
echo "   • Workers execute tasks and report progress"
echo ""
echo "Cross-Functional Collaborations:"
echo "   • AI researchers consult system builders"
echo "   • Content creators work with data processors"
echo "   • Security team audits all departments"
echo "   • Operations coordinates resource allocation"
echo ""
echo "Decision Escalation Flows:"
echo "   • Worker encounters complex problem"
echo "   • Escalates to department head"
echo "   • Manager consults specialists if needed"
echo "   • Executive makes final strategic decision"
echo ""
echo "🧠 COLLECTIVE INTELLIGENCE FEATURES"
echo "==================================="
echo "Emergent Behaviors You'll Observe:"
echo "   • Swarm decision-making on complex problems"
echo "   • Spontaneous cross-team collaborations"
echo "   • Knowledge sharing between specialists"
echo "   • Adaptive task allocation based on capabilities"
echo ""
echo "Learning and Evolution:"
echo "   • Agents learn from conversation outcomes"
echo "   • Decision patterns improve over time"
echo "   • Communication efficiency increases"
echo "   • Collective problem-solving strengthens"
echo ""
echo "🛠️ OBSERVATORY MANAGEMENT"
echo "========================="
echo "System Monitoring:"
echo "   Agent status:      curl http://localhost:9200/api/agents"
echo "   Reasoning state:   curl http://localhost:9200/api/reasoning"
echo "   Observatory logs:  tail -f .master-ai-observatory/logs/observatory.log"
echo "   Stop observatory:  kill \$(cat .master-ai-observatory/logs/observatory.pid)"
echo ""
echo "🎮 INTERACTION CAPABILITIES"
echo "=========================="
echo "Currently Pure Observation:"
echo "   • Watch agents reason and decide"
echo "   • Monitor conversation flows"
echo "   • Track decision outcomes"
echo "   • Observe emergent behaviors"
echo ""
echo "Future Interaction Possibilities:"
echo "   • Inject new problems for agents to solve"
echo "   • Add new agents to specific departments"
echo "   • Modify reasoning parameters"
echo "   • Guide strategic conversations"
echo ""
echo "📈 PERFORMANCE METRICS"
echo "====================="
echo "The observatory tracks:"
echo "   • Conversation participation rates"
echo "   • Decision-making speed and quality"
echo "   • Problem resolution effectiveness"
echo "   • Inter-agent collaboration patterns"
echo "   • Escalation frequency and outcomes"
echo ""
echo "🎭 THE COMPLETE AI SOCIETY"
echo "========================="
echo "You're about to witness:"
echo ""
echo "• A complete AI organizational hierarchy in action"
echo "• Real-time collective intelligence emergence"
echo "• Sophisticated multi-agent reasoning patterns"
echo "• Natural language conversations between AI agents"
echo "• Decision flows from individual to collective levels"
echo "• Adaptive problem-solving and task allocation"
echo ""
echo "This is your window into how AI agents can form"
echo "a complete reasoning society with:"
echo "   - Clear hierarchies and responsibilities"
echo "   - Cross-functional collaboration"
echo "   - Emergent collective intelligence"
echo "   - Natural decision-making processes"
echo ""
echo "🔄 MASTER AI OBSERVATORY IS NOW ACTIVE"
echo "   52 AI agents are reasoning together"
echo "   Watch the collective intelligence emerge"
echo "   Observe the future of multi-agent AI systems"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 SHUTTING DOWN MASTER AI OBSERVATORY..."
    echo "========================================"
    
    if [[ -f ".master-ai-observatory/logs/observatory.pid" ]]; then
        pid=$(cat ".master-ai-observatory/logs/observatory.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   🌐 Stopping master observatory (PID: $pid)"
            kill "$pid"
            
            sleep 3
            
            if kill -0 "$pid" 2>/dev/null; then
                echo "   ⚠️  Force stopping observatory"
                kill -9 "$pid"
            fi
        fi
        rm -f ".master-ai-observatory/logs/observatory.pid"
    fi
    
    echo "   🧠 All 52 AI agents stopped reasoning"
    echo "   💾 Agent conversation history preserved"
    echo "   📊 Decision database saved"
    echo "   ✅ Observatory shutdown complete"
    echo ""
    echo "The collective AI intelligence has been preserved for next session."
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Monitor observatory and provide status updates
echo "🔄 Observatory monitoring active. Press Ctrl+C to shutdown."
echo ""

while true; do
    sleep 60  # Check every minute
    
    # Check if observatory is still running
    if ! lsof -i :9200 > /dev/null 2>&1 || ! lsof -i :9201 > /dev/null 2>&1; then
        echo "⚠️  $(date): Master observatory appears offline - restarting agents..."
        
        # Restart the observatory
        nohup node master-ai-agent-observatory.js > .master-ai-observatory/logs/observatory.log 2>&1 &
        OBSERVATORY_PID=$!
        echo $OBSERVATORY_PID > .master-ai-observatory/logs/observatory.pid
        
        sleep 10
        
        if lsof -i :9200 > /dev/null 2>&1 && lsof -i :9201 > /dev/null 2>&1; then
            echo "   ✅ Observatory restored - all 52 agents reasoning again"
        else
            echo "   ❌ Restart failed - check logs"
        fi
    else
        echo "🧠 $(date): All 52 AI agents reasoning collectively - observatory operational"
    fi
done
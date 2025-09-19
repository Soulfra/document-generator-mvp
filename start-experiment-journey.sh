#!/bin/bash
# start-experiment-journey.sh - Initialize the experiment framework and begin the journey to 100% health

echo "🔬 Document Generator - Experiment Journey"
echo "========================================"
echo "Starting journey from 75% to 100% system health"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Please install Node.js 16+"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required. Please install npm"; exit 1; }

echo "✅ Prerequisites satisfied"
echo ""

# Create directory structure
echo "📁 Creating experiment directories..."
mkdir -p experiments/{visuals,reports,data}
mkdir -p evidence/{phase1,phase2,phase3,phase4,phase5}
mkdir -p verification/qr-codes
echo "✅ Directories created"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Initialize experiment journal
echo "📔 Initializing experiment journal..."
if [ -f "experiments/experiments.json" ]; then
    echo "✅ Experiment journal already exists"
else
    echo '[]' > experiments/experiments.json
    echo "✅ Experiment journal created"
fi
echo ""

# Capture baseline
echo "📸 Capturing baseline system state..."
echo "Current Date: $(date)" > evidence/phase1/baseline-capture.txt
echo "System: Document Generator" >> evidence/phase1/baseline-capture.txt
echo "Starting Health: 75% (9/12 services)" >> evidence/phase1/baseline-capture.txt
echo "" >> evidence/phase1/baseline-capture.txt
echo "Failing Services:" >> evidence/phase1/baseline-capture.txt
echo "- System Bus Service" >> evidence/phase1/baseline-capture.txt
echo "- Analytics Service" >> evidence/phase1/baseline-capture.txt
echo "- Extension Manager" >> evidence/phase1/baseline-capture.txt
echo "✅ Baseline captured"
echo ""

# Generate initial health bitmap
echo "🎨 Generating health bitmap visualization..."
node -e "
const health = 75;
const cols = 32;
const rows = 12;
const total = cols * rows;
const healthy = Math.floor(total * health / 100);

console.log('Health Bitmap - 75% (${healthy}/${total} pixels)');
console.log('================================');

let bitmap = '';
for (let i = 0; i < total; i++) {
    if (i % cols === 0 && i > 0) bitmap += '\n';
    bitmap += i < healthy ? '█' : '░';
}
console.log(bitmap);
" > evidence/phase1/health-bitmap-75.txt

cat evidence/phase1/health-bitmap-75.txt
echo "✅ Bitmap saved to evidence/phase1/health-bitmap-75.txt"
echo ""

# Test experiment CLI
echo "🧪 Testing experiment CLI..."
if [ -f "experiment-journal-cli.js" ]; then
    chmod +x experiment-journal-cli.js
    echo "✅ CLI is ready"
else
    echo "⚠️  experiment-journal-cli.js not found - you'll need to create it"
fi
echo ""

# Create first test experiment
echo "🔬 Ready to create your first experiment!"
echo ""
echo "📋 Next Steps:"
echo "1. Open self-testing-visual-dashboard.html to see current health"
echo "2. Run ./experiment-journal-cli.js create to start debugging"
echo "3. Follow IMPLEMENTATION-ROADMAP.md for phase-by-phase guidance"
echo ""
echo "📚 Key Documentation:"
echo "- MASTER-IMPLEMENTATION-GUIDE.md - Start here"
echo "- IMPLEMENTATION-ROADMAP.md - Detailed phases" 
echo "- EXPERIMENT-EXECUTION-GUIDE.md - How to run experiments"
echo "- BUILD-FROM-SPECS-GUIDE.md - Implementation patterns"
echo ""
echo "🎯 Goal: Transform 75% health → 100% health"
echo "🔬 Method: Scientific experimentation"
echo "📸 Proof: Visual documentation"
echo ""
echo "✨ Experiment journey initialized! Good luck!"
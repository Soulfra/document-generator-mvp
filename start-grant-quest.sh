#!/bin/bash

# Start Grant Quest - The Fun Way to Get Grant Money
echo "🎮 GRANT QUEST - Character Edition"
echo "=================================="
echo ""
echo "Where filling out boring grant forms becomes an adventure!"
echo ""

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express puppeteer ws
fi

# Start the character interface
echo "🚀 Starting Grant Quest Interface..."
node grant-forms-character-presenter.js &
PRESENTER_PID=$!

echo ""
echo "✅ Grant Quest running at: http://localhost:3300"
echo ""
echo "🎮 Features:"
echo "  - Grant Goblin finds money opportunities"
echo "  - Form Fairy fills out applications perfectly"
echo "  - Deadline Dragon keeps you on schedule"
echo "  - Success Sphinx maximizes approval chances"
echo ""
echo "📝 Current Grants:"
echo "  - AWS Activate: $100k (Ready now!)"
echo "  - NSF SBIR: $275k (Need EIN)"
echo "  - SBA Accelerator: $50k (Need EIN)"
echo ""
echo "💡 To fill a specific form:"
echo "   node real-grant-form-filler.js <grant-url>"
echo ""
echo "Press Ctrl+C to stop..."

trap "echo ''; echo '🛑 Stopping Grant Quest...'; kill $PRESENTER_PID 2>/dev/null; exit" INT TERM
wait $PRESENTER_PID
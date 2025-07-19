#!/bin/bash

# Convert chat logs to a working application
# Usage: ./chatlog-to-app.sh conversation.json [output-format]

set -e

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <chat-log-file> [output-format]"
    echo "Output formats: docker (default), vercel, railway, standalone"
    exit 1
fi

CHAT_FILE="$1"
OUTPUT_FORMAT="${2:-docker}"

# Validate file exists
if [ ! -f "$CHAT_FILE" ]; then
    echo "Error: File '$CHAT_FILE' not found"
    exit 1
fi

echo "🤖 Processing chat log: $CHAT_FILE"
echo "📦 Output format: $OUTPUT_FORMAT"
echo ""

# Process the chat log
response=$(curl -s -X POST http://localhost:3000/api/process-chatlog \
  -H "Content-Type: application/json" \
  -H "X-User-ID: cli-user" \
  -d @- << EOF
{
  "messages": $(cat "$CHAT_FILE"),
  "exportFormats": ["$OUTPUT_FORMAT", "markdown", "pdf"],
  "enrichmentLevel": "comprehensive",
  "options": {
    "generateTests": true,
    "includeDocumentation": true,
    "addComments": true
  }
}
EOF
)

# Extract job ID
job_id=$(echo "$response" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)

if [ -z "$job_id" ]; then
    echo "Error: Failed to start processing"
    echo "$response"
    exit 1
fi

echo "✅ Processing started. Job ID: $job_id"
echo ""

# Poll for completion
while true; do
    status=$(curl -s "http://localhost:3000/api/jobs/$job_id" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    
    case "$status" in
        "processing")
            echo -n "⏳ Processing"
            ;;
        "completed")
            echo ""
            echo "✅ Processing complete!"
            break
            ;;
        "failed")
            echo ""
            echo "❌ Processing failed"
            exit 1
            ;;
    esac
    
    sleep 2
    echo -n "."
done

# Download results
echo ""
echo "📥 Downloading generated application..."

# Create output directory
output_dir="output/chatlog-app-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$output_dir"

# Download all artifacts
curl -s "http://localhost:3000/api/jobs/$job_id/download" -o "$output_dir/app.zip"

# Extract
cd "$output_dir"
unzip -q app.zip

echo ""
echo "✅ Application generated successfully!"
echo "📁 Output location: $output_dir"
echo ""

# Show next steps based on format
case "$OUTPUT_FORMAT" in
    "docker")
        echo "🐳 To run your Docker application:"
        echo "  cd $output_dir"
        echo "  docker-compose up"
        ;;
    "vercel")
        echo "▲ To deploy to Vercel:"
        echo "  cd $output_dir"
        echo "  vercel deploy"
        ;;
    "railway")
        echo "🚂 To deploy to Railway:"
        echo "  cd $output_dir"
        echo "  railway up"
        ;;
    "standalone")
        echo "💻 To run standalone:"
        echo "  cd $output_dir"
        echo "  npm install"
        echo "  npm start"
        ;;
esac

echo ""
echo "📄 Documentation: $output_dir/README.md"
echo "🧪 Run tests: cd $output_dir && npm test"
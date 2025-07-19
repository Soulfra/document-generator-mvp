#!/bin/bash

# Convert a business plan document to a SaaS MVP
# Usage: ./business-plan-to-saas.sh business-plan.pdf [tech-stack]

set -e

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <business-plan-file> [tech-stack]"
    echo "Tech stacks: nextjs-supabase (default), mern, django-react, rails-vue"
    exit 1
fi

PLAN_FILE="$1"
TECH_STACK="${2:-nextjs-supabase}"

# Validate file exists
if [ ! -f "$PLAN_FILE" ]; then
    echo "Error: File '$PLAN_FILE' not found"
    exit 1
fi

echo "💼 Processing business plan: $PLAN_FILE"
echo "🛠️  Tech stack: $TECH_STACK"
echo ""

# Create form data for file upload
response=$(curl -s -X POST http://localhost:3001/api/upload \
  -H "X-API-Key: demo-key" \
  -F "file=@$PLAN_FILE" \
  -F "type=business-plan" \
  -F "options={\"techStack\":\"$TECH_STACK\",\"generateAuth\":true,\"includePayments\":true,\"addAnalytics\":true}")

# Extract upload ID
upload_id=$(echo "$response" | grep -o '"uploadId":"[^"]*' | cut -d'"' -f4)

if [ -z "$upload_id" ]; then
    echo "Error: Failed to upload document"
    echo "$response"
    exit 1
fi

echo "✅ Document uploaded. Processing..."
echo ""

# Start processing
process_response=$(curl -s -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key" \
  -d "{
    \"uploadId\": \"$upload_id\",
    \"template\": \"saas-mvp\",
    \"options\": {
      \"techStack\": \"$TECH_STACK\",
      \"features\": [
        \"authentication\",
        \"payment-processing\",
        \"user-dashboard\",
        \"admin-panel\",
        \"api-endpoints\",
        \"email-notifications\"
      ]
    }
  }")

job_id=$(echo "$process_response" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)

echo "🚀 Generation started. Job ID: $job_id"

# Monitor progress via WebSocket (simulated with polling)
echo ""
echo "Progress:"
echo -n "["

completed=0
while [ $completed -eq 0 ]; do
    sleep 3
    
    # Get job status
    status_response=$(curl -s "http://localhost:3001/api/jobs/$job_id")
    status=$(echo "$status_response" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    progress=$(echo "$status_response" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
    
    # Update progress bar
    if [ ! -z "$progress" ]; then
        bars=$((progress / 5))
        for i in $(seq 1 $bars); do
            echo -n "="
        done
    fi
    
    case "$status" in
        "completed")
            echo "] 100%"
            completed=1
            ;;
        "failed")
            echo "]"
            echo "❌ Generation failed"
            error=$(echo "$status_response" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
            echo "Error: $error"
            exit 1
            ;;
    esac
done

echo ""
echo "✅ SaaS MVP generated successfully!"
echo ""

# Download generated application
output_dir="output/saas-mvp-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$output_dir"

echo "📥 Downloading generated SaaS application..."
curl -s "http://localhost:3001/api/jobs/$job_id/download" -o "$output_dir/saas-app.zip"

# Extract
cd "$output_dir"
unzip -q saas-app.zip

# Show project structure
echo ""
echo "📁 Project Structure:"
tree -L 2 . 2>/dev/null || ls -la

echo ""
echo "🎯 Key Features Generated:"
echo "  ✓ User authentication & authorization"
echo "  ✓ Payment processing (Stripe integrated)"
echo "  ✓ User dashboard with analytics"
echo "  ✓ Admin panel for management"
echo "  ✓ RESTful API endpoints"
echo "  ✓ Email notification system"
echo "  ✓ Database migrations"
echo "  ✓ Docker deployment ready"

echo ""
echo "🚀 Quick Start:"

case "$TECH_STACK" in
    "nextjs-supabase")
        echo "  1. cd $output_dir"
        echo "  2. npm install"
        echo "  3. cp .env.example .env.local"
        echo "  4. # Add your Supabase credentials to .env.local"
        echo "  5. npm run dev"
        echo ""
        echo "  Deploy to Vercel:"
        echo "  vercel deploy"
        ;;
    "mern")
        echo "  1. cd $output_dir"
        echo "  2. docker-compose up -d"
        echo "  3. cd frontend && npm install && npm start"
        echo "  4. cd ../backend && npm install && npm run dev"
        ;;
    "django-react")
        echo "  1. cd $output_dir"
        echo "  2. docker-compose up -d"
        echo "  3. python manage.py migrate"
        echo "  4. python manage.py createsuperuser"
        echo "  5. python manage.py runserver"
        ;;
    "rails-vue")
        echo "  1. cd $output_dir"
        echo "  2. bundle install"
        echo "  3. rails db:create db:migrate"
        echo "  4. cd frontend && npm install"
        echo "  5. foreman start"
        ;;
esac

echo ""
echo "📚 Documentation: $output_dir/README.md"
echo "🧪 Run tests: cd $output_dir && npm test"
echo "📊 View metrics: http://localhost:3002/dashboard"
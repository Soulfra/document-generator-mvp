#!/bin/bash

# FinishThisIdea MVP Setup Script
echo "🚀 Setting up FinishThisIdea MVP..."

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Required tools detected"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before continuing"
    echo "   Especially set your Stripe keys for payment processing"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are healthy
echo "🏥 Checking service health..."
docker-compose ps

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

# Pull Ollama model
echo "🤖 Setting up Ollama (this may take a few minutes)..."
docker exec finishthisidea-ollama ollama pull codellama:latest

# Create MinIO bucket
echo "🪣 Setting up S3 bucket..."
sleep 5 # Wait for MinIO to fully start
docker run --rm --network finishthisidea-network \
  minio/mc:latest sh -c "
    mc alias set local http://minio:9000 minioadmin minioadmin123 &&
    mc mb local/finishthisidea-uploads --ignore-existing &&
    mc policy set public local/finishthisidea-uploads
  "

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3001/health to check if everything is working"
echo ""
echo "📋 Useful commands:"
echo "  npm run dev     - Start development server"
echo "  npm test        - Run tests"
echo "  npm run build   - Build for production"
echo ""
echo "🔧 Service URLs:"
echo "  Backend API:    http://localhost:3001"
echo "  Health Check:   http://localhost:3001/health"
echo "  Queue Monitor:  http://localhost:3001/admin/queues"
echo "  MinIO Console:  http://localhost:9001 (minioadmin / minioadmin123)"
echo "  Ollama API:     http://localhost:11434"
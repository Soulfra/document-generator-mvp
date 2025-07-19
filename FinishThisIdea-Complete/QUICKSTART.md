# FinishThisIdea MVP - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Stripe account (for payments)

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Services**
   ```bash
   ./scripts/setup.sh
   ```
   This will:
   - Start PostgreSQL, Redis, MinIO (S3), and Ollama
   - Set up the database
   - Pull the Ollama CodeLlama model
   - Create S3 bucket

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your keys:
   ```bash
   # Required for payments
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Optional: Claude API for fallback
   ANTHROPIC_API_KEY=sk-ant-your_key_here
   ```

4. **Update Frontend**
   Edit `public/index.html` line 214:
   ```javascript
   const stripe = Stripe('pk_test_your_publishable_key_here');
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Test the Application**
   - Open http://localhost:3001
   - Upload a test codebase (.zip file)
   - Complete the $1 payment flow
   - Watch your code get cleaned!

## 🧪 Testing with Your Codebase

### Create a Test ZIP
```bash
# Example: Clean up your 59-tier project
cd /path/to/your/messy/project
zip -r messy-code.zip . -x "node_modules/*" ".git/*" "*.log"
```

### Upload & Process
1. Go to http://localhost:3001
2. Drag & drop your `messy-code.zip`
3. Complete payment (use Stripe test card: 4242 4242 4242 4242)
4. Watch progress at http://localhost:3001/status.html?jobId=YOUR_JOB_ID

## 🛠️ Service URLs

- **Frontend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Queue Dashboard**: http://localhost:3001/admin/queues
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)
- **Ollama API**: http://localhost:11434

## 📋 API Endpoints

```bash
# Upload file
POST /api/upload
Content-Type: multipart/form-data
Body: file=your-code.zip

# Create payment
POST /api/payment/checkout
Body: {"jobId": "uuid"}

# Check status
GET /api/jobs/{jobId}

# Download result
GET /api/jobs/{jobId}/download
```

## 🚨 Troubleshooting

### Ollama Not Working
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Pull model manually
docker exec finishthisidea-ollama ollama pull codellama
```

### Payment Failing
1. Check Stripe keys in `.env`
2. Update publishable key in `public/index.html`
3. Use test card: 4242 4242 4242 4242

### Database Issues
```bash
# Reset database
npx prisma db push --force-reset
```

### File Upload Issues
- Check MinIO is running: http://localhost:9001
- Verify S3 bucket exists: `finishthisidea-uploads`
- Check file size < 50MB

## 📈 Next Steps

Once everything is working locally:

1. **Deploy to Railway**
   - Connect GitHub repo
   - Set environment variables
   - Deploy!

2. **Get Real Stripe Keys**
   - Switch from test to live keys
   - Set up webhook endpoint

3. **Buy Domain**
   - Point to Railway deployment
   - Update FRONTEND_URL

4. **Launch!**
   - Post on Reddit/Twitter
   - Share with developer friends
   - Start earning revenue!

## 💡 Pro Tips

- Save job IDs for testing
- Monitor queue dashboard during processing
- Check logs for debugging: `docker-compose logs -f`
- Test with various file types and sizes

---

**You're ready to launch your first MVP! 🎉**
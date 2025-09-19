# 🚀 COMBO BASH - One Command to Rule Them All

## What is Combo Bash?

The **Combo Bash** script (`combo-bash-everything.sh`) is your one-stop command that:
1. ✅ Initializes the database
2. ✅ Starts all services (Economic Engine + Slam Layer)
3. ✅ Runs comprehensive tests
4. ✅ Checks deployment readiness
5. ✅ Creates quick access scripts
6. ✅ Shows you exactly what to do next

## 🎯 How to Use

### Quick Start
```bash
# One command does everything!
./combo-bash-everything.sh
```

That's it! The script will:
- Kill any existing Node processes
- Install npm packages if needed
- Initialize your database (MySQL or PostgreSQL)
- Start the Economic Engine on port 3000
- Start the Slam layer on port 9999
- Run all tests to verify everything works
- Create helper scripts for daily use
- Show you deployment instructions

### What You'll See

```
🎯 ECONOMIC ENGINE - COMBO BASH EVERYTHING
==========================================

📦 Checking dependencies...
✅ Dependencies check passed

🔧 Setting up environment...
✅ Created .env from .env.example

📦 Installing npm packages...
✅ npm packages already installed

🗄️ Initializing database...
✅ Database initialized successfully

🚀 Starting Economic Engine (port 3000)...
✅ Economic Engine started (PID: 12345)

🔨 Starting Slam layer (port 9999)...
✅ Slam layer started (PID: 12346)

🧪 Running comprehensive tests...
✅ All tests passed!

🚢 Checking deployment readiness...
✅ All files present
⚠️ API keys not configured (using placeholders)

📊 SUMMARY
==========
✅ Economic Engine running on: http://localhost:3000
✅ Slam layer running on: http://localhost:9999
✅ Access the platform at: http://localhost:9999
✅ All tests passed

🎉 COMBO BASH COMPLETE!
```

## 🛠️ Created Helper Scripts

After running combo bash, you'll have:

### `./start.sh`
```bash
# Start everything quickly
./start.sh
```

### `./stop.sh`
```bash
# Stop all services
./stop.sh
```

### `./test.sh`
```bash
# Run all tests
./test.sh
```

## 📋 What Happens Step by Step

1. **Environment Check**
   - Verifies Node.js and npm are installed
   - Checks for MySQL or PostgreSQL
   - Creates .env from .env.example if needed

2. **Process Cleanup**
   - Kills any existing Node processes
   - Ensures clean startup

3. **Package Installation**
   - Runs `npm install` if node_modules doesn't exist
   - Ensures all dependencies are ready

4. **Database Setup**
   - Runs `init-database.js`
   - Creates all tables and initial data
   - Works with MySQL or PostgreSQL

5. **Service Startup**
   - Starts Economic Engine on port 3000
   - Starts Slam layer on port 9999
   - Verifies both are responding

6. **Comprehensive Testing**
   - Runs `run-all-tests.sh`
   - Tests all endpoints, pages, and features
   - Generates test reports

7. **Deployment Check**
   - Verifies all required files exist
   - Checks for API key configuration
   - Validates git repository status

8. **Quick Scripts**
   - Creates start.sh, stop.sh, test.sh
   - Makes daily operations easier

## 🚨 Troubleshooting

### Port Already in Use
```bash
# The script automatically kills existing processes
# But if needed, manually:
pkill -f node
```

### Database Connection Failed
```bash
# Check your database is running
# For MySQL:
mysql -u root -p

# For PostgreSQL:
psql -U postgres
```

### Tests Failing
```bash
# Check individual logs
tail -f economic-engine.log
tail -f slam-layer.log
```

## 🎯 Next Steps After Combo Bash

1. **Configure Real API Keys**
   ```bash
   # Edit .env file
   OPENAI_API_KEY=sk-your-real-key
   ANTHROPIC_API_KEY=sk-ant-your-real-key
   STRIPE_PUBLIC_KEY=pk_live_your-key
   STRIPE_SECRET_KEY=sk_live_your-key
   ```

2. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Economic Engine platform"
   ```

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/economic-engine.git
   git push -u origin main
   ```

4. **Deploy to Production**
   - Railway: `railway up`
   - Vercel: `vercel --prod`
   - Docker: `docker-compose up -d`

## 🔄 Daily Workflow

```bash
# Morning: Start everything
./start.sh

# During development: Run tests
./test.sh

# Evening: Stop everything
./stop.sh

# Need full reset? Run combo bash again
./combo-bash-everything.sh
```

## 📊 What Success Looks Like

When everything is working:
- ✅ http://localhost:9999 shows the free tier page
- ✅ All 40+ tests pass
- ✅ Database has AI agents and initial data
- ✅ Real-time economic data flows
- ✅ 3D visualizations load
- ✅ PWA can be installed
- ✅ API endpoints respond quickly

## 🎉 You're Ready!

After running combo bash successfully, your Economic Engine platform is:
- Fully initialized
- Running locally
- Tested and verified
- Ready for deployment

Access your platform at: **http://localhost:9999**

---

**Remember: Combo Bash is your friend. When in doubt, run it!** 🚀
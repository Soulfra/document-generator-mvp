# ✅ Deployment Checklist for Economic Engine

## Pre-Deployment Checklist

### 1. 🔑 API Keys & Environment Variables
- [ ] **OpenAI API Key** configured in .env
- [ ] **Anthropic API Key** configured in .env  
- [ ] **Stripe Public Key** configured in .env
- [ ] **Stripe Secret Key** configured in .env
- [ ] **Stripe Webhook Secret** configured in .env
- [ ] **JWT Secret** generated and configured
- [ ] **Session Secret** generated and configured
- [ ] **Database credentials** configured
- [ ] **External API keys** (crypto, economic data) configured

### 2. 🗄️ Database Setup
- [ ] Database initialized with `./combo-bash-everything.sh`
- [ ] All tables created successfully
- [ ] Initial AI agents loaded
- [ ] Test data verified
- [ ] Database backup created

### 3. 🧪 Testing
- [ ] All tests passing (`./test.sh`)
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met
- [ ] PWA installable
- [ ] Chrome extension loads
- [ ] Electron app builds

### 4. 🔒 Security
- [ ] No hardcoded secrets in code
- [ ] .env file not committed to git
- [ ] CORS properly configured
- [ ] Input validation in place
- [ ] Rate limiting configured
- [ ] HTTPS certificates ready

### 5. 📁 Git Repository
- [ ] Git repository initialized
- [ ] .gitignore properly configured
- [ ] All files committed
- [ ] Remote origin added
- [ ] Initial push completed
- [ ] README.md updated

## Deployment Platforms

### 🚂 Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Configure Environment**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   # Add all other env variables
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get URL**
   ```bash
   railway open
   ```

### ▲ Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "slam-it-all-together.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/slam-it-all-together.js"
       }
     ]
   }
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### 🐳 Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 9999
   CMD ["node", "slam-it-all-together.js"]
   ```

2. **Build Image**
   ```bash
   docker build -t economic-engine .
   ```

3. **Run Container**
   ```bash
   docker run -d -p 9999:9999 --env-file .env economic-engine
   ```

### 🔄 GitHub Actions Deployment

1. **Configure Secrets in GitHub**
   - Go to Settings → Secrets → Actions
   - Add all required secrets:
     - `RAILWAY_TOKEN`
     - `VERCEL_TOKEN`
     - `OPENAI_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `STRIPE_SECRET_KEY`
     - etc.

2. **Push to Main Branch**
   ```bash
   git push origin main
   ```

3. **Monitor Deployment**
   - Check Actions tab in GitHub
   - View deployment logs
   - Verify all steps pass

## Post-Deployment Checklist

### 1. 🔍 Verification
- [ ] Production URL accessible
- [ ] All pages load correctly
- [ ] API endpoints responding
- [ ] PWA installable from production
- [ ] Real-time features working
- [ ] 3D visualizations loading

### 2. 🏷️ DNS & Domain
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS records propagated
- [ ] www redirect working
- [ ] HTTPS enforced

### 3. 📊 Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring set up
- [ ] Log aggregation working
- [ ] Alerts configured

### 4. 🔄 Backup & Recovery
- [ ] Database backups scheduled
- [ ] Code repository backed up
- [ ] Recovery plan documented
- [ ] Rollback procedure tested

### 5. 📈 Analytics
- [ ] Google Analytics configured
- [ ] User tracking implemented
- [ ] API usage monitoring
- [ ] Cost tracking active

## Quick Deployment Commands

```bash
# Full deployment sequence
./combo-bash-everything.sh  # Initialize everything locally
git add .
git commit -m "Ready for production deployment"
git push origin main        # Triggers GitHub Actions

# Platform-specific
railway up                  # Deploy to Railway
vercel --prod              # Deploy to Vercel
docker-compose up -d       # Deploy with Docker

# Quick rollback
git revert HEAD
git push origin main
```

## Deployment URLs

After successful deployment, your platform will be available at:

- **Railway**: `https://your-app.railway.app`
- **Vercel**: `https://your-app.vercel.app`
- **Custom Domain**: `https://yourdomain.com`

## Support & Troubleshooting

### Common Issues

1. **Build Failing**
   - Check Node version (18.x required)
   - Verify all dependencies installed
   - Check build logs for errors

2. **Database Connection Issues**
   - Verify connection string
   - Check firewall rules
   - Ensure database is accessible

3. **Environment Variables Missing**
   - Double-check all secrets configured
   - Verify variable names match
   - Check for typos

### Getting Help

1. Check deployment logs
2. Review error messages
3. Consult platform documentation
4. Test locally first
5. Rollback if needed

---

**Remember: Test locally, deploy globally!** 🚀
# 🚀 Production SSH/Tmux Setup Guide

## Launch Options

### Option 1: Local Development with Tmux Monitoring
```bash
./launch-production.sh
```

This creates a tmux session with 6 windows:
- **Window 0 (main-app)**: Running the MVP
- **Window 1 (system-monitor)**: CPU/Memory monitoring
- **Window 2 (logs)**: Application logs
- **Window 3 (git-ops)**: Git operations
- **Window 4 (deploy)**: Deployment commands
- **Window 5 (testing)**: Testing environment

### Option 2: Deploy to Cloud with SSH Access

#### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway new document-generator-mvp
railway up

# SSH into Railway container (if needed)
railway shell
```

#### DigitalOcean Droplet (Full SSH Control)
```bash
# Create droplet
doctl compute droplet create document-generator-mvp \
  --size s-1vcpu-1gb \
  --image ubuntu-22-04-x64 \
  --region nyc1

# SSH into droplet
ssh root@your-droplet-ip

# Setup on droplet
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git tmux
git clone https://github.com/YOUR_USERNAME/document-generator-mvp.git
cd document-generator-mvp
npm install
./launch-production.sh
```

#### AWS EC2 with SSH
```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t2.micro \
  --key-name your-key-pair

# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Setup application
sudo apt update
sudo apt install -y nodejs npm git tmux
git clone https://github.com/YOUR_USERNAME/document-generator-mvp.git
cd document-generator-mvp
npm install
./launch-production.sh
```

## Tmux Production Commands

### Session Management
```bash
# Create new session
tmux new-session -d -s mvp-production

# List sessions
tmux list-sessions

# Attach to session
tmux attach-session -t mvp-production

# Detach from session
Ctrl+b, d

# Kill session
tmux kill-session -t mvp-production
```

### Window Navigation
```bash
Ctrl+b, n     # Next window
Ctrl+b, p     # Previous window
Ctrl+b, 0-9   # Jump to window number
Ctrl+b, c     # Create new window
Ctrl+b, &     # Kill current window
```

### Production Monitoring Setup
```bash
# Window 1: Application
tmux new-window -n 'app'
npm start

# Window 2: System monitor
tmux new-window -n 'htop'
htop

# Window 3: Logs
tmux new-window -n 'logs'
tail -f /var/log/app.log

# Window 4: Network monitor
tmux new-window -n 'network'
netstat -tulpn

# Window 5: Deploy/Git
tmux new-window -n 'deploy'
git status
```

## SSH Security Setup

### Create SSH Key
```bash
ssh-keygen -t rsa -b 4096 -C "document-generator-mvp"
```

### Server Hardening
```bash
# Disable password auth
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh

# Setup firewall
sudo ufw allow ssh
sudo ufw allow 3000
sudo ufw enable
```

## Production Environment Variables

Create `.env.production`:
```bash
PORT=3000
NODE_ENV=production
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DATABASE_URL=your_db_url
REDIS_URL=your_redis_url
```

## Monitoring Commands

### System Health
```bash
# CPU/Memory
top -p $(pgrep node)

# Disk usage
df -h

# Network connections
ss -tulpn | grep :3000

# Process monitoring
ps aux | grep node
```

### Application Health
```bash
# Check if app is running
curl http://localhost:3000/api/status

# Test document upload
curl -X POST -F "document=@test.pdf" http://localhost:3000/api/process-document

# Monitor logs
tail -f app.log | grep ERROR
```

## Quick Launch Commands

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### With Process Manager (PM2)
```bash
npm install -g pm2
pm2 start document-generator-mvp-compactor.js --name mvp
pm2 monit
```

---

**You're now in the LAUNCH LAYER with full SSH/tmux production control.** 🚀
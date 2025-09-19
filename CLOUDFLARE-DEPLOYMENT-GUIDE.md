# Cloudflare Deployment Guide - Fix 502 Errors

This guide explains how to properly deploy the Soulfra services with Cloudflare to eliminate 502 Bad Gateway errors.

## 🎯 Overview

The 502 errors were caused by:
1. Direct exposure of Kubernetes LoadBalancer services
2. No Cloudflare Tunnel configuration
3. Missing API gateway at the edge
4. Improper routing and authentication

## 🏗️ Architecture

```
Internet → Cloudflare DNS → Cloudflare Worker (Edge) → Cloudflare Tunnel → Kubernetes Services
                ↓                    ↓                         ↓                    ↓
          DNS Resolution      Authentication          Secure Connection      Internal Services
          Rate Limiting         Caching                Load Balancing        ClusterIP Only
          Edge Computing        KV Storage            Health Checks         No External IPs
```

## 📋 Prerequisites

1. **Cloudflare Account** with:
   - Domain configured (soulfra.com)
   - API Token with DNS edit permissions
   - Cloudflare Tunnel access

2. **Kubernetes Cluster** with:
   - kubectl configured
   - Ability to create namespaces
   - Storage provisioner for PVCs

3. **Tools Installed**:
   ```bash
   # Install required tools
   brew install cloudflared wrangler kubectl jq
   
   # Or on Linux
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   npm install -g wrangler
   ```

## 🚀 Quick Start

```bash
# 1. Clone and navigate to project
cd /Users/matthewmauer/Desktop/Document-Generator

# 2. Set environment variables
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# 3. Run deployment script
./deploy-cloudflare.sh
```

## 📝 Manual Deployment Steps

### 1. Create Cloudflare Tunnel

```bash
# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create soulfra-tunnel

# Note the Tunnel ID and credentials path
ls ~/.cloudflared/*.json
```

### 2. Configure Kubernetes

```bash
# Create namespaces
kubectl create namespace soulfra-cal
kubectl create namespace cloudflare

# Create tunnel secret
kubectl create secret generic cloudflare-tunnel-credentials \
  --from-file=credentials.json=$HOME/.cloudflared/<TUNNEL_ID>.json \
  --namespace=cloudflare

# Apply configurations
kubectl apply -f k8s/cloudflare-tunnel.yaml
kubectl apply -f k8s/updated-services.yaml
```

### 3. Setup DNS Records

In Cloudflare Dashboard:
1. Go to DNS settings for your domain
2. Add CNAME records:
   - `api` → `<TUNNEL_ID>.cfargotunnel.com`
   - `export` → `<TUNNEL_ID>.cfargotunnel.com`
   - `bridge` → `<TUNNEL_ID>.cfargotunnel.com`
   - `login` → `<TUNNEL_ID>.cfargotunnel.com`
   - `health` → `<TUNNEL_ID>.cfargotunnel.com`
3. Enable "Proxied" (orange cloud) for all records

### 4. Deploy Cloudflare Worker

```bash
cd cloudflare-worker

# Create KV namespaces
wrangler kv:namespace create "SOULFRA_KV"
wrangler kv:namespace create "RATE_LIMIT_KV"

# Update wrangler.toml with your account ID and KV namespace IDs

# Set secrets
wrangler secret put AUTH_SECRET

# Deploy
wrangler deploy

cd ..
```

### 5. Deploy Services

```bash
# Build Docker images
docker build -t soulfra/export-service:latest -f Dockerfile.export .

# Push to your registry
docker push soulfra/export-service:latest

# Update Kubernetes deployments
kubectl rollout restart deployment -n soulfra-cal
```

## 🔍 Troubleshooting

### Still Getting 502 Errors?

1. **Check Cloudflare Tunnel Status**:
   ```bash
   kubectl logs -n cloudflare deployment/cloudflared
   # Should show "Connection registered" messages
   ```

2. **Verify Service Health**:
   ```bash
   kubectl get pods -n soulfra-cal
   # All pods should be Running
   
   kubectl describe svc -n soulfra-cal
   # Endpoints should be populated
   ```

3. **Test Internal Connectivity**:
   ```bash
   # Run debug pod
   kubectl run debug --image=nicolaka/netshoot -it --rm -n soulfra-cal
   
   # Inside debug pod, test services
   curl http://cal-riven-service:80/health
   curl http://soulfra-authenticated-export-service:3333/health
   ```

4. **Check Worker Logs**:
   - Go to Cloudflare Dashboard → Workers → soulfra-api-gateway → Logs
   - Look for authentication failures or fetch errors

### Common Issues

1. **"Bad Gateway" in Worker**:
   - Service names in Worker don't match Kubernetes services
   - Services not ready or pods crashing
   - Network policies blocking traffic

2. **"Unauthorized" errors**:
   - AUTH_SECRET mismatch between Worker and services
   - KV namespace not properly bound
   - Session expiration

3. **Tunnel not connecting**:
   - Credentials secret incorrect
   - Tunnel ID mismatch in config
   - Firewall blocking outbound connections

## 📊 Monitoring

### Cloudflare Analytics
- Real-time logs in Workers dashboard
- Tunnel metrics in Zero Trust dashboard
- DNS analytics for traffic patterns

### Kubernetes Monitoring
```bash
# Watch pod status
kubectl get pods -n soulfra-cal -w

# Check resource usage
kubectl top pods -n soulfra-cal

# View recent events
kubectl get events -n soulfra-cal --sort-by='.lastTimestamp'
```

### Health Checks
```bash
# External health check
curl https://health.soulfra.com

# Check specific services
curl https://api.soulfra.com/health
curl https://export.soulfra.com/health
```

## 🔒 Security Considerations

1. **Secrets Management**:
   - Rotate AUTH_SECRET regularly
   - Use Kubernetes secrets for sensitive data
   - Enable secret encryption at rest

2. **Network Security**:
   - Services only accessible via Cloudflare Tunnel
   - No public LoadBalancer IPs exposed
   - Network policies restrict pod-to-pod communication

3. **Authentication**:
   - JWT tokens validated at edge (Worker)
   - Session storage in Cloudflare KV
   - Rate limiting prevents abuse

## 🚨 Rollback Procedure

If issues occur:

```bash
# 1. Disable Cloudflare Worker routes
wrangler deploy --routes "none"

# 2. Revert to LoadBalancer services
kubectl apply -f k8s/original-services.yaml

# 3. Update DNS to point directly to LoadBalancer IPs
# (Manual process in Cloudflare dashboard)

# 4. Delete tunnel if needed
cloudflared tunnel delete soulfra-tunnel
```

## 📈 Performance Optimization

1. **Edge Caching**:
   - Worker caches GET requests for 5 minutes
   - Static assets cached for 1 hour
   - Use cache tags for selective purging

2. **Connection Pooling**:
   - Cloudflare Tunnel maintains persistent connections
   - Reduces connection overhead
   - Automatic failover between tunnel replicas

3. **Compression**:
   - Enable Brotli compression in Cloudflare
   - Gzip enabled in nginx services
   - Reduces bandwidth usage

## 🎯 Success Metrics

After deployment, you should see:
- ✅ Zero 502 errors
- ✅ <100ms latency for cached requests
- ✅ 100% uptime for health checks
- ✅ Successful authentication flows
- ✅ Export functionality working

## 📚 Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Workers KV Documentation](ObsidianVault/02-Documentation/doc_1755710650725_nkr53kv3j_complete-ai-ecosystem-solution.md)
- [Kubernetes Service Types](CLAUDE.ai-services.md)

---

**Remember**: The key to eliminating 502 errors is ensuring all traffic flows through Cloudflare's edge network, with proper health checks and fallback mechanisms at every layer.
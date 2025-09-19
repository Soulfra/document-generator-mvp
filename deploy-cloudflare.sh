#!/bin/bash

# Deploy Cloudflare Infrastructure for Soulfra Services
# This script eliminates 502 errors by properly configuring Cloudflare + Kubernetes

set -e

echo "🚀 DEPLOYING CLOUDFLARE INFRASTRUCTURE FOR SOULFRA"
echo "=================================================="

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check for required tools
    for tool in kubectl cloudflared wrangler jq; do
        if ! command -v $tool &> /dev/null; then
            echo "❌ $tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        echo "❌ kubectl is not configured or cluster is not accessible"
        exit 1
    fi
    
    echo "✅ All prerequisites met"
}

# Create namespaces
create_namespaces() {
    echo "📁 Creating namespaces..."
    kubectl create namespace soulfra-cal --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace cloudflare --dry-run=client -o yaml | kubectl apply -f -
    echo "✅ Namespaces created"
}

# Setup Cloudflare Tunnel
setup_cloudflare_tunnel() {
    echo "🚇 Setting up Cloudflare Tunnel..."
    
    # Check if tunnel already exists
    if cloudflared tunnel list | grep -q "soulfra-tunnel"; then
        echo "Tunnel 'soulfra-tunnel' already exists"
        TUNNEL_ID=$(cloudflared tunnel list | grep "soulfra-tunnel" | awk '{print $1}')
    else
        # Create new tunnel
        cloudflared tunnel create soulfra-tunnel
        TUNNEL_ID=$(cloudflared tunnel list | grep "soulfra-tunnel" | awk '{print $1}')
    fi
    
    echo "Tunnel ID: $TUNNEL_ID"
    
    # Get tunnel credentials
    TUNNEL_CREDENTIALS=$(cat ~/.cloudflared/${TUNNEL_ID}.json | base64 -w 0)
    
    # Update the tunnel configuration with actual tunnel ID
    sed -i.bak "s/YOUR_TUNNEL_ID/$TUNNEL_ID/g" k8s/cloudflare-tunnel.yaml
    
    # Create secret with actual credentials
    kubectl create secret generic cloudflare-tunnel-credentials \
        --from-literal=credentials.json="$(cat ~/.cloudflared/${TUNNEL_ID}.json)" \
        --namespace=cloudflare \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo "✅ Cloudflare Tunnel configured"
}

# Deploy Kubernetes resources
deploy_kubernetes_resources() {
    echo "☸️  Deploying Kubernetes resources..."
    
    # Apply Cloudflare tunnel configuration
    kubectl apply -f k8s/cloudflare-tunnel.yaml
    
    # Apply updated services
    kubectl apply -f k8s/updated-services.yaml
    
    # Wait for deployments to be ready
    echo "⏳ Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/cloudflared -n cloudflare
    
    echo "✅ Kubernetes resources deployed"
}

# Setup Cloudflare DNS
setup_cloudflare_dns() {
    echo "🌐 Setting up Cloudflare DNS..."
    
    # Note: This requires Cloudflare API token
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo "⚠️  CLOUDFLARE_API_TOKEN not set. Please set DNS records manually:"
        echo "   - api.soulfra.com → Cloudflare Tunnel"
        echo "   - export.soulfra.com → Cloudflare Tunnel"
        echo "   - bridge.soulfra.com → Cloudflare Tunnel"
        echo "   - login.soulfra.com → Cloudflare Tunnel"
        echo "   - health.soulfra.com → Cloudflare Tunnel"
    else
        # Auto-configure DNS using API
        ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=soulfra.com" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" | jq -r '.result[0].id')
        
        for subdomain in api export bridge login health; do
            echo "Creating DNS record for $subdomain.soulfra.com..."
            
            curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
                -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
                -H "Content-Type: application/json" \
                --data '{
                    "type": "CNAME",
                    "name": "'$subdomain'",
                    "content": "'$TUNNEL_ID'.cfargotunnel.com",
                    "ttl": 1,
                    "proxied": true
                }'
        done
        
        echo "✅ DNS records configured"
    fi
}

# Deploy Cloudflare Worker
deploy_cloudflare_worker() {
    echo "👷 Deploying Cloudflare Worker..."
    
    cd cloudflare-worker
    
    # Create KV namespaces if they don't exist
    echo "Creating KV namespaces..."
    wrangler kv:namespace create "SOULFRA_KV" || true
    wrangler kv:namespace create "RATE_LIMIT_KV" || true
    
    # Get KV namespace IDs
    SOULFRA_KV_ID=$(wrangler kv:namespace list | grep "SOULFRA_KV" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    RATE_LIMIT_KV_ID=$(wrangler kv:namespace list | grep "RATE_LIMIT_KV" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    # Update wrangler.toml with actual IDs
    sed -i.bak "s/YOUR_KV_NAMESPACE_ID/$SOULFRA_KV_ID/g" wrangler.toml
    sed -i.bak "s/YOUR_RATELIMIT_KV_ID/$RATE_LIMIT_KV_ID/g" wrangler.toml
    
    # Set secrets
    echo "Setting Worker secrets..."
    echo -n "Enter AUTH_SECRET: "
    read -s AUTH_SECRET
    echo
    wrangler secret put AUTH_SECRET <<< "$AUTH_SECRET"
    
    # Deploy worker
    wrangler deploy
    
    cd ..
    echo "✅ Cloudflare Worker deployed"
}

# Build and push Docker images
build_docker_images() {
    echo "🐳 Building Docker images..."
    
    # Build export service image
    docker build -t soulfra/export-service:latest -f- . <<'EOF'
FROM node:18-alpine
WORKDIR /app
COPY SOULFRA-AUTHENTICATED-EXPORT-SERVICE.js .
COPY package*.json .
RUN npm install
RUN mkdir -p exports vault
EXPOSE 3333
CMD ["node", "SOULFRA-AUTHENTICATED-EXPORT-SERVICE.js"]
EOF
    
    # Push to registry (adjust for your registry)
    # docker push soulfra/export-service:latest
    
    echo "✅ Docker images built"
}

# Verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Check pod status
    kubectl get pods -n soulfra-cal
    kubectl get pods -n cloudflare
    
    # Check tunnel status
    kubectl logs -n cloudflare deployment/cloudflared --tail=20
    
    # Test endpoints
    echo "Testing health endpoint..."
    if curl -s https://health.soulfra.com | grep -q "OK"; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check failed"
    fi
    
    echo "✅ Deployment verification complete"
}

# Create monitoring dashboard
create_monitoring() {
    echo "📊 Setting up monitoring..."
    
    cat > k8s/monitoring.yaml <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard
  namespace: soulfra-cal
data:
  soulfra-dashboard.json: |
    {
      "dashboard": {
        "title": "Soulfra Services Monitor",
        "panels": [
          {
            "title": "502 Error Rate",
            "targets": [
              {
                "expr": "rate(cloudflare_errors_total{status=\"502\"}[5m])"
              }
            ]
          },
          {
            "title": "Request Rate",
            "targets": [
              {
                "expr": "rate(cloudflare_requests_total[5m])"
              }
            ]
          },
          {
            "title": "Tunnel Status",
            "targets": [
              {
                "expr": "up{job=\"cloudflared\"}"
              }
            ]
          }
        ]
      }
    }
EOF
    
    kubectl apply -f k8s/monitoring.yaml
    echo "✅ Monitoring configured"
}

# Main execution
main() {
    check_prerequisites
    create_namespaces
    setup_cloudflare_tunnel
    build_docker_images
    deploy_kubernetes_resources
    setup_cloudflare_dns
    deploy_cloudflare_worker
    create_monitoring
    verify_deployment
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "======================"
    echo ""
    echo "Your services are now accessible at:"
    echo "  - API: https://api.soulfra.com"
    echo "  - Export: https://export.soulfra.com"
    echo "  - Bridge: https://bridge.soulfra.com"
    echo "  - Login: https://login.soulfra.com"
    echo ""
    echo "502 errors should now be eliminated!"
    echo ""
    echo "Next steps:"
    echo "1. Update your application to use the new endpoints"
    echo "2. Monitor the services using: kubectl logs -f -n cloudflare deployment/cloudflared"
    echo "3. Check Worker logs in Cloudflare dashboard"
    echo "4. Set up alerts for any remaining 502s"
}

# Run main function
main "$@"
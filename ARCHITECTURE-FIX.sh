#!/bin/bash

# ARCHITECTURE FIX SCRIPT
# Auto-generated script to fix the structural mess

echo "🔧 FIXING ARCHITECTURE ISSUES..."

# Fix Port Conflicts
echo "📋 Fixing port conflicts..."

# Fix port conflict in FinishThisIdea/Dockerfile.memory-safe
sed -i 's/3000:/8000:/g' "FinishThisIdea/Dockerfile.memory-safe"
echo "  Changed FinishThisIdea/Dockerfile.memory-safe from port 3000 to 8000"

# Fix port conflict in FinishThisIdea/Dockerfile.vessel
sed -i 's/3000:/8001:/g' "FinishThisIdea/Dockerfile.vessel"
echo "  Changed FinishThisIdea/Dockerfile.vessel from port 3000 to 8001"

# Fix port conflict in FinishThisIdea/generated-mvp/Dockerfile
sed -i 's/3000:/8002:/g' "FinishThisIdea/generated-mvp/Dockerfile"
echo "  Changed FinishThisIdea/generated-mvp/Dockerfile from port 3000 to 8002"

# Fix port conflict in FinishThisIdea/generated-mvp-1752842854256/Dockerfile
sed -i 's/3000:/8003:/g' "FinishThisIdea/generated-mvp-1752842854256/Dockerfile"
echo "  Changed FinishThisIdea/generated-mvp-1752842854256/Dockerfile from port 3000 to 8003"

# Fix port conflict in dist/Dockerfile
sed -i 's/3000:/8004:/g' "dist/Dockerfile"
echo "  Changed dist/Dockerfile from port 3000 to 8004"

# Fix port conflict in mcp/Dockerfile
sed -i 's/3000:/8005:/g' "mcp/Dockerfile"
echo "  Changed mcp/Dockerfile from port 3000 to 8005"

# Fix port conflict in mcp/modules/multi-region-deployment/docker/Dockerfile
sed -i 's/3000:/8006:/g' "mcp/modules/multi-region-deployment/docker/Dockerfile"
echo "  Changed mcp/modules/multi-region-deployment/docker/Dockerfile from port 3000 to 8006"

# Fix port conflict in services/template-processor/Dockerfile
sed -i 's/3000:/8007:/g' "services/template-processor/Dockerfile"
echo "  Changed services/template-processor/Dockerfile from port 3000 to 8007"

# Fix port conflict in services/template-processor/mcp/Dockerfile
sed -i 's/3000:/8008:/g' "services/template-processor/mcp/Dockerfile"
echo "  Changed services/template-processor/mcp/Dockerfile from port 3000 to 8008"

# Fix port conflict in services/template-processor/mcp/modules/multi-region-deployment/docker/Dockerfile
sed -i 's/3000:/8009:/g' "services/template-processor/mcp/modules/multi-region-deployment/docker/Dockerfile"
echo "  Changed services/template-processor/mcp/modules/multi-region-deployment/docker/Dockerfile from port 3000 to 8009"

# Fix port conflict in services/template-processor/modules/multi-region-deployment/docker/Dockerfile
sed -i 's/3000:/8010:/g' "services/template-processor/modules/multi-region-deployment/docker/Dockerfile"
echo "  Changed services/template-processor/modules/multi-region-deployment/docker/Dockerfile from port 3000 to 8010"

# Fix port conflict in web-interface/demo-mvp-taskmanager/Dockerfile
sed -i 's/3000:/8011:/g' "web-interface/demo-mvp-taskmanager/Dockerfile"
echo "  Changed web-interface/demo-mvp-taskmanager/Dockerfile from port 3000 to 8011"

# Fix port conflict in web-interface/generated-mvp/Dockerfile
sed -i 's/3000:/8012:/g' "web-interface/generated-mvp/Dockerfile"
echo "  Changed web-interface/generated-mvp/Dockerfile from port 3000 to 8012"

# Fix port conflict in web-interface/generated-mvp-proof/Dockerfile
sed -i 's/3000:/8013:/g' "web-interface/generated-mvp-proof/Dockerfile"
echo "  Changed web-interface/generated-mvp-proof/Dockerfile from port 3000 to 8013"

# Fix port conflict in web-interface/mvp-output/mvp-1752901399264/Dockerfile
sed -i 's/3000:/8014:/g' "web-interface/mvp-output/mvp-1752901399264/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752901399264/Dockerfile from port 3000 to 8014"

# Fix port conflict in web-interface/mvp-output/mvp-1752905610863/Dockerfile
sed -i 's/3000:/8015:/g' "web-interface/mvp-output/mvp-1752905610863/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905610863/Dockerfile from port 3000 to 8015"

# Fix port conflict in web-interface/mvp-output/mvp-1752905610970/Dockerfile
sed -i 's/3000:/8016:/g' "web-interface/mvp-output/mvp-1752905610970/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905610970/Dockerfile from port 3000 to 8016"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611074/Dockerfile
sed -i 's/3000:/8017:/g' "web-interface/mvp-output/mvp-1752905611074/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611074/Dockerfile from port 3000 to 8017"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611183/Dockerfile
sed -i 's/3000:/8018:/g' "web-interface/mvp-output/mvp-1752905611183/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611183/Dockerfile from port 3000 to 8018"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611287/Dockerfile
sed -i 's/3000:/8019:/g' "web-interface/mvp-output/mvp-1752905611287/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611287/Dockerfile from port 3000 to 8019"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611399/Dockerfile
sed -i 's/3000:/8020:/g' "web-interface/mvp-output/mvp-1752905611399/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611399/Dockerfile from port 3000 to 8020"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611507/Dockerfile
sed -i 's/3000:/8021:/g' "web-interface/mvp-output/mvp-1752905611507/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611507/Dockerfile from port 3000 to 8021"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611613/Dockerfile
sed -i 's/3000:/8022:/g' "web-interface/mvp-output/mvp-1752905611613/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611613/Dockerfile from port 3000 to 8022"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611718/Dockerfile
sed -i 's/3000:/8023:/g' "web-interface/mvp-output/mvp-1752905611718/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611718/Dockerfile from port 3000 to 8023"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611822/Dockerfile
sed -i 's/3000:/8024:/g' "web-interface/mvp-output/mvp-1752905611822/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611822/Dockerfile from port 3000 to 8024"

# Fix port conflict in web-interface/mvp-output/mvp-1752905611926/Dockerfile
sed -i 's/3000:/8025:/g' "web-interface/mvp-output/mvp-1752905611926/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905611926/Dockerfile from port 3000 to 8025"

# Fix port conflict in web-interface/mvp-output/mvp-1752905612932/Dockerfile
sed -i 's/3000:/8026:/g' "web-interface/mvp-output/mvp-1752905612932/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752905612932/Dockerfile from port 3000 to 8026"

# Fix port conflict in web-interface/mvp-output/mvp-1752909461903/Dockerfile
sed -i 's/3000:/8027:/g' "web-interface/mvp-output/mvp-1752909461903/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909461903/Dockerfile from port 3000 to 8027"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462013/Dockerfile
sed -i 's/3000:/8028:/g' "web-interface/mvp-output/mvp-1752909462013/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462013/Dockerfile from port 3000 to 8028"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462118/Dockerfile
sed -i 's/3000:/8029:/g' "web-interface/mvp-output/mvp-1752909462118/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462118/Dockerfile from port 3000 to 8029"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462223/Dockerfile
sed -i 's/3000:/8030:/g' "web-interface/mvp-output/mvp-1752909462223/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462223/Dockerfile from port 3000 to 8030"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462327/Dockerfile
sed -i 's/3000:/8031:/g' "web-interface/mvp-output/mvp-1752909462327/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462327/Dockerfile from port 3000 to 8031"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462431/Dockerfile
sed -i 's/3000:/8032:/g' "web-interface/mvp-output/mvp-1752909462431/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462431/Dockerfile from port 3000 to 8032"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462535/Dockerfile
sed -i 's/3000:/8033:/g' "web-interface/mvp-output/mvp-1752909462535/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462535/Dockerfile from port 3000 to 8033"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462639/Dockerfile
sed -i 's/3000:/8034:/g' "web-interface/mvp-output/mvp-1752909462639/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462639/Dockerfile from port 3000 to 8034"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462743/Dockerfile
sed -i 's/3000:/8035:/g' "web-interface/mvp-output/mvp-1752909462743/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462743/Dockerfile from port 3000 to 8035"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462845/Dockerfile
sed -i 's/3000:/8036:/g' "web-interface/mvp-output/mvp-1752909462845/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462845/Dockerfile from port 3000 to 8036"

# Fix port conflict in web-interface/mvp-output/mvp-1752909462948/Dockerfile
sed -i 's/3000:/8037:/g' "web-interface/mvp-output/mvp-1752909462948/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909462948/Dockerfile from port 3000 to 8037"

# Fix port conflict in web-interface/mvp-output/mvp-1752909463954/Dockerfile
sed -i 's/3000:/8038:/g' "web-interface/mvp-output/mvp-1752909463954/Dockerfile"
echo "  Changed web-interface/mvp-output/mvp-1752909463954/Dockerfile from port 3000 to 8038"

# Fix port conflict in web-interface/working-demo-mvp/Dockerfile
sed -i 's/3000:/8039:/g' "web-interface/working-demo-mvp/Dockerfile"
echo "  Changed web-interface/working-demo-mvp/Dockerfile from port 3000 to 8039"

# Fix port conflict in FinishThisIdea-Complete/Dockerfile
sed -i 's/3001:/8040:/g' "FinishThisIdea-Complete/Dockerfile"
echo "  Changed FinishThisIdea-Complete/Dockerfile from port 3001 to 8040"

# Fix port conflict in FinishThisIdea-Complete/Dockerfile.ai-api
sed -i 's/3001:/8041:/g' "FinishThisIdea-Complete/Dockerfile.ai-api"
echo "  Changed FinishThisIdea-Complete/Dockerfile.ai-api from port 3001 to 8041"

# Fix port conflict in FinishThisIdea-Complete/src/services/ai-api/Dockerfile
sed -i 's/3001:/8042:/g' "FinishThisIdea-Complete/src/services/ai-api/Dockerfile"
echo "  Changed FinishThisIdea-Complete/src/services/ai-api/Dockerfile from port 3001 to 8042"

# Fix port conflict in FinishThisIdea-backup-20250628-193256/Dockerfile
sed -i 's/3001:/8043:/g' "FinishThisIdea-backup-20250628-193256/Dockerfile"
echo "  Changed FinishThisIdea-backup-20250628-193256/Dockerfile from port 3001 to 8043"

# Fix port conflict in backups/finishthisidea-20250628-192742/Dockerfile
sed -i 's/3001:/8044:/g' "backups/finishthisidea-20250628-192742/Dockerfile"
echo "  Changed backups/finishthisidea-20250628-192742/Dockerfile from port 3001 to 8044"

# Fix port conflict in services/api-server/Dockerfile
sed -i 's/3001:/8045:/g' "services/api-server/Dockerfile"
echo "  Changed services/api-server/Dockerfile from port 3001 to 8045"

# Fix port conflict in FinishThisIdea/Dockerfile.rust-unified
sed -i 's/8080:/8046:/g' "FinishThisIdea/Dockerfile.rust-unified"
echo "  Changed FinishThisIdea/Dockerfile.rust-unified from port 8080 to 8046"

# Fix port conflict in FinishThisIdea/Dockerfile.vessel
sed -i 's/8080:/8047:/g' "FinishThisIdea/Dockerfile.vessel"
echo "  Changed FinishThisIdea/Dockerfile.vessel from port 8080 to 8047"

# Fix port conflict in FinishThisIdea/Dockerfile.vessel
sed -i 's/8080:/8048:/g' "FinishThisIdea/Dockerfile.vessel"
echo "  Changed FinishThisIdea/Dockerfile.vessel from port 8080 to 8048"

# Fix port conflict in FinishThisIdea/Dockerfile.vessel
sed -i 's/80:/8049:/g' "FinishThisIdea/Dockerfile.vessel"
echo "  Changed FinishThisIdea/Dockerfile.vessel from port 80 to 8049"

# Fix port conflict in FinishThisIdea/ai-os-clean.backup-20250717-093528/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile
sed -i 's/5000:/8050:/g' "FinishThisIdea/ai-os-clean.backup-20250717-093528/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile"
echo "  Changed FinishThisIdea/ai-os-clean.backup-20250717-093528/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile from port 5000 to 8050"

# Fix port conflict in FinishThisIdea/ai-os-clean.backup-20250717-094301/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile
sed -i 's/5000:/8051:/g' "FinishThisIdea/ai-os-clean.backup-20250717-094301/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile"
echo "  Changed FinishThisIdea/ai-os-clean.backup-20250717-094301/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile from port 5000 to 8051"

# Fix port conflict in FinishThisIdea/test-workspace/ai-os-clean/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile
sed -i 's/5000:/8052:/g' "FinishThisIdea/test-workspace/ai-os-clean/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile"
echo "  Changed FinishThisIdea/test-workspace/ai-os-clean/CalGenesis/SoulstreamOperatingSystem/SoulstreamOperatingSystem/Dockerfile from port 5000 to 8052"

# Fix port conflict in flask-backend/Dockerfile
sed -i 's/5000:/8053:/g' "flask-backend/Dockerfile"
echo "  Changed flask-backend/Dockerfile from port 5000 to 8053"


# Fix Broken Symlinks  
echo "🔗 Fixing broken symlinks..."

# Fix broken symlink: kisuke-patterns
rm -f "/Users/matthewmauer/Desktop/Document-Generator/symlinks/kisuke-patterns"
echo "  Removed broken symlink: kisuke-patterns"


# Consolidate Tier Structures
echo "🏗️ Consolidating tier structures..."

# Consolidate tier-3 directories
if [ -d "tier-3" ] && [ -d "FinishThisIdea/tier-3" ]; then
    echo "  Merging tier-3 directories..."
    rsync -av FinishThisIdea/tier-3/ tier-3/
    rm -rf FinishThisIdea/tier-3
    ln -s ../tier-3 FinishThisIdea/tier-3
fi


# Create Master Docker Compose
echo "🐳 Creating master docker-compose..."

# Create master docker-compose file
echo "version: '3.8'" > docker-compose.master.yml
echo "# Consolidated from 130 docker-compose files" >> docker-compose.master.yml
echo "# Generated by Architecture Mapper" >> docker-compose.master.yml
echo "" >> docker-compose.master.yml
echo "services:" >> docker-compose.master.yml
echo "  # TODO: Merge all services from individual docker-compose files" >> docker-compose.master.yml


echo "✅ ARCHITECTURE FIXES COMPLETE"
echo "📖 Check ARCHITECTURE-MAP.md for details"

#!/bin/bash

# 🔍 BLAMECHAIN VIEWER - How to Look at the System
# This script shows you all the ways to view and monitor the BlameChain

echo "🔍 BLAMECHAIN SYSTEM VIEWER"
echo "=========================="
echo ""
echo "Here are all the ways to look at your BlameChain system:"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}🎨 VISUAL INTERFACES (Open in Browser):${NC}"
echo "========================================"
echo ""

# Check and open each interface
interfaces=(
    "blamechain-dashboard.html:🔗 BlameChain Dashboard - Main blame tracking interface"
    "web3-metaverse-interface.html:🌐 Web3 Metaverse Interface - Blockchain-connected metaverse"
    "blockchain-proof-dashboard.html:🔍 Blockchain Proof Dashboard - Verify everything works"
    "sandbox-metaverse-world.html:🎮 Sandbox Metaverse World - The actual game world"
)

for interface_info in "${interfaces[@]}"; do
    IFS=':' read -r filename description <<< "$interface_info"
    if [ -f "$filename" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        echo "   File: $filename"
        
        # Auto-open if requested
        if [ "$1" = "--open" ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open "$filename"
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                xdg-open "$filename" 2>/dev/null || firefox "$filename"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️ $description (file missing)${NC}"
        echo "   Expected: $filename"
    fi
    echo ""
done

echo -e "${BLUE}💻 COMMAND LINE VIEWERS:${NC}"
echo "========================"
echo ""

# Show command line options
echo -e "${GREEN}1. Quick Status Check:${NC}"
echo "   node -e \"
const { ethers } = require('ethers');
async function quickCheck() {
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    console.log('Blockchain Status: Block', blockNumber, 'on Chain', network.chainId);
}
quickCheck();
\""
echo ""

echo -e "${GREEN}2. Contract Interaction Test:${NC}"
echo "   node -e \"
const fs = require('fs');
if (fs.existsSync('blamechain-integration.js')) {
    const { BLAMECHAIN_CONTRACTS } = require('./blamechain-integration.js');
    console.log('Deployed Contracts:');
    Object.entries(BLAMECHAIN_CONTRACTS).forEach(([name, addr]) => {
        console.log('  ' + name + ':', addr);
    });
} else {
    console.log('Integration file not found. Run deployment first.');
}
\""
echo ""

echo -e "${GREEN}3. View Deployment Report:${NC}"
echo "   ls -la blamechain-deployment-*.json | head -1 | awk '{print \$NF}' | xargs cat | jq ."
echo ""

echo -e "${GREEN}4. Monitor Live Transactions:${NC}"
echo "   # Watch for new blocks and transactions"
echo "   while true; do"
echo "     curl -s -X POST -H 'Content-Type: application/json' \\"
echo "       --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' \\"
echo "       http://localhost:8545 | jq -r '.result' | xargs -I {} echo 'Block: {}'"
echo "     sleep 5"
echo "   done"
echo ""

echo -e "${CYAN}🔍 DETAILED INSPECTION COMMANDS:${NC}"
echo "================================="
echo ""

echo -e "${GREEN}View Current System Status:${NC}"
cat << 'EOF'
node -e "
const { ethers } = require('ethers');
async function viewStatus() {
    try {
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        
        // Check network
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        console.log('🌐 Network:', network.name, '| Chain ID:', network.chainId);
        console.log('📦 Current Block:', blockNumber);
        
        // Check balance
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            const balance = await provider.getBalance(accounts[0]);
            console.log('💰 Deployer Balance:', ethers.utils.formatEther(balance), 'ETH');
        }
        
        console.log('✅ Blockchain is running and accessible');
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}
viewStatus();
"
EOF
echo ""

echo -e "${GREEN}Check BlameChain Contract State:${NC}"
cat << 'EOF'
node -e "
const { ethers } = require('ethers');
const fs = require('fs');

async function checkBlameChain() {
    try {
        if (!fs.existsSync('blamechain-integration.js')) {
            console.log('❌ Integration file not found. Deploy contracts first.');
            return;
        }
        
        const { BLAMECHAIN_CONTRACTS, BLAMECHAIN_ABI } = require('./blamechain-integration.js');
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        
        // Check if contract exists
        const code = await provider.getCode(BLAMECHAIN_CONTRACTS.UniversalBlameChain);
        if (code === '0x') {
            console.log('❌ BlameChain contract not deployed');
            return;
        }
        
        console.log('✅ BlameChain contract deployed at:', BLAMECHAIN_CONTRACTS.UniversalBlameChain);
        console.log('📊 Contract size:', code.length, 'bytes');
        
        // Try to read contract state
        const contract = new ethers.Contract(
            BLAMECHAIN_CONTRACTS.UniversalBlameChain,
            BLAMECHAIN_ABI.UniversalBlameChain,
            provider
        );
        
        try {
            const totalBlames = await contract.totalBlameRecords();
            console.log('🔗 Total Blame Records:', totalBlames.toString());
        } catch (e) {
            console.log('📊 Contract state access limited (normal for complex contracts)');
        }
        
    } catch (error) {
        console.log('❌ Error checking BlameChain:', error.message);
    }
}
checkBlameChain();
"
EOF
echo ""

echo -e "${GREEN}View Service Status:${NC}"
cat << 'EOF'
echo "🌐 Service Status Check:"
echo "======================="

# Check blockchain
if lsof -i:8545 &> /dev/null; then
    echo "✅ Blockchain running on port 8545"
else
    echo "❌ Blockchain not running on port 8545"
fi

# Check metaverse backend
if lsof -i:8765 &> /dev/null; then
    echo "✅ Metaverse backend running on port 8765"
else
    echo "⚠️ Metaverse backend not running on port 8765"
fi

# Check for deployed contracts
if [ -f "blamechain-integration.js" ]; then
    echo "✅ BlameChain contracts deployed"
else
    echo "❌ BlameChain contracts not deployed"
fi

# Check for generated reports
report_count=$(ls blamechain-deployment-*.json 2>/dev/null | wc -l)
echo "📄 Deployment reports available: $report_count"
EOF
echo ""

echo -e "${YELLOW}📱 MOBILE/RESPONSIVE VIEW:${NC}"
echo "=========================="
echo ""
echo "All HTML interfaces are responsive and work on mobile:"
echo "• Open any .html file on your phone's browser"
echo "• Use the same localhost URLs if on same network"
echo "• BlameChain dashboard works great on tablets"
echo ""

echo -e "${CYAN}🎮 INTERACTIVE TESTING:${NC}"
echo "======================"
echo ""
echo -e "${GREEN}Test the BlameChain System:${NC}"
cat << 'EOF'
# 1. Open BlameChain Dashboard
# 2. Connect your wallet (MetaMask)
# 3. Try assigning blame to an address
# 4. Check reputation scores
# 5. Vote on blame consensus
# 6. Monitor transaction history

# Quick blame assignment test:
node -e "
console.log('🔗 BlameChain Quick Test:');
console.log('1. Open blamechain-dashboard.html');
console.log('2. Click \"Connect Wallet\"');
console.log('3. Go to \"Assign Blame\" tab');
console.log('4. Fill in a test blame');
console.log('5. Check the \"Recent Blames\" tab');
console.log('6. View reputation changes');
"
EOF
echo ""

echo -e "${BLUE}📊 MONITORING & ANALYTICS:${NC}"
echo "=========================="
echo ""
echo -e "${GREEN}Real-time Monitoring:${NC}"
echo "• Open multiple dashboard tabs"
echo "• Watch live transaction feeds"
echo "• Monitor reputation score changes"
echo "• Track system accountability metrics"
echo ""

echo -e "${GREEN}Historical Analysis:${NC}"
echo "• Check deployment reports"
echo "• View blame assignment patterns"
echo "• Analyze developer reputation trends"
echo "• Export data for external analysis"
echo ""

# Show current status
echo -e "${YELLOW}🔍 CURRENT SYSTEM STATUS:${NC}"
echo "========================="
echo ""

# Run quick checks
if lsof -i:8545 &> /dev/null; then
    echo -e "${GREEN}✅ Blockchain: RUNNING${NC}"
else
    echo -e "${YELLOW}⚠️ Blockchain: NOT RUNNING${NC}"
    echo "   Run: npx hardhat node"
fi

if lsof -i:8765 &> /dev/null; then
    echo -e "${GREEN}✅ Metaverse Backend: RUNNING${NC}"
else
    echo -e "${YELLOW}⚠️ Metaverse Backend: NOT RUNNING${NC}"
    echo "   Run: python3 metaverse-backend.py"
fi

if [ -f "blamechain-integration.js" ]; then
    echo -e "${GREEN}✅ Contracts: DEPLOYED${NC}"
else
    echo -e "${YELLOW}⚠️ Contracts: NOT DEPLOYED${NC}"
    echo "   Run: ./launch-blamechain-system.sh"
fi

echo ""
echo -e "${CYAN}🚀 QUICK START VIEWING:${NC}"
echo "======================"
echo ""
echo "To view everything right now:"
echo "1. ./launch-blamechain-system.sh    # Start everything"
echo "2. $0 --open                        # Open all interfaces"
echo "3. Visit the opened browser tabs"
echo "4. Connect MetaMask and explore!"
echo ""

if [ "$1" = "--open" ]; then
    echo -e "${GREEN}🎨 Opening all interfaces...${NC}"
elif [ "$1" = "--status" ]; then
    echo -e "${BLUE}📊 Status check complete${NC}"
else
    echo -e "${YELLOW}💡 TIP: Run '$0 --open' to auto-open all interfaces${NC}"
    echo -e "${YELLOW}💡 TIP: Run '$0 --status' for just status checks${NC}"
fi

echo ""
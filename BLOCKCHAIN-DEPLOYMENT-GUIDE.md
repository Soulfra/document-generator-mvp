# 🚀 Blockchain Deployment Guide

Complete guide for deploying and connecting the metaverse to the blockchain.

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **MetaMask** browser extension
3. **Git** for version control

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
# Copy package.json for Hardhat
cp package-hardhat.json package.json

# Install dependencies
npm install

# Create .env file
touch .env
```

### 2. Configure Environment

Add to `.env`:
```env
# For testnet deployment
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# For local development (optional)
LOCAL_RPC_URL=http://localhost:8545
```

### 3. Compile Contracts

```bash
# Compile Solidity contracts
npx hardhat compile

# This creates artifacts in:
# - artifacts/contracts/MetaverseRegistry.sol/MetaverseRegistry.json
# - artifacts/contracts/DuoPerformanceTracker.sol/DuoPerformanceTracker.json
```

### 4. Start Local Blockchain (Development)

```bash
# In terminal 1: Start Hardhat node
npx hardhat node

# This will:
# - Start a local blockchain at http://localhost:8545
# - Create 20 test accounts with 10000 ETH each
# - Display private keys for testing
```

### 5. Deploy Contracts

```bash
# In terminal 2: Deploy to local network
npm run deploy:local

# Or deploy to Goerli testnet
npm run deploy:goerli

# Output will show:
# - MetaverseRegistry address
# - DuoPerformanceTracker address
# - Save these addresses!
```

## 🌐 Connect Web3 Interface

### 1. Update Contract Addresses

Edit `web3-metaverse-interface.html`:
```javascript
const CONTRACTS = {
    metaverseRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Your deployed address
    duoTracker: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" // Your deployed address
};
```

### 2. Start Metaverse Backend

```bash
# In terminal 3: Start metaverse backend
python3 metaverse-backend.py

# This provides:
# - WebSocket server at ws://localhost:8765
# - World persistence
# - Duo system integration
```

### 3. Open Web3 Interface

```bash
# Open in browser
open web3-metaverse-interface.html

# Or use a local server
python3 -m http.server 8000
# Then visit http://localhost:8000/web3-metaverse-interface.html
```

### 4. Connect Everything

1. Click "Connect Web3" (connects to blockchain)
2. Click "Connect Wallet" (connects MetaMask)
3. Register as a player
4. Start creating buildings and tracking activity!

## 🔧 Testing the Integration

### Test Player Registration
```javascript
// In browser console
await metaverseContract.registerPlayer("YourPlayerID")
```

### Test Building Creation
```javascript
// Create a building at coordinates (10, 0, 20)
await metaverseContract.createBuilding(
    "building_test_1",
    10, 0, 20,
    "house",
    100 // cost
)
```

### Test Duo System
```javascript
// Register a duo
await metaverseContract.registerDuoSystem("duo_1")

// Record verification
await duoContract.recordVerification(
    "duo_1",
    100, // scraper results
    85,  // validator confirms
    5000, // data volume
    50000, // gas used
    "https://example.com",
    true // battlenet verified
)
```

## 📊 Monitoring

### View On-Chain Stats
- Open web3-metaverse-interface.html
- World statistics update in real-time
- Activity feed shows all blockchain events
- Transaction log tracks all operations

### Check Contract State
```bash
# Open Hardhat console
npx hardhat console --network localhost

# Get world stats
const registry = await ethers.getContractAt("MetaverseRegistry", "0x5FbDB...")
const stats = await registry.getWorldStats()
console.log("Total buildings:", stats[0].toString())
```

## 🚢 Production Deployment

### 1. Deploy to Mainnet
```bash
# Set mainnet RPC in .env
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# Deploy
npx hardhat run scripts/deploy.js --network mainnet
```

### 2. Verify Contracts
```bash
# Verify on Etherscan
npx hardhat verify --network mainnet DEPLOYED_ADDRESS
```

### 3. Update Frontend
- Use production contract addresses
- Update RPC URLs
- Enable mainnet in MetaMask

## 🛡️ Security Considerations

1. **Private Keys**: Never commit private keys
2. **Access Control**: Only authorized addresses can register duos
3. **Rate Limiting**: Implement verification limits
4. **Gas Optimization**: Batch operations when possible

## 📈 Next Steps

1. **Tokenomics**: Create ERC20 token for resources
2. **NFTs**: Mint buildings as NFTs
3. **DAO**: Governance for world rules
4. **Layer 2**: Deploy on Polygon/Arbitrum for lower fees
5. **IPFS**: Store world data decentralized

## 🐛 Troubleshooting

### "Nonce too high"
```bash
# Reset MetaMask account
Settings > Advanced > Reset Account
```

### "Insufficient funds"
```bash
# Get test ETH from faucet
# Goerli: https://goerlifaucet.com
```

### Contract not found
```bash
# Ensure you're on correct network
# Check MetaMask network matches deployment
```

## 📚 Resources

- [Hardhat Documentation](BATTLENET_INTEGRATION_DOCS.md)
- [Ethers.js Documentation](ObsidianVault/02-Documentation/doc_1755710574835_wcv53mrow_BUILD-FROM-SCRATCH-README.md)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [MetaMask Documentation](https://docs.metamask.io/)

---

🎮 **Your metaverse is now blockchain-enabled!** Track all activity on-chain and build the decentralized world of tomorrow.
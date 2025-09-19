#!/bin/bash
# BLOCKCHAIN DEPLOYMENT SCRIPT
# Deploy Document Generator to blockchain

echo "🚀 Deploying Document Generator to blockchain..."

# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network testnet

# Verify contracts
npx hardhat verify --network testnet

# Initialize with existing data
node scripts/migrate-existing-data.js

echo "✅ Deployment complete!"

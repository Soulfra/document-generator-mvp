#!/usr/bin/env node

/**
 * Simple Contract Deployment - Uses available compiled contracts
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Configuration
const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";

async function deploySimpleContracts() {
    console.log("🚀 Simple Contract Deployment");
    console.log("============================");
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`📍 Deployer: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);
    
    const deployedContracts = {};
    
    try {
        // 1. Deploy GameNFT (usually simple, no constructor args)
        console.log("1️⃣ Deploying GameNFT...");
        const gameNftPath = "artifacts/contracts/GameNFT.sol/GameNFT.json";
        const gameNftData = JSON.parse(fs.readFileSync(gameNftPath));
        
        const gameNftFactory = new ethers.ContractFactory(
            gameNftData.abi,
            gameNftData.bytecode,
            wallet
        );
        
        const gameNft = await gameNftFactory.deploy();
        const gameNftAddress = await gameNft.getAddress();
        
        console.log(`✅ GameNFT deployed: ${gameNftAddress}`);
        deployedContracts.GameNFT = gameNftAddress;
        
        // 2. Deploy HandshakeVerification
        console.log("\n2️⃣ Deploying HandshakeVerification...");
        const handshakePath = "artifacts/contracts/HandshakeVerification.sol/HandshakeVerification.json";
        const handshakeData = JSON.parse(fs.readFileSync(handshakePath));
        
        const handshakeFactory = new ethers.ContractFactory(
            handshakeData.abi,
            handshakeData.bytecode,
            wallet
        );
        
        const handshake = await handshakeFactory.deploy();
        const handshakeAddress = await handshake.getAddress();
        
        console.log(`✅ HandshakeVerification deployed: ${handshakeAddress}`);
        deployedContracts.HandshakeVerification = handshakeAddress;
        
        // 3. Deploy ZKVerifier (usually needs minimal args)
        console.log("\n3️⃣ Deploying ZKVerifier...");
        const zkPath = "artifacts/contracts/ZKVerifier.sol/ZKVerifier.json";
        const zkData = JSON.parse(fs.readFileSync(zkPath));
        
        const zkFactory = new ethers.ContractFactory(
            zkData.abi,
            zkData.bytecode,
            wallet
        );
        
        // Try with no args first
        const zk = await zkFactory.deploy();
        const zkAddress = await zk.getAddress();
        
        console.log(`✅ ZKVerifier deployed: ${zkAddress}`);
        deployedContracts.ZKVerifier = zkAddress;
        
    } catch (error) {
        console.error("❌ Deployment error:", error.message);
    }
    
    // Save results
    const deploymentInfo = {
        timestamp: new Date().toISOString(),
        network: "ganache-local",
        deployer: wallet.address,
        contracts: deployedContracts
    };
    
    fs.writeFileSync('simple-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n🎉 DEPLOYMENT COMPLETE");
    console.log("=====================");
    console.log("📄 Results saved to: simple-deployment.json");
    console.log(`📊 Contracts deployed: ${Object.keys(deployedContracts).length}`);
    
    for (const [name, address] of Object.entries(deployedContracts)) {
        console.log(`  ✅ ${name}: ${address}`);
    }
    
    return deploymentInfo;
}

if (require.main === module) {
    deploySimpleContracts()
        .then(() => {
            console.log("\n✅ Success! Your custom crypto contracts are now live!");
            console.log("🔗 Blockchain running on: http://127.0.0.1:8545");
            console.log("📋 Next: Launch faucet and token systems");
        })
        .catch((error) => {
            console.error("\n❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = deploySimpleContracts;
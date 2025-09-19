#!/usr/bin/env node

/**
 * Deploy Core Smart Contracts for Document Generator
 * Uses existing ganache instance on port 8545
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Configuration
const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"; // First ganache account

async function loadContract(contractName, fileName = null) {
    const filename = fileName || contractName;
    const artifactPath = path.join(__dirname, "artifacts", "contracts", `${filename}.sol`, `${contractName}.json`);
    
    try {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return {
            abi: artifact.abi,
            bytecode: artifact.bytecode
        };
    } catch (error) {
        console.error(`❌ Could not load contract ${contractName} from ${artifactPath}`);
        console.error(error.message);
        return null;
    }
}

async function deployContract(wallet, contractName, contractData, ...args) {
    try {
        console.log(`\n🚀 Deploying ${contractName}...`);
        
        const factory = new ethers.ContractFactory(
            contractData.abi,
            contractData.bytecode,
            wallet
        );
        
        const contract = await factory.deploy(...args);
        
        // Wait for deployment
        console.log(`⏳ Waiting for ${contractName} deployment...`);
        const receipt = await contract.waitForDeployment();
        const address = await contract.getAddress();
        
        console.log(`✅ ${contractName} deployed to: ${address}`);
        console.log(`📄 Transaction hash: ${contract.deploymentTransaction().hash}`);
        
        return {
            contract,
            address,
            receipt
        };
    } catch (error) {
        console.error(`❌ Failed to deploy ${contractName}:`, error.message);
        return null;
    }
}

async function main() {
    console.log("🔗 Document Generator - Core Contract Deployment");
    console.log("================================================");
    console.log(`🌐 RPC URL: ${RPC_URL}`);
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`📍 Deployer address: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance === 0n) {
        console.error("❌ No ETH balance. Make sure ganache is running with funded accounts.");
        process.exit(1);
    }
    
    // Contract deployment plan
    const deploymentPlan = [
        { name: "ZKVerifier", file: "ZKVerifier" },
        { name: "DeepTierSystem", file: "DeepTierSystem" },
        { name: "BlameChain", file: "BlameChain" },
        { name: "GameBroadcastRegistry", file: "GameBroadcastRegistry" },
        { name: "UnifiedSystemContract", file: "UnifiedSystemContract" }
    ];
    
    const deployedContracts = {};
    
    for (const { name, file } of deploymentPlan) {
        console.log(`\n📋 Loading ${name}...`);
        const contractData = await loadContract(name, file);
        
        if (!contractData) {
            console.warn(`⚠️ Skipping ${name} - could not load contract data`);
            continue;
        }
        
        const deployment = await deployContract(wallet, name, contractData);
        
        if (deployment) {
            deployedContracts[name] = deployment;
        }
    }
    
    // Save deployment addresses
    const deploymentInfo = {
        network: "ganache-local",
        chainId: 1337,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: {}
    };
    
    for (const [name, deployment] of Object.entries(deployedContracts)) {
        deploymentInfo.contracts[name] = {
            address: deployment.address,
            txHash: deployment.contract.deploymentTransaction().hash
        };
    }
    
    // Write deployment info
    fs.writeFileSync('deployed-contracts.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment info saved to: deployed-contracts.json");
    
    // Summary
    console.log("\n🎉 DEPLOYMENT SUMMARY");
    console.log("====================");
    console.log(`📅 Timestamp: ${deploymentInfo.timestamp}`);
    console.log(`📍 Deployer: ${deploymentInfo.deployer}`);
    console.log(`🔗 Network: ${deploymentInfo.network}`);
    console.log(`📊 Contracts deployed: ${Object.keys(deployedContracts).length}`);
    
    for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
        console.log(`  ✅ ${name}: ${info.address}`);
    }
    
    console.log("\n🚀 Your custom crypto infrastructure is now deployed and ready!");
    console.log("Next steps:");
    console.log("  1. Launch Faucet System for token distribution");
    console.log("  2. Initialize ZK proof verification");
    console.log("  3. Connect to Document Generator services");
    
    return deploymentInfo;
}

if (require.main === module) {
    main()
        .then(() => {
            console.log("\n✅ Deployment completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = { main, deployContract, loadContract };
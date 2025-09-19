// Deploy script for Metaverse smart contracts
// Run with: node deploy-contracts.js

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Contract ABIs and Bytecodes (you'll need to compile these first)
const METAVERSE_REGISTRY = {
    abi: require("./contracts/MetaverseRegistry.json").abi,
    bytecode: require("./contracts/MetaverseRegistry.json").bytecode
};

const DUO_TRACKER = {
    abi: require("./contracts/DuoPerformanceTracker.json").abi,
    bytecode: require("./contracts/DuoPerformanceTracker.json").bytecode
};

async function deploy() {
    console.log("🚀 Deploying Metaverse Contracts...\n");
    
    // Connect to local node or specify your RPC
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.RPC_URL || "http://localhost:8545"
    );
    
    // Use private key from env or default test key
    const privateKey = process.env.PRIVATE_KEY || 
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat key
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("📍 Deploying from address:", wallet.address);
    
    const balance = await wallet.getBalance();
    console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH\n");
    
    try {
        // Deploy MetaverseRegistry
        console.log("1️⃣ Deploying MetaverseRegistry...");
        const RegistryFactory = new ethers.ContractFactory(
            METAVERSE_REGISTRY.abi,
            METAVERSE_REGISTRY.bytecode,
            wallet
        );
        
        const registryContract = await RegistryFactory.deploy();
        await registryContract.deployed();
        console.log("✅ MetaverseRegistry deployed to:", registryContract.address);
        
        // Deploy DuoPerformanceTracker
        console.log("\n2️⃣ Deploying DuoPerformanceTracker...");
        const TrackerFactory = new ethers.ContractFactory(
            DUO_TRACKER.abi,
            DUO_TRACKER.bytecode,
            wallet
        );
        
        const trackerContract = await TrackerFactory.deploy(registryContract.address);
        await trackerContract.deployed();
        console.log("✅ DuoPerformanceTracker deployed to:", trackerContract.address);
        
        // Save deployment info
        const deployment = {
            network: (await provider.getNetwork()).name,
            chainId: (await provider.getNetwork()).chainId,
            contracts: {
                MetaverseRegistry: {
                    address: registryContract.address,
                    deployedAt: new Date().toISOString()
                },
                DuoPerformanceTracker: {
                    address: trackerContract.address,
                    deployedAt: new Date().toISOString()
                }
            },
            deployer: wallet.address
        };
        
        fs.writeFileSync(
            path.join(__dirname, "deployment.json"),
            JSON.stringify(deployment, null, 2)
        );
        
        console.log("\n📄 Deployment info saved to deployment.json");
        console.log("\n🎉 Deployment complete!");
        console.log("\nUpdate your web3-metaverse-interface.html with these addresses:");
        console.log(`  metaverseRegistry: "${registryContract.address}"`);
        console.log(`  duoTracker: "${trackerContract.address}"`);
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Run deployment
deploy().catch(console.error);
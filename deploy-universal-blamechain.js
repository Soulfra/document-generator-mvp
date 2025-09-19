#!/usr/bin/env node

/**
 * 🔗 UNIVERSAL BLAMECHAIN DEPLOYMENT SCRIPT
 * Deploys and integrates the complete BlameChain system with all components
 */

const { ethers } = require('ethers');
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

class UniversalBlameChainDeployer {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.deploymentReport = {
            timestamp: new Date().toISOString(),
            network: null,
            contracts: {},
            integration: {},
            proof: {}
        };
    }

    async initialize() {
        log('\n🔗 UNIVERSAL BLAMECHAIN SYSTEM DEPLOYMENT', 'bright');
        log('===========================================\n', 'bright');

        try {
            // Connect to blockchain
            this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
            const network = await this.provider.getNetwork();
            this.deploymentReport.network = network;
            
            log(`✅ Connected to network: Chain ID ${network.chainId}`, 'green');

            // Setup signer
            const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
            this.signer = new ethers.Wallet(privateKey, this.provider);
            
            log(`✅ Using deployer: ${this.signer.address}`, 'green');

            return true;
        } catch (error) {
            log(`❌ Initialization failed: ${error.message}`, 'red');
            return false;
        }
    }

    async deployCore() {
        log('\n📄 Step 1: Deploying Core Contracts', 'yellow');
        log('===================================', 'yellow');

        try {
            // Deploy MetaverseRegistry first
            log('Deploying MetaverseRegistry...', 'cyan');
            const MetaverseRegistryFactory = await hre.ethers.getContractFactory("MetaverseRegistry", this.signer);
            const metaverseRegistry = await MetaverseRegistryFactory.deploy();
            await metaverseRegistry.waitForDeployment();
            
            this.contracts.metaverseRegistry = metaverseRegistry;
            this.deploymentReport.contracts.MetaverseRegistry = metaverseRegistry.target;
            log(`✅ MetaverseRegistry: ${metaverseRegistry.target}`, 'green');

            // Deploy DuoPerformanceTracker
            log('Deploying DuoPerformanceTracker...', 'cyan');
            const DuoTrackerFactory = await hre.ethers.getContractFactory("DuoPerformanceTracker", this.signer);
            const duoTracker = await DuoTrackerFactory.deploy(metaverseRegistry.target);
            await duoTracker.waitForDeployment();
            
            this.contracts.duoTracker = duoTracker;
            this.deploymentReport.contracts.DuoPerformanceTracker = duoTracker.target;
            log(`✅ DuoPerformanceTracker: ${duoTracker.target}`, 'green');

            // Deploy Universal BlameChain
            log('Deploying UniversalBlameChain...', 'cyan');
            const BlameChainFactory = await hre.ethers.getContractFactory("UniversalBlameChain", this.signer);
            const blameChain = await BlameChainFactory.deploy(
                metaverseRegistry.target,
                duoTracker.target
            );
            await blameChain.waitForDeployment();
            
            this.contracts.blameChain = blameChain;
            this.deploymentReport.contracts.UniversalBlameChain = blameChain.target;
            log(`✅ UniversalBlameChain: ${blameChain.target}`, 'green');

            return true;
        } catch (error) {
            log(`❌ Core deployment failed: ${error.message}`, 'red');
            return false;
        }
    }

    async setupIntegration() {
        log('\n🔧 Step 2: Setting Up System Integration', 'yellow');
        log('======================================', 'yellow');

        try {
            // Register sample players
            log('Registering sample players...', 'cyan');
            const playerTx = await this.contracts.metaverseRegistry.registerPlayer("BlameChainAdmin");
            await playerTx.wait();
            log('✅ Admin player registered', 'green');

            // Register sample duo systems
            log('Registering duo systems...', 'cyan');
            const duoTx = await this.contracts.metaverseRegistry.registerDuoSystem("duo_verification_1");
            await duoTx.wait();
            log('✅ Duo system registered', 'green');

            // Test blame assignment
            log('Testing blame assignment...', 'cyan');
            const testAddress = this.signer.address;
            const blameTx = await this.contracts.blameChain.assignBlame(
                [testAddress],
                "test_system",
                "Testing blame functionality",
                "System test - not a real blame",
                ethers.keccak256(ethers.toUtf8Bytes("test_evidence")),
                3
            );
            const blameReceipt = await blameTx.wait();
            
            // Extract blame ID from event
            const blameEvent = blameReceipt.events.find(e => e.event === 'BlameAssigned');
            const blameId = blameEvent.args.blameId.toNumber();
            
            log(`✅ Test blame assigned: ID ${blameId}`, 'green');
            
            this.deploymentReport.integration = {
                testPlayerRegistered: true,
                testDuoRegistered: true,
                testBlameAssigned: blameId,
                integrationComplete: true
            };

            return true;
        } catch (error) {
            log(`❌ Integration setup failed: ${error.message}`, 'red');
            return false;
        }
    }

    async generateProof() {
        log('\n🔍 Step 3: Generating System Proof', 'yellow');
        log('=================================', 'yellow');

        try {
            // Test metaverse stats
            log('Testing metaverse stats...', 'cyan');
            const worldStats = await this.contracts.metaverseRegistry.getWorldStats();
            log(`📊 World Stats: ${worldStats[0]} buildings, ${worldStats[1]} players, ${worldStats[2]} duos`, 'blue');

            // Test blame profile
            log('Testing blame profile...', 'cyan');
            const [profile, history, risk] = await this.contracts.blameChain.getBlameProfile(this.signer.address);
            log(`👤 Blame Profile: ${profile.totalBlames} total blames, ${profile.reputationScore} reputation`, 'blue');

            // Test system accountability
            log('Testing system accountability...', 'cyan');
            const [accountability, blameHistory, systemRisk] = await this.contracts.blameChain.getSystemAccountability("test_system");
            log(`⚙️ System Accountability: ${accountability.totalBlames} blames, score ${accountability.blameScore}`, 'blue');

            this.deploymentReport.proof = {
                worldStatsWorking: true,
                blameProfileWorking: true,
                systemAccountabilityWorking: true,
                totalBlames: profile.totalBlames.toNumber(),
                reputationScore: profile.reputationScore.toNumber(),
                systemBlameScore: accountability.blameScore.toNumber(),
                proofComplete: true
            };

            return true;
        } catch (error) {
            log(`❌ Proof generation failed: ${error.message}`, 'red');
            return false;
        }
    }

    async demonstrateBlameFlow() {
        log('\n⚖️ Step 4: Demonstrating Full Blame Flow', 'yellow');
        log('=======================================', 'yellow');

        try {
            // Create a building (to simulate metaverse activity)
            log('Creating test building in metaverse...', 'cyan');
            const buildingTx = await this.contracts.metaverseRegistry.createBuilding(
                "blame_test_building",
                10, 0, 20,
                "tower",
                200
            );
            await buildingTx.wait();
            log('✅ Test building created', 'green');

            // Assign blame for building failure
            log('Assigning blame for building failure...', 'cyan');
            const blameTx = await this.contracts.blameChain.assignBlame(
                [this.signer.address],
                "metaverse",
                "Building collapse due to poor construction",
                "The building collapsed due to inadequate foundation validation",
                ethers.keccak256(ethers.toUtf8Bytes("building_collapse_evidence")),
                7
            );
            const blameReceipt = await blameTx.wait();
            const blameEvent = blameReceipt.events.find(e => e.event === 'BlameAssigned');
            const blameId = blameEvent.args.blameId.toNumber();
            log(`✅ Blame assigned for building failure: ID ${blameId}`, 'green');

            // Simulate duo system failure
            log('Recording duo system verification failure...', 'cyan');
            const duoFailureTx = await this.contracts.duoTracker.recordVerification(
                "duo_verification_1",
                100, // scraper results
                50,  // validator confirms (50% failure rate)
                5000, // data volume
                75000, // gas used
                "https://test.example.com",
                false // not battlenet verified
            );
            await duoFailureTx.wait();
            log('✅ Duo failure recorded', 'green');

            // Assign blame from duo failure using integration
            log('Triggering blame from duo failure...', 'cyan');
            const duoBlameTx = await this.contracts.blameChain.blameFromDuoFailure(
                "duo_verification_1",
                this.signer.address,
                15, // failed verifications
                "Repeated verification failures - operator negligence"
            );
            const duoBlameReceipt = await duoBlameTx.wait();
            const duoBlameEvent = duoBlameReceipt.events.find(e => e.event === 'BlameAssigned');
            const duoBlameId = duoBlameEvent.args.blameId.toNumber();
            log(`✅ Duo blame assigned: ID ${duoBlameId}`, 'green');

            // Demonstrate consensus voting (if blame severity is high enough)
            if (blameEvent.args.severity >= 5) {
                log('Testing consensus voting mechanism...', 'cyan');
                try {
                    const voteTx = await this.contracts.blameChain.voteOnBlame(blameId, true);
                    await voteTx.wait();
                    log('✅ Consensus vote submitted', 'green');
                } catch (error) {
                    log('⚠️ Consensus voting not available (may require setup)', 'yellow');
                }
            }

            // Show final blame statistics
            log('Final blame statistics:', 'cyan');
            const finalProfile = await this.contracts.blameChain.getBlameProfile(this.signer.address);
            log(`📊 Final Reputation: ${finalProfile[0].reputationScore}`, 'blue');
            log(`📊 Total Blames: ${finalProfile[0].totalBlames}`, 'blue');
            log(`📊 Resolved Blames: ${finalProfile[0].resolvedBlames}`, 'blue');

            this.deploymentReport.proof.demonstrationComplete = true;
            this.deploymentReport.proof.finalReputation = finalProfile[0].reputationScore.toNumber();
            this.deploymentReport.proof.totalBlamesAfterDemo = finalProfile[0].totalBlames.toNumber();

            return true;
        } catch (error) {
            log(`❌ Blame flow demonstration failed: ${error.message}`, 'red');
            return false;
        }
    }

    async generateReport() {
        log('\n📋 Step 5: Generating Deployment Report', 'yellow');
        log('=====================================', 'yellow');

        try {
            // Get final system stats
            const networkStats = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getGasPrice();

            this.deploymentReport.finalStats = {
                networkName: networkStats.name,
                chainId: networkStats.chainId,
                blockNumber,
                gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
                deployerAddress: this.signer.address,
                deployerBalance: ethers.formatEther(await this.signer.getBalance()) + ' ETH'
            };

            // Save deployment report
            const reportPath = path.join(__dirname, `blamechain-deployment-${Date.now()}.json`);
            fs.writeFileSync(reportPath, JSON.stringify(this.deploymentReport, null, 2));
            log(`✅ Deployment report saved: ${reportPath}`, 'green');

            // Generate integration code
            await this.generateIntegrationCode();

            // Generate dashboard update
            await this.updateDashboard();

            return true;
        } catch (error) {
            log(`❌ Report generation failed: ${error.message}`, 'red');
            return false;
        }
    }

    async generateIntegrationCode() {
        log('Generating integration code...', 'cyan');

        const integrationCode = `
// 🔗 BLAMECHAIN INTEGRATION CODE
// Generated automatically by Universal BlameChain Deployer

const BLAMECHAIN_CONTRACTS = {
    MetaverseRegistry: "${this.contracts.metaverseRegistry.target}",
    DuoPerformanceTracker: "${this.contracts.duoTracker.target}",
    UniversalBlameChain: "${this.contracts.blameChain.target}"
};

const BLAMECHAIN_ABI = {
    UniversalBlameChain: ${JSON.stringify(require('./artifacts/contracts/UniversalBlameChain.sol/UniversalBlameChain.json').abi, null, 4)}
};

// Example usage:
// const blameChain = new ethers.Contract(
//     BLAMECHAIN_CONTRACTS.UniversalBlameChain,
//     BLAMECHAIN_ABI.UniversalBlameChain,
//     signer
// );
//
// await blameChain.assignBlame(
//     [blamedAddress],
//     "component",
//     "action",
//     "reason", 
//     evidenceHash,
//     severity
// );

module.exports = {
    BLAMECHAIN_CONTRACTS,
    BLAMECHAIN_ABI
};
        `;

        const integrationPath = path.join(__dirname, 'blamechain-integration.js');
        fs.writeFileSync(integrationPath, integrationCode);
        log(`✅ Integration code generated: ${integrationPath}`, 'green');
    }

    async updateDashboard() {
        log('Updating dashboard configuration...', 'cyan');

        // Update contract addresses in dashboard
        const dashboardPath = path.join(__dirname, 'blamechain-dashboard.html');
        if (fs.existsSync(dashboardPath)) {
            let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
            
            // Replace contract address placeholder
            dashboardContent = dashboardContent.replace(
                'const BLAMECHAIN_CONTRACT = "0x0000000000000000000000000000000000000003"',
                `const BLAMECHAIN_CONTRACT = "${this.contracts.blameChain.target}"`
            );

            fs.writeFileSync(dashboardPath, dashboardContent);
            log('✅ Dashboard updated with contract addresses', 'green');
        }
    }

    async displaySummary() {
        log('\n🎉 UNIVERSAL BLAMECHAIN DEPLOYMENT COMPLETE!', 'bright');
        log('=============================================\n', 'bright');

        log('📋 DEPLOYMENT SUMMARY:', 'yellow');
        log('====================', 'yellow');
        
        Object.entries(this.deploymentReport.contracts).forEach(([name, address]) => {
            log(`  ${name}: ${address}`, 'green');
        });

        log('\n🔧 INTEGRATION STATUS:', 'yellow');
        log('===================', 'yellow');
        log(`  Test Player Registered: ${this.deploymentReport.integration.testPlayerRegistered ? '✅' : '❌'}`, 'cyan');
        log(`  Test Duo Registered: ${this.deploymentReport.integration.testDuoRegistered ? '✅' : '❌'}`, 'cyan');
        log(`  Test Blame Assigned: ${this.deploymentReport.integration.testBlameAssigned || 'N/A'}`, 'cyan');
        log(`  Integration Complete: ${this.deploymentReport.integration.integrationComplete ? '✅' : '❌'}`, 'cyan');

        log('\n🔍 PROOF VERIFICATION:', 'yellow');
        log('===================', 'yellow');
        log(`  World Stats Working: ${this.deploymentReport.proof.worldStatsWorking ? '✅' : '❌'}`, 'cyan');
        log(`  Blame Profile Working: ${this.deploymentReport.proof.blameProfileWorking ? '✅' : '❌'}`, 'cyan');
        log(`  System Accountability Working: ${this.deploymentReport.proof.systemAccountabilityWorking ? '✅' : '❌'}`, 'cyan');
        log(`  Final Reputation Score: ${this.deploymentReport.proof.finalReputation || 'N/A'}`, 'cyan');
        log(`  Total Blames After Demo: ${this.deploymentReport.proof.totalBlamesAfterDemo || 'N/A'}`, 'cyan');

        log('\n🌐 ACCESS POINTS:', 'yellow');
        log('===============', 'yellow');
        log('  Dashboard: blamechain-dashboard.html', 'green');
        log('  Integration Code: blamechain-integration.js', 'green');
        log('  Web3 Interface: web3-metaverse-interface.html', 'green');
        log('  Proof Dashboard: blockchain-proof-dashboard.html', 'green');

        log('\n📊 NEXT STEPS:', 'yellow');
        log('=============', 'yellow');
        log('  1. Open blamechain-dashboard.html to view the blame tracking interface', 'blue');
        log('  2. Use web3-metaverse-interface.html to interact with the metaverse', 'blue');
        log('  3. Run blockchain-proof-dashboard.html to verify the integration', 'blue');
        log('  4. Use the generated integration code in your applications', 'blue');
        log('  5. Monitor blame assignments and reputation scores', 'blue');

        log('\n✨ THE UNIVERSAL BLAMECHAIN IS NOW LIVE!', 'bright');
        log('Every action in your metaverse is now tracked and accountable!', 'green');
    }

    async run() {
        const success = await this.initialize() &&
                       await this.deployCore() &&
                       await this.setupIntegration() &&
                       await this.generateProof() &&
                       await this.demonstrateBlameFlow() &&
                       await this.generateReport();

        if (success) {
            await this.displaySummary();
            process.exit(0);
        } else {
            log('\n❌ DEPLOYMENT FAILED!', 'red');
            log('Check the errors above and try again.', 'red');
            process.exit(1);
        }
    }
}

// Run the deployment
async function main() {
    const deployer = new UniversalBlameChainDeployer();
    await deployer.run();
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
});

main().catch(console.error);
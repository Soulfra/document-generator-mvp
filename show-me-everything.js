#!/usr/bin/env node

/**
 * 👁️ SHOW ME EVERYTHING - BlameChain System Viewer
 * One command to see the entire system status and open all interfaces
 */

const { exec } = require('child_process');
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

function checkPort(port) {
    return new Promise((resolve) => {
        exec(`lsof -i:${port}`, (error) => {
            resolve(!error);
        });
    });
}

function openFile(filename) {
    const platform = process.platform;
    let command;
    
    if (platform === 'darwin') {
        command = `open "${filename}"`;
    } else if (platform === 'linux') {
        command = `xdg-open "${filename}" || firefox "${filename}"`;
    } else {
        command = `start "${filename}"`;
    }
    
    exec(command, (error) => {
        if (error) {
            log(`❌ Failed to open ${filename}`, 'red');
        } else {
            log(`✅ Opened ${filename}`, 'green');
        }
    });
}

async function showSystemStatus() {
    log('\n👁️ BLAMECHAIN SYSTEM STATUS', 'bright');
    log('===========================\n', 'bright');

    // Check services
    log('🔍 Service Status:', 'yellow');
    
    const blockchainRunning = await checkPort(8545);
    if (blockchainRunning) {
        log('  ✅ Blockchain (port 8545): RUNNING', 'green');
    } else {
        log('  ❌ Blockchain (port 8545): NOT RUNNING', 'red');
    }

    const metaverseRunning = await checkPort(8765);
    if (metaverseRunning) {
        log('  ✅ Metaverse Backend (port 8765): RUNNING', 'green');
    } else {
        log('  ⚠️ Metaverse Backend (port 8765): NOT RUNNING', 'yellow');
    }

    log('');

    // Check files
    log('📁 File Status:', 'yellow');
    
    const requiredFiles = [
        'blamechain-dashboard.html',
        'web3-metaverse-interface.html', 
        'blockchain-proof-dashboard.html',
        'blamechain-integration.js',
        'contracts/UniversalBlameChain.sol'
    ];

    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            log(`  ✅ ${file}`, 'green');
        } else {
            log(`  ❌ ${file}`, 'red');
        }
    });

    log('');

    // Check deployment
    log('🚀 Deployment Status:', 'yellow');
    
    if (fs.existsSync('blamechain-integration.js')) {
        try {
            const integration = require('./blamechain-integration.js');
            log('  ✅ Contracts deployed:', 'green');
            Object.entries(integration.BLAMECHAIN_CONTRACTS).forEach(([name, address]) => {
                log(`    ${name}: ${address}`, 'cyan');
            });
        } catch (error) {
            log('  ⚠️ Integration file exists but may be invalid', 'yellow');
        }
    } else {
        log('  ❌ Contracts not deployed', 'red');
    }

    log('');
}

async function showQuickStats() {
    log('📊 Quick Blockchain Stats:', 'yellow');
    
    try {
        const { ethers } = require('ethers');
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const gasPrice = await provider.getGasPrice();
        
        log(`  Chain ID: ${network.chainId}`, 'cyan');
        log(`  Current Block: ${blockNumber}`, 'cyan');
        log(`  Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`, 'cyan');
        
        // Check deployer balance
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            const balance = await provider.getBalance(accounts[0]);
            log(`  Deployer Balance: ${ethers.utils.formatEther(balance)} ETH`, 'cyan');
        }
        
    } catch (error) {
        log('  ❌ Cannot connect to blockchain', 'red');
    }
    
    log('');
}

async function openAllInterfaces() {
    log('🎨 Opening User Interfaces:', 'yellow');
    
    const interfaces = [
        'blamechain-dashboard.html',
        'web3-metaverse-interface.html',
        'blockchain-proof-dashboard.html'
    ];
    
    interfaces.forEach(file => {
        if (fs.existsSync(file)) {
            openFile(file);
        } else {
            log(`  ❌ ${file} not found`, 'red');
        }
    });
    
    log('');
}

function showUsageInstructions() {
    log('📖 How to Use the BlameChain System:', 'yellow');
    log('===================================', 'yellow');
    log('');
    
    log('1. 🔗 BlameChain Dashboard:', 'green');
    log('   • Assign blame to developers/systems', 'cyan');
    log('   • Vote on blame consensus', 'cyan');
    log('   • Monitor reputation scores', 'cyan');
    log('   • View system accountability', 'cyan');
    log('');
    
    log('2. 🌐 Web3 Metaverse Interface:', 'green');
    log('   • Connect your wallet', 'cyan');
    log('   • Register as a player', 'cyan');
    log('   • Create buildings', 'cyan');
    log('   • Monitor duo systems', 'cyan');
    log('');
    
    log('3. 🔍 Blockchain Proof Dashboard:', 'green');
    log('   • Verify system integration', 'cyan');
    log('   • Run automated tests', 'cyan');
    log('   • Check contract deployment', 'cyan');
    log('   • Monitor live activity', 'cyan');
    log('');
}

function showTroubleshooting() {
    log('🛠️ Troubleshooting:', 'yellow');
    log('==================', 'yellow');
    log('');
    
    log('If services are not running:', 'cyan');
    log('  ./launch-blamechain-system.sh', 'green');
    log('');
    
    log('If contracts are not deployed:', 'cyan');
    log('  node deploy-universal-blamechain.js', 'green');
    log('');
    
    log('If blockchain is not running:', 'cyan');
    log('  npx hardhat node', 'green');
    log('');
    
    log('If MetaMask connection fails:', 'cyan');
    log('  • Add localhost:8545 as custom RPC', 'green');
    log('  • Chain ID: 31337', 'green');
    log('  • Import test account private key', 'green');
    log('');
}

async function main() {
    log('\n👁️ SHOW ME EVERYTHING - BlameChain System Overview', 'bright');
    log('==================================================\n', 'bright');

    await showSystemStatus();
    await showQuickStats();
    
    // Auto-open interfaces if requested
    if (process.argv.includes('--open')) {
        await openAllInterfaces();
    }
    
    showUsageInstructions();
    
    if (process.argv.includes('--help')) {
        showTroubleshooting();
    }
    
    log('🎯 Quick Commands:', 'yellow');
    log('=================', 'yellow');
    log('  node show-me-everything.js --open     # Open all interfaces', 'green');
    log('  node show-me-everything.js --help     # Show troubleshooting', 'green');
    log('  ./view-blamechain.sh --open           # Alternative viewer', 'green');
    log('  ./launch-blamechain-system.sh         # Start everything', 'green');
    log('');
    
    // Show quick test command
    log('🧪 Quick Test:', 'yellow');
    log('=============', 'yellow');
    log('Open the BlameChain Dashboard and try:', 'cyan');
    log('1. Connect your wallet', 'green');
    log('2. Go to "Assign Blame" tab', 'green');
    log('3. Blame address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'green');
    log('4. Component: test_system', 'green');
    log('5. Action: Testing blame system', 'green');
    log('6. Reason: This is a test blame', 'green');
    log('7. Severity: 5', 'green');
    log('8. Click "Assign Blame"', 'green');
    log('9. Check "Recent Blames" tab for your blame!', 'green');
    log('');
    
    log('✨ Your BlameChain system is ready to track accountability!', 'bright');
}

main().catch(console.error);
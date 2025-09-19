#!/usr/bin/env node

/**
 * 🧪 UTP PACKAGES TEST
 * Test script to verify all UTP packages work together
 */

const chalk = require('chalk');
const { execSync } = require('child_process');

console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════╗
║  🧪 TESTING UTP PACKAGES                                  ║
╚══════════════════════════════════════════════════════════╝
`));

// Test functions
const tests = [
    {
        name: 'UTP Core CLI',
        command: 'node packages/utp-core/cli.js --help',
        description: 'Testing UTP core command interface'
    },
    {
        name: 'CAL Interpreter',
        command: 'echo "go to marketplace" | node packages/cal-interpreter/cli.js parse',
        description: 'Testing natural language parsing'
    },
    {
        name: 'AMM Aggregator',
        command: 'node packages/utp-amm-aggregator/cli.js --help',
        description: 'Testing AMM rate aggregator'
    },
    {
        name: 'UTP Zone Status',
        command: 'node packages/utp-core/cli.js zone status',
        description: 'Testing zone status command'
    },
    {
        name: 'CAL Examples',
        command: 'node packages/cal-interpreter/cli.js examples',
        description: 'Show CAL command examples'
    },
    {
        name: 'AMM Protocols',
        command: 'node packages/utp-amm-aggregator/cli.js protocols',
        description: 'List supported DEX protocols'
    }
];

// Run tests
async function runTests() {
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        console.log(chalk.blue(`\n🔧 ${test.name}`));
        console.log(chalk.gray(`   ${test.description}`));
        
        try {
            const output = execSync(test.command, { encoding: 'utf8' });
            console.log(chalk.green('   ✅ PASSED'));
            if (output.trim()) {
                console.log(chalk.gray('   Output preview:'));
                console.log(chalk.gray(output.split('\n').slice(0, 5).map(l => '     ' + l).join('\n')));
            }
            passed++;
        } catch (error) {
            console.log(chalk.red('   ❌ FAILED'));
            console.log(chalk.red(`   Error: ${error.message}`));
            failed++;
        }
    }
    
    // Summary
    console.log(chalk.cyan(`\n╔══════════════════════════════════════════════════════════╗`));
    console.log(chalk.cyan(`║  📊 TEST SUMMARY                                          ║`));
    console.log(chalk.cyan(`╚══════════════════════════════════════════════════════════╝`));
    console.log(chalk.green(`   ✅ Passed: ${passed}`));
    console.log(chalk.red(`   ❌ Failed: ${failed}`));
    console.log(chalk.bold(`   📈 Success Rate: ${(passed / tests.length * 100).toFixed(0)}%\n`));
    
    // Integration example
    if (failed === 0) {
        console.log(chalk.cyan('\n🎯 Integration Example:\n'));
        console.log(chalk.gray('1. Use CAL to interpret: "Find best rate for ETH to USDC"'));
        console.log(chalk.gray('2. CAL returns: { action: "amm_query", tokenIn: "ETH", tokenOut: "USDC" }'));
        console.log(chalk.gray('3. UTP Core routes to AMM Aggregator'));
        console.log(chalk.gray('4. AMM Aggregator finds best rate across all DEXs'));
        console.log(chalk.gray('5. Results displayed with MEV protection info\n'));
        
        console.log(chalk.green('✨ All packages are working correctly!'));
        console.log(chalk.gray('\n💡 Try these commands:'));
        console.log(chalk.blue('   npm run utp'));
        console.log(chalk.blue('   npm run cal'));
        console.log(chalk.blue('   npm run utp:amm\n'));
    }
}

// Run the tests
runTests().catch(console.error);